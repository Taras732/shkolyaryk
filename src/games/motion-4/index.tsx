import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle, randInt } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Рух і робота» (11.10.2026) — 4 клас, текстові задачі:
 *  d1 — швидкість, час, відстань (знайти одне з трьох);
 *  d2 — зустрічний рух і рух у протилежних напрямках;
 *  d3 — задачі на роботу й вартість у 2–3 дії.
 */

export const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

function pick3(ans: number, cands: number[]): number[] {
  const out: number[] = [];
  const ok = (c: number) => Number.isInteger(c) && c > 0 && c !== ans && !out.includes(c);
  for (const c of shuffle(cands)) if (ok(c) && out.length < 3) out.push(c);
  for (const k of [1, 2, 10, 5, 20]) for (const c of [ans + k, ans - k]) if (out.length < 3 && ok(c)) out.push(c);
  return out;
}
const withUnit = (ans: number, cands: number[], unit: string) => ({
  options: shuffle([ans, ...pick3(ans, cands)].map((n) => `${fmt(n)} ${unit}`)),
  answer: `${fmt(ans)} ${unit}`,
});

type Payload =
  | { mode: 'sp'; kind: 's' | 'v' | 't'; v: number; t: number; s: number; q: string; options: string[]; steps: string[] }
  | { mode: 'meetT' | 'meetS' | 'oppS' | 'oppV'; v1: number; v2: number; t: number; d: number; q: string; options: string[]; steps: string[] }
  | { mode: 'cost2' | 'costUnit' | 'work' | 'crew' | 'snail'; nums: number[]; q: string; options: string[]; steps: string[] };
type Answer = string;
type Item = Omit<Round<Payload, Answer>, 'id'>;

// ---------- d1 ----------
interface Ctx1 { su: string; vu: string; tu: string; vr: number[]; tr: number[]; text: Record<'s' | 'v' | 't', (v: number, t: number, s: number) => string> }
const CTX1: Ctx1[] = [
  {
    su: 'км', vu: 'км/год', tu: 'год', vr: [60, 70, 80, 90], tr: [4, 5, 6, 7, 8],
    text: {
      s: (v, t) => `Потяг Київ–Львів їхав ${t} год зі швидкістю ${v} км/год. Яку відстань він проїхав?`,
      v: (_v, t, s) => `Потяг проїхав ${s} км за ${t} год. З якою швидкістю він їхав?`,
      t: (v, _t, s) => `Потяг їде зі швидкістю ${v} км/год. За скільки годин він проїде ${s} км?`,
    },
  },
  {
    su: 'км', vu: 'км/год', tu: 'год', vr: [12, 14, 15, 18, 20], tr: [2, 3, 4, 5],
    text: {
      s: (v, t) => `Велосипедист їхав ${t} год зі швидкістю ${v} км/год. Скільки кілометрів він проїхав?`,
      v: (_v, t, s) => `Велосипедист за ${t} год проїхав ${s} км. З якою швидкістю він їхав?`,
      t: (v, _t, s) => `Велосипедист їде зі швидкістю ${v} км/год. За скільки годин він проїде ${s} км?`,
    },
  },
  {
    su: 'м', vu: 'м/хв', tu: 'хв', vr: [50, 60, 70, 80, 90], tr: [5, 8, 10, 12, 15, 20],
    text: {
      s: (v, t) => `Оленка йшла до школи ${t} хв зі швидкістю ${v} м/хв. Яка відстань від дому до школи?`,
      v: (_v, t, s) => `Оленка дійшла до школи за ${t} хв і пройшла ${s} м. З якою швидкістю вона йшла?`,
      t: (v, _t, s) => `Оленка йде зі швидкістю ${v} м/хв. За скільки хвилин вона пройде ${s} м?`,
    },
  },
  {
    su: 'м', vu: 'м/год', tu: 'год', vr: [3, 4, 5, 6, 8], tr: [4, 5, 6, 8, 10, 12],
    text: {
      s: (v, t) => `Равлик повзе зі швидкістю ${v} м/год. Скільки метрів він проповзе за ${t} год?`,
      v: (_v, t, s) => `Равлик за ${t} год проповз ${s} м. З якою швидкістю він повзе?`,
      t: (v, _t, s) => `Равлик повзе зі швидкістю ${v} м/год. За скільки годин він проповзе ${s} м?`,
    },
  },
];

