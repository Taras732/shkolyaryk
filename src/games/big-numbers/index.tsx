import type { ReactNode } from 'react';
import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle, randInt } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Великі числа» (11.10.2026) — 4 клас, числа до мільйона й великі одиниці:
 *  d1 — розряди й класи, запис числа за розрядними доданками;
 *  d2 — порівняння багатоцифрових, найбільше/найменше з трьох;
 *  d3 — т, ц, кг; рік, місяць; століття; дм², см², м².
 */

export const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII', 'XXIII'];
export const centuryOf = (year: number) => Math.ceil(year / 100);

/** три різні хибні варіанти (додатні цілі, не рівні відповіді) */
function decoys(ans: number, cands: number[]): number[] {
  const out: number[] = [];
  for (const c of shuffle(cands)) if (Number.isInteger(c) && c > 0 && c !== ans && !out.includes(c)) out.push(c);
  for (const k of [10, 100, 1, 1000, 2]) {
    for (const c of [ans + k, ans - k]) if (out.length < 3 && c > 0 && c !== ans && !out.includes(c)) out.push(c);
  }
  return out.slice(0, 3);
}

export const UNITS: { key: string; from: string; to: string; f: number }[] = [
  { key: 't', from: 'т', to: 'кг', f: 1000 },
  { key: 'c', from: 'ц', to: 'кг', f: 100 },
  { key: 'y', from: 'рік', to: 'міс', f: 12 },
  { key: 'v', from: 'століття', to: 'років', f: 100 },
  { key: 'd', from: 'дм²', to: 'см²', f: 100 },
  { key: 'm', from: 'м²', to: 'дм²', f: 100 },
];
const YEARS = [988, 1240, 1654, 1709, 1812, 1861, 1918, 1945, 1991, 2004, 2022, 1500, 1800, 1700];

type Payload =
  | { mode: 'place'; n: number; options: string[] }
  | { mode: 'write'; a: number; b: number; c: number; options: string[] }
  | { mode: 'cmp'; x: number; y: number; options: string[] }
  | { mode: 'extreme'; kind: 'max' | 'min'; nums: number[]; options: string[] }
  | { mode: 'unit'; unit: string; n: number; from: string; to: string; f: number; options: string[] }
  | { mode: 'century'; year: number; options: string[] };
type Answer = string;
type Item = Omit<Round<Payload, Answer>, 'id'>;

function placeRound(): Item {
  for (;;) {
    const n = randInt(100000, 999999);
    const ans = Math.floor(n / 1000);
    const opts = [ans, ...decoys(ans, [n % 1000, Math.floor(n / 1000) % 10, Math.floor(n / 100), Math.floor(n / 10000)])];
    if (new Set(opts).size === 4) return { payload: { mode: 'place', n, options: shuffle(opts.map(fmt)) }, answer: fmt(ans) };
  }
}

function writeRound(): Item {
  for (;;) {
    const a = randInt(11, 99);
    const b = randInt(1, 9);
    const c = randInt(1, 9);
    if (b === c || a % 10 === 0) continue;
    const ans = a * 1000 + b * 100 + c;
    const opts = [ans, a * 1000 + b * 10 + c, a * 1000 + c * 100 + b, a * 100 + b * 10 + c];
    if (new Set(opts).size === 4) return { payload: { mode: 'write', a, b, c, options: shuffle(opts.map(fmt)) }, answer: fmt(ans) };
  }
}

function cmpRound(kind: 'lt' | 'gt' | 'eq'): Item {
  const digits = randInt(5, 6);
  const x = randInt(10 ** (digits - 1), 10 ** digits - 1);
  let y = x;
  if (kind !== 'eq') {
    for (;;) {
      const s = String(x).split('');
      const pos = randInt(0, digits - 1);
      const nd = randInt(pos === 0 ? 1 : 0, 9);
      if (String(nd) === s[pos]) continue;
      s[pos] = String(nd);
      y = Number(s.join(''));
      if ((kind === 'lt') === (x < y) || (kind === 'gt') === (x > y)) break;
    }
  }
  const ans = x > y ? '>' : x < y ? '<' : '=';
  return { payload: { mode: 'cmp', x, y, options: ['>', '<', '='] }, answer: ans };
}

function extremeRound(): Item {
  for (;;) {
    const base = randInt(100000, 899999);
    const nums = [base, base + randInt(1, 9) * 10 ** randInt(1, 4), base - randInt(1, 9) * 10 ** randInt(1, 4)];
    if (new Set(nums).size !== 3 || nums.some((v) => v < 100000 || v > 999999)) continue;
    const kind = Math.random() < 0.5 ? 'max' : 'min';
    const ans = kind === 'max' ? Math.max(...nums) : Math.min(...nums);
    const shuffled = shuffle(nums);
    return { payload: { mode: 'extreme', kind, nums: shuffled, options: shuffled.map(fmt) }, answer: fmt(ans) };
  }
}

function unitRound(u: (typeof UNITS)[number]): Item {
  const n = randInt(2, 9);
  const ans = n * u.f;
  const d = decoys(ans, [n * 10, n * 100, n * 1000, n * 12, n * 60, n * 10000]);
  return { payload: { mode: 'unit', unit: u.key, n, from: u.from, to: u.to, f: u.f, options: shuffle([ans, ...d].map(fmt)) }, answer: fmt(ans) };
}

