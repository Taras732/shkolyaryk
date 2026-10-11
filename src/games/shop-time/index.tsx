import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle, randInt } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Крамниця і час» (11.10.2026) — 3 клас:
 *  d1 — ціна, кількість, вартість: за двома знайти третє;
 *  d2 — зведення до одиниці й четверте пропорційне;
 *  d3 — тривалість подій: початок, тривалість, кінець (в межах доби).
 */

export type Item = { nom: string; few: string; many: string };
export const ITEMS: Item[] = [
  { nom: 'зошит', few: 'зошити', many: 'зошитів' },
  { nom: 'олівець', few: 'олівці', many: 'олівців' },
  { nom: 'булочка', few: 'булочки', many: 'булочок' },
  { nom: 'ручка', few: 'ручки', many: 'ручок' },
  { nom: 'наліпка', few: 'наліпки', many: 'наліпок' },
  { nom: 'морквина', few: 'морквини', many: 'морквин' },
];
export function plural(n: number, it: Item): string {
  const m100 = n % 100, m10 = n % 10;
  if (m100 >= 11 && m100 <= 14) return it.many;
  if (m10 === 1) return it.nom;
  if (m10 >= 2 && m10 <= 4) return it.few;
  return it.many;
}
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

type Ctx = { name: string; start: string; end: string; last: string; pr: string };
export const EVENTS: Ctx[] = [
  { name: 'Урок', start: 'почався', end: 'закінчився', last: 'тривав', pr: 'він' },
  { name: 'Мультфільм', start: 'почався', end: 'закінчився', last: 'тривав', pr: 'він' },
  { name: 'Тренування', start: 'почалося', end: 'закінчилося', last: 'тривало', pr: 'воно' },
  { name: 'Концерт', start: 'почався', end: 'закінчився', last: 'тривав', pr: 'він' },
  { name: 'Екскурсія', start: 'почалася', end: 'закінчилася', last: 'тривала', pr: 'вона' },
  { name: 'Перерва', start: 'почалася', end: 'закінчилася', last: 'тривала', pr: 'вона' },
];

export const fmtTime = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
export const fmtDur = (m: number) => {
  const h = Math.floor(m / 60), r = m % 60;
  return h === 0 ? `${r} хв` : r === 0 ? `${h} год` : `${h} год ${r} хв`;
};

export type Payload =
  | { mode: 'price'; q: string; find: 'cost' | 'price' | 'qty'; price: number; qty: number; options: string[] }
  | { mode: 'unit'; q: string; q1: number; t1: number; q2: number; options: string[] }
  | { mode: 'time'; q: string; find: 'end' | 'dur' | 'start'; start: number; dur: number; options: string[] };
type Answer = string;

function numOptions(ans: number, extras: number[], n = 4, min = 1): string[] {
  const pool: number[] = [];
  for (const e of shuffle(extras)) if (e >= min && e !== ans && !pool.includes(e)) pool.push(e);
  for (const d of [1, -1, 2, -2, 10, -10, 3, -3, 5, -5]) {
    if (pool.length >= n - 1) break;
    const v = ans + d;
    if (v >= min && v !== ans && !pool.includes(v)) pool.push(v);
  }
  return shuffle([ans, ...pool.slice(0, n - 1)]).map(String);
}

function priceRound(find: 'cost' | 'price' | 'qty'): Omit<Round<Payload, Answer>, 'id'> {
  const it = shuffle(ITEMS)[0];
  const price = randInt(3, 15), qty = randInt(2, 9), cost = price * qty;
  if (find === 'cost') {
    return { payload: { mode: 'price', q: `${cap(it.nom)} коштує ${price} грн. Скільки коштують ${qty} ${plural(qty, it)}?`, find, price, qty, options: numOptions(cost, [price + qty, cost + price, cost - price, price * (qty + 1), price * (qty - 1)]) }, answer: String(cost) };
  }
  if (find === 'price') {
    return { payload: { mode: 'price', q: `За ${qty} ${plural(qty, it)} заплатили ${cost} грн. Скільки коштує одна штука?`, find, price, qty, options: numOptions(price, [cost - qty, cost + qty, qty, price + 1, price - 1, cost]) }, answer: String(price) };
  }
  return { payload: { mode: 'price', q: `${cap(it.nom)} коштує ${price} грн. Оксана заплатила за покупку ${cost} грн. Скільки штук вона купила?`, find, price, qty, options: numOptions(qty, [cost - price, cost + price, price, qty + 1, qty - 1, qty * 2]) }, answer: String(qty) };
}