function spRound(kind: 's' | 'v' | 't'): Item {
  const c = CTX1[randInt(0, CTX1.length - 1)];
  const v = c.vr[randInt(0, c.vr.length - 1)];
  const t = c.tr[randInt(0, c.tr.length - 1)];
  const s = v * t;
  const q = c.text[kind](v, t, s);
  let r: { options: string[]; answer: string };
  let steps: string[];
  if (kind === 's') {
    r = withUnit(s, [v + t, s + v, s - v, s + t * 10], c.su);
    steps = ['Відстань = швидкість · час.', `${v} · ${t} = ${s} ${c.su}.`];
  } else if (kind === 'v') {
    r = withUnit(v, [s - t, s * t, v + t, v - 1], c.vu);
    steps = ['Швидкість = відстань : час.', `${s} : ${t} = ${v} ${c.vu}.`];
  } else {
    r = withUnit(t, [s - v, s * v, t + 1, t - 1], c.tu);
    steps = ['Час = відстань : швидкість.', `${s} : ${v} = ${t} ${c.tu}.`];
  }
  return { payload: { mode: 'sp', kind, v, t, s, q, options: r.options, steps }, answer: r.answer };
}

// ---------- d2 ----------
interface Ctx2 { u: string; vu: string; tu: string; tg: string; vr: [number, number]; tr: [number, number]; toward: string; apart: string }
const CTX2: Ctx2[] = [
  { u: 'км', vu: 'км/год', tu: 'год', tg: 'годин', vr: [12, 18], tr: [2, 4], toward: 'Із двох селищ одночасно назустріч одне одному виїхали два велосипедисти.', apart: 'Два велосипедисти одночасно виїхали з одного місця в протилежні боки.' },
  { u: 'м', vu: 'м/хв', tu: 'хв', tg: 'хвилин', vr: [60, 80], tr: [5, 12], toward: 'Остап і Мирослава одночасно вийшли назустріч одне одному.', apart: 'Остап і Мирослава одночасно пішли з одного місця в протилежні боки.' },
  { u: 'км', vu: 'км/год', tu: 'год', tg: 'годин', vr: [50, 90], tr: [2, 5], toward: 'Із двох станцій одночасно назустріч один одному вирушили два потяги.', apart: 'Від однієї станції одночасно в протилежні боки відійшли два потяги.' },
];