function centuryRound(): Item {
  const year = YEARS[randInt(0, YEARS.length - 1)];
  const c = centuryOf(year);
  const opts = [c, c - 1, c + 1, c + 2];
  return { payload: { mode: 'century', year, options: shuffle(opts.map((v) => `${ROMAN[v]} століття`)) }, answer: `${ROMAN[c]} століття` };
}

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const items: Item[] = [];
  if (difficulty === 1) {
    for (let i = 0; i < 3; i++) items.push(writeRound());
    for (let i = 0; i < 2; i++) items.push(placeRound());
  } else if (difficulty === 2) {
    for (const k of shuffle(['lt', 'gt', 'eq'] as const)) items.push(cmpRound(k));
    items.push(extremeRound(), extremeRound());
  } else {
    for (const u of shuffle(UNITS).slice(0, 3)) items.push(unitRound(u));
    items.push(centuryRound(), centuryRound());
  }
  return { difficulty, rounds: shuffle(items).map((r, i) => ({ ...r, id: `r${i}` })) };
}

const PHRASES = {
  place: { key: 'p_bign_place', text: 'Скільки всього тисяч у цьому числі?' },
  write: { key: 'p_bign_write', text: 'Запиши число цифрами.' },
  cmp: { key: 'p_bign_cmp', text: 'Порівняй числа. Який знак треба поставити?' },
  extreme: { key: 'p_bign_extreme', text: 'Яке з трьох чисел найбільше або найменше?' },
  unit: { key: 'p_bign_unit', text: 'Переведи у менші одиниці.' },
  century: { key: 'p_bign_century', text: 'Яке це століття?' },
} as const;

const big = { fontSize: 26, fontWeight: 800, textAlign: 'center' as const, margin: '8px 0', letterSpacing: 1 };

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = PHRASES[p.mode];
  const say = hasUkAudio(phrase.key) ? () => sayUkSeq([phrase]) : undefined;
  let q = '';
  let body: ReactNode = null;
  let cols = 2;
  if (p.mode === 'place') {
    q = 'Скільки всього тисяч у числі?';
    body = <div style={big}>{fmt(p.n)}</div>;
  } else if (p.mode === 'write') {
    q = 'Запиши число цифрами';
    body = <div style={{ ...big, fontSize: 20 }}>{p.a} тисяч {p.b} сотень {p.c} одиниць</div>;
  } else if (p.mode === 'cmp') {
    q = 'Який знак поставити?';
    body = <div style={big}>{fmt(p.x)} <span style={{ color: '#64748B' }}>?</span> {fmt(p.y)}</div>;
    cols = 3;
  } else if (p.mode === 'extreme') {
    q = p.kind === 'max' ? 'Яке число найбільше?' : 'Яке число найменше?';
    cols = 3;
  } else if (p.mode === 'unit') {
    q = 'Скільки це?';
    body = <div style={big}>{p.n} {p.from} = ? {p.to}</div>;
  } else {
    q = `Яке століття — ${p.year} рік?`;
  }
  return (
    <>
      <PromptCard question={q} answerState={answerState} say={say} sayKey={round.id}>{body}</PromptCard>
      <ChoiceGrid
        options={p.options.map((o) => ({ value: o, node: <span style={{ fontSize: 18, fontWeight: 800 }}>{o}</span> }))}
        correct={round.answer}
        disabled={disabled}
        answerState={answerState}
        onPick={onAnswer}
        columns={cols}
      />
    </>
  );
}

const bigNumbers: GameDefinition<Payload, Answer> = {
  id: 'big-numbers',
  title: 'Великі числа',
  subject: 'math',
  levels: ['L3'],
  icon: '🔢',
  description: 'Розряди й класи, порівняння великих чисел, тонни, століття, дм² і м².',
  accent: '#E0F2FE',
  skillsFor: (d) =>
    d === 1 ? ['math.count.l4.numbers-beyond-1000'] : d === 2 ? ['math.count.l4.compare-large'] : ['math.measure.l4.large-units'],
  explain: (round) => {
    const p = round.payload;
    if (p.mode === 'place') {
      return { steps: [`Число ділимо на класи: ${fmt(p.n)} — це ${fmt(Math.floor(p.n / 1000))} тисяч і ${p.n % 1000} одиниць.`, `Тисяч тут ${round.answer}.`] };
    }
    if (p.mode === 'write') {
      return { steps: [`${p.a} тисяч — це ${fmt(p.a * 1000)}.`, `Додаємо ${p.b} сотень і ${p.c} одиниць: ${round.answer}.`, 'Порожні розряди заповнюємо нулями.'] };
    }
    if (p.mode === 'cmp') {
      const sx = String(p.x);
      const sy = String(p.y);
      const i = sx.split('').findIndex((c, k) => c !== sy[k]);
      return {
        steps: i < 0
          ? ['Усі цифри однакові, числа рівні: ставимо =.']
          : ['Порівнюємо цифри зліва направо.', `Перші різні цифри: ${sx[i]} і ${sy[i]}. Тож ${fmt(p.x)} ${round.answer} ${fmt(p.y)}.`],
      };
    }
    if (p.mode === 'extreme') {
      return { steps: ['Порівнюй числа по розрядах зліва направо.', `${p.kind === 'max' ? 'Найбільше' : 'Найменше'} число — ${round.answer}.`] };
    }
    if (p.mode === 'unit') return { steps: [`1 ${p.from} = ${fmt(p.f)} ${p.to}.`, `${p.n} · ${fmt(p.f)} = ${round.answer} ${p.to}.`] };
    return { steps: ['Століття — це 100 років: 1-е — роки 1–100, 2-е — 101–200 і так далі.', `Рік ${p.year} — це ${round.answer}.`] };
  },
  generate,
  Component,
};

export default bigNumbers;