function unitRound(): Omit<Round<Payload, Answer>, 'id'> {
  const u = randInt(3, 12), q1 = randInt(2, 6);
  let q2 = randInt(3, 9);
  if (q2 === q1) q2 += 1;
  const t1 = u * q1, ans = u * q2;
  const kind = randInt(0, 2);
  let q: string;
  if (kind === 0) {
    const it = shuffle(ITEMS)[0];
    q = `${q1} ${plural(q1, it)} коштують ${t1} грн. Скільки коштують ${q2} таких ${plural(q2, it)}?`;
  } else if (kind === 1) {
    q = `У ${q1} однакових коробках лежать ${t1} олівців. Скільки олівців у ${q2} таких коробках?`;
  } else {
    const h: Item = { nom: 'година', few: 'години', many: 'годин' };
    q = `Велосипедист за ${q1} ${plural(q1, h)} проїхав ${t1} км. Скільки кілометрів він проїде за ${q2} ${plural(q2, h)} з такою самою швидкістю?`;
  }
  return { payload: { mode: 'unit', q, q1, t1, q2, options: numOptions(ans, [u, t1 + q2, t1 * q2, ans + u, ans - u, t1 + u * (q2 - q1) + u]) }, answer: String(ans) };
}

function timeRound(find: 'end' | 'dur' | 'start'): Omit<Round<Payload, Answer>, 'id'> {
  const ev = shuffle(EVENTS)[0];
  const dur = randInt(4, 36) * 5; // 20..180 хв
  const start = randInt(8 * 12, 18 * 12) * 5; // 8:00..18:00
  const end = start + dur;
  const base = { start, dur };
  if (find === 'end') {
    const cands = [end + 5, end - 5, end + 10, end - 10, end + 60, end - 60, end + 15, end - 15].filter((v) => v > start && v < 1440);
    return { payload: { mode: 'time', q: `${ev.name} ${ev.start} о ${fmtTime(start)} і ${ev.last} ${fmtDur(dur)}. О котрій ${ev.end}?`, find, ...base, options: pick4(end, cands).map(fmtTime) }, answer: fmtTime(end) };
  }
  if (find === 'dur') {
    const cands = [dur + 5, dur - 5, dur + 10, dur - 10, dur + 60, dur - 60, dur + 15, dur - 15].filter((v) => v > 0);
    return { payload: { mode: 'time', q: `${ev.name} ${ev.start} о ${fmtTime(start)}, а ${ev.end} о ${fmtTime(end)}. Скільки часу це тривало?`, find, ...base, options: pick4(dur, cands).map(fmtDur) }, answer: fmtDur(dur) };
  }
  const cands = [start + 5, start - 5, start + 10, start - 10, start + 60, start - 60, start + 15, start - 15].filter((v) => v > 0 && v + dur < 1440);
  return { payload: { mode: 'time', q: `${ev.name} ${ev.end} о ${fmtTime(end)} і ${ev.last} ${fmtDur(dur)}. О котрій ${ev.pr} ${ev.start}?`, find, ...base, options: pick4(start, cands).map(fmtTime) }, answer: fmtTime(start) };
}