function meetRound(mode: 'meetT' | 'meetS' | 'oppS' | 'oppV'): Item {
  const c = CTX2[randInt(0, CTX2.length - 1)];
  const step = c.vu === 'м/хв' ? 5 : c.vr[0] >= 50 ? 5 : 1;
  const rv = () => Math.round(randInt(c.vr[0], c.vr[1]) / step) * step;
  let v1 = rv();
  let v2 = rv();
  while (v2 === v1) v2 = rv();
  const t = randInt(c.tr[0], c.tr[1]);
  const d = (v1 + v2) * t;
  const speeds = `Швидкість першого — ${v1} ${c.vu}, другого — ${v2} ${c.vu}.`;
  const sum = `${v1} + ${v2} = ${v1 + v2} ${c.vu}`;
  let q: string;
  let r: { options: string[]; answer: string };
  let steps: string[];
  if (mode === 'meetT') {
    q = `${c.toward} ${speeds} Відстань між ними спочатку ${d} ${c.u}. Через скільки ${c.tg} вони зустрінуться?`;
    r = withUnit(t, [t + 1, t - 1, d / v1, d / v2, d / Math.abs(v1 - v2)], c.tu);
    steps = [`Назустріч вони зближаються разом: ${sum} (швидкість зближення).`, `Час = ${d} : ${v1 + v2} = ${t} ${c.tu}.`];
  } else if (mode === 'meetS') {
    q = `${c.toward} ${speeds} Вони зустрілися через ${t} ${c.tu}. Яка відстань була між ними спочатку?`;
    r = withUnit(d, [v1 * t, v2 * t, Math.abs(v1 - v2) * t, d + t, v1 + v2 + t], c.u);
    steps = [`Разом вони зближаються зі швидкістю ${sum}.`, `Відстань = ${v1 + v2} · ${t} = ${d} ${c.u}.`];
  } else if (mode === 'oppS') {
    q = `${c.apart} ${speeds} Яка відстань буде між ними через ${t} ${c.tu}?`;
    r = withUnit(d, [v1 * t, v2 * t, Math.abs(v1 - v2) * t, d + t, v1 + v2 + t], c.u);
    steps = [`У протилежні боки вони віддаляються разом: ${sum}.`, `Відстань = ${v1 + v2} · ${t} = ${d} ${c.u}.`];
  } else {
    q = `${c.apart} Перший їде зі швидкістю ${v1} ${c.vu}. Через ${t} ${c.tu} відстань між ними стала ${d} ${c.u}. З якою швидкістю їде другий?`;
    r = withUnit(v2, [d / t, d - v1, d / t + v1, v1 + t, d / t - v1 + 5], c.vu);
    steps = [`Разом вони віддаляються зі швидкістю ${d} : ${t} = ${d / t} ${c.vu}.`, `Швидкість другого: ${d / t} − ${v1} = ${v2} ${c.vu}.`];
  }
  return { payload: { mode, v1, v2, t, d, q, options: r.options, steps }, answer: r.answer };
}

// ---------- d3 ----------
function workRound(type: 'cost2' | 'costUnit' | 'work' | 'crew' | 'snail'): Item {
  let nums: number[];
  let q: string;
  let r: { options: string[]; answer: string };
  let steps: string[];
  if (type === 'cost2') {
    const p = randInt(8, 25);
    let qq = randInt(5, 20);
    while (qq === p) qq = randInt(5, 20);
    const a = randInt(5, 9);
    const b = randInt(5, 9);
    nums = [p, qq, a, b];
    const ans = a * p + b * qq;
    q = `Зошит коштує ${p} грн, а ручка — ${qq} грн. Скільки заплатить Оля за ${a} зошитів і ${b} ручок?`;
    r = withUnit(ans, [a * p, b * qq, a * p + qq, p + qq + a + b, (a + b) * p], 'грн');
    steps = [`Зошити: ${a} · ${p} = ${a * p} грн. Ручки: ${b} · ${qq} = ${b * qq} грн.`, `Разом: ${a * p} + ${b * qq} = ${ans} грн.`];
  } else if (type === 'costUnit') {
    const n = randInt(5, 9);
    let m = randInt(5, 9);
    while (m === n) m = randInt(5, 9);
    const u = randInt(6, 30);
    const s = n * u;
    nums = [n, s, m];
    q = `За ${n} однакових зошитів заплатили ${s} грн. Скільки коштують ${m} таких зошитів?`;
    r = withUnit(m * u, [u, s * m, s + m, s - n, s / n + m], 'грн');
    steps = [`Ціна одного зошита: ${s} : ${n} = ${u} грн.`, `${m} зошитів: ${u} · ${m} = ${m * u} грн.`];
  } else if (type === 'work') {
    const rr = randInt(8, 30);
    const k = randInt(2, 4);
    const h = randInt(5, 9);
    nums = [rr, k, h];
    q = `Одна бригада садить ${rr} дерев за годину. Скільки дерев посадять ${k} такі бригади за ${h} годин?`;
    r = withUnit(rr * k * h, [rr * k, rr * h, rr + k + h, k * h * 10], 'дерев');
    steps = [`За годину ${k} бригади садять ${rr} · ${k} = ${rr * k} дерев.`, `За ${h} годин: ${rr * k} · ${h} = ${rr * k * h} дерев.`];
  } else if (type === 'crew') {
    const k = randInt(5, 9);
    const h = randInt(5, 9);
    const rr = randInt(3, 9);
    const total = rr * k * h;
    nums = [k, h, total];
    q = `${k} робітників за ${h} годин посадили ${total} дерев. Скільки дерев посадив один робітник за 1 годину?`;
    r = withUnit(rr, [total / k, total / h, total - k * h, rr + k], 'дерев');
    steps = [`Усі разом за 1 годину: ${total} : ${h} = ${total / h} дерев.`, `Один робітник: ${total / h} : ${k} = ${rr} дерев.`];
  } else {
    const h = randInt(5, 9);
    let h2 = randInt(5, 12);
    while (h2 === h) h2 = randInt(5, 12);
    const v = randInt(2, 9);
    const dist = v * h;
    nums = [h, dist, h2];
    q = `Равлик за ${h} годин проповз ${dist} м. Скільки метрів він проповзе за ${h2} годин з тією самою швидкістю?`;
    r = withUnit(v * h2, [v, dist + h2, dist * h2, dist - h, v * h2 + h2], 'м');
    steps = [`За 1 годину: ${dist} : ${h} = ${v} м.`, `За ${h2} годин: ${v} · ${h2} = ${v * h2} м.`];
  }
  return { payload: { mode: type, nums, q, options: r.options, steps }, answer: r.answer };
}

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const items: Item[] = [];
  if (difficulty === 1) {
    const kinds = shuffle<'s' | 'v' | 't'>(['s', 'v', 't', 's', 'v', 't']).slice(0, 5);
    for (const k of kinds) items.push(spRound(k));
  } else if (difficulty === 2) {
    const modes = shuffle<'meetT' | 'meetS' | 'oppS' | 'oppV'>(['meetT', 'meetS', 'oppS', 'oppV']);
    for (const m of [...modes, modes[0]]) items.push(meetRound(m));
  } else {
    for (const t of shuffle<'cost2' | 'costUnit' | 'work' | 'crew' | 'snail'>(['cost2', 'costUnit', 'work', 'crew', 'snail'])) items.push(workRound(t));
  }
  return { difficulty, rounds: shuffle(items).map((r, i) => ({ ...r, id: `r${i}` })) };
}

const PHRASES = {
  sp: { key: 'p_mot4_sp', text: 'Прочитай задачу. Швидкість, час і відстань.' },
  move: { key: 'p_mot4_move', text: 'Прочитай задачу про рух назустріч або в протилежні боки.' },
  work: { key: 'p_mot4_work', text: 'Прочитай задачу про роботу або вартість.' },
} as const;

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = p.mode === 'sp' ? PHRASES.sp : p.mode.startsWith('meet') || p.mode.startsWith('opp') ? PHRASES.move : PHRASES.work;
  const say = hasUkAudio(phrase.key) ? () => sayUkSeq([phrase]) : undefined;
  return (
    <>
      <PromptCard question="Задача" answerState={answerState} say={say} sayKey={round.id}>
        <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.5, textAlign: 'left' }}>{p.q}</div>
      </PromptCard>
      <ChoiceGrid
        options={p.options.map((o) => ({ value: o, node: <span style={{ fontSize: 18, fontWeight: 800 }}>{o}</span> }))}
        correct={round.answer}
        disabled={disabled}
        answerState={answerState}
        onPick={onAnswer}
        columns={2}
      />
    </>
  );
}

const motion4: GameDefinition<Payload, Answer> = {
  id: 'motion-4',
  title: 'Рух і робота',
  subject: 'math',
  levels: ['L3'],
  icon: '🚆',
  description: 'Задачі про швидкість, час і відстань, зустрічний рух, роботу й вартість.',
  accent: '#DCFCE7',
  skillsFor: (d) =>
    d === 1
      ? ['math.measure.l4.speed-time-distance']
      : d === 2
        ? ['math.measure.l4.speed-time-distance', 'math.ops.l4.word-problems-advanced']
        : ['math.ops.l4.word-problems-advanced'],
  explain: (round) => ({ steps: round.payload.steps }),
  generate,
  Component,
};

export default motion4;