function pick4(ans: number, cands: number[]): number[] {
  const pool: number[] = [];
  for (const c of shuffle(cands)) if (c !== ans && !pool.includes(c)) pool.push(c);
  return shuffle([ans, ...pool.slice(0, 3)]);
}

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const items: Omit<Round<Payload, Answer>, 'id'>[] = [];
  if (difficulty === 1) {
    const finds = shuffle(['cost', 'cost', 'price', 'price', 'qty'] as const);
    for (const f of finds) items.push(priceRound(f));
  } else if (difficulty === 2) {
    for (let i = 0; i < 5; i++) items.push(unitRound());
  } else {
    const finds = shuffle(['end', 'end', 'dur', 'dur', 'start'] as const);
    for (const f of finds) items.push(timeRound(f));
  }
  return { difficulty, rounds: shuffle(items).map((r, i) => ({ ...r, id: `r${i}` })) };
}

export const PHRASES = {
  price: { key: 'p_shop_price', text: 'Ціна, кількість, вартість. Прочитай задачу й знайди відповідь.' },
  unit: { key: 'p_shop_unit', text: 'Спершу дізнайся, скільки припадає на одну штуку. Прочитай задачу.' },
  time: { key: 'p_shop_time', text: 'Скільки триває подія? Прочитай задачу й знайди відповідь.' },
} as const;

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = PHRASES[p.mode];
  const say = hasUkAudio(phrase.key) ? () => sayUkSeq([phrase]) : undefined;
  const suffix = p.mode === 'price' && p.find !== 'qty' ? ' грн' : '';
  return (
    <>
      <PromptCard question={p.q} answerState={answerState} say={say} sayKey={round.id} />
      <ChoiceGrid options={p.options.map((o) => ({ value: o, node: <span style={{ fontSize: 22, fontWeight: 800 }}>{o}{suffix}</span> }))}
        correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={2} />
    </>
  );
}

const shopTime: GameDefinition<Payload, Answer> = {
  id: 'shop-time',
  title: 'Крамниця і час',
  subject: 'math',
  levels: ['L3'],
  icon: '🛒',
  description: 'Ціна, кількість і вартість, задачі на зведення до одиниці, тривалість подій.',
  accent: '#DCFCE7',
  skillsFor: (d) => (d === 1 ? ['math.measure.l3.related-quantities'] : d === 2 ? ['math.ops.l3.problem-types'] : ['math.measure.l3.time-span']),
  explain: (round) => {
    const p = round.payload;
    if (p.mode === 'price') {
      const cost = p.price * p.qty;
      if (p.find === 'cost') return { steps: ['Вартість = ціна · кількість.', `${p.price} · ${p.qty} = ${cost} грн.`] };
      if (p.find === 'price') return { steps: ['Ціна = вартість : кількість.', `${cost} : ${p.qty} = ${p.price} грн.`] };
      return { steps: ['Кількість = вартість : ціна.', `${cost} : ${p.price} = ${p.qty}.`] };
    }
    if (p.mode === 'unit') {
      const u = p.t1 / p.q1;
      return { steps: [`Спершу знайдемо на одну: ${p.t1} : ${p.q1} = ${u}.`, `Тепер на ${p.q2}: ${u} · ${p.q2} = ${u * p.q2}.`] };
    }
    const h = Math.floor(p.dur / 60), m = p.dur % 60;
    if (p.find === 'end') return { steps: [`До ${fmtTime(p.start)} додаємо ${fmtDur(p.dur)}: спершу години (+${h}), потім хвилини (+${m}).`, `Закінчилось о ${fmtTime(p.start + p.dur)}.`] };
    if (p.find === 'dur') return { steps: [`Від ${fmtTime(p.start)} до ${fmtTime(p.start + p.dur)}: спершу дійди до цілої години, потім додай решту.`, `Разом ${fmtDur(p.dur)}.`] };
    return { steps: [`Від ${fmtTime(p.start + p.dur)} віднімаємо ${fmtDur(p.dur)}: спершу години, потім хвилини.`, `Почалося о ${fmtTime(p.start)}.`] };
  },
  generate,
  Component,
};

export default shopTime;
