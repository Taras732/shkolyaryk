import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle, randInt } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Числа до 1000» (11.10.2026) — 3 клас:
 *  d1 — розряди: цифра в розряді; число за сотнями, десятками й одиницями (з нулями);
 *  d2 — порівняння двох чисел (>, <, =) і найбільше/найменше з трьох;
 *  d3 — позатабличне множення/ділення в межах 100, ×/÷ на 10.
 */

export type Payload =
  | { mode: 'digit'; q: string; n: number; place: 0 | 1 | 2; options: string[] }
  | { mode: 'compose'; q: string; n: number; options: string[] }
  | { mode: 'sign'; q: string; left: string; right: string; a: number; b: number; options: string[] }
  | { mode: 'extreme'; q: string; nums: number[]; big: boolean; options: string[] }
  | { mode: 'calc'; q: string; a: number; b: number; op: '×' | ':'; options: string[] };
type Answer = string;

export const PLACES = ['сотень', 'десятків', 'одиниць'] as const;

function pl(n: number, f: [string, string, string]): string {
  const m100 = n % 100, m10 = n % 10;
  if (m100 >= 11 && m100 <= 14) return f[2];
  if (m10 === 1) return f[0];
  if (m10 >= 2 && m10 <= 4) return f[1];
  return f[2];
}
const UNITS: [string, string, string][] = [
  ['сотня', 'сотні', 'сотень'],
  ['десяток', 'десятки', 'десятків'],
  ['одиниця', 'одиниці', 'одиниць'],
];

export function digitsOf(n: number): [number, number, number] {
  return [Math.floor(n / 100), Math.floor(n / 10) % 10, n % 10];
}

function numOptions(ans: number, extras: number[], n = 4, min = 0): string[] {
  const pool: number[] = [];
  for (const e of shuffle(extras)) if (e >= min && e !== ans && !pool.includes(e)) pool.push(e);
  for (const d of [1, -1, 2, -2, 10, -10, 3, -3, 5, -5]) {
    if (pool.length >= n - 1) break;
    const v = ans + d;
    if (v >= min && v !== ans && !pool.includes(v)) pool.push(v);
  }
  return shuffle([ans, ...pool.slice(0, n - 1)]).map(String);
}

function perms(n: number): number[] {
  const [a, b, c] = digitsOf(n);
  return [[a, c, b], [b, a, c], [b, c, a], [c, a, b], [c, b, a]].filter((p) => p[0] > 0).map((p) => p[0] * 100 + p[1] * 10 + p[2]).filter((v) => v !== n);
}

function composeText(n: number, showZero: boolean): string {
  return digitsOf(n)
    .map((d, i) => (d === 0 && !showZero ? '' : `${d} ${pl(d, UNITS[i])}`))
    .filter(Boolean)
    .join(' ');
}

function sameHundreds(): [number, number] {
  const h = randInt(1, 9);
  let a = h * 100 + randInt(0, 99), b = h * 100 + randInt(0, 99);
  if (Math.random() < 0.4) { const t = randInt(0, 9); a = h * 100 + t * 10 + randInt(0, 9); b = h * 100 + t * 10 + randInt(0, 9); }
  return [a, b];
}

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const items: Omit<Round<Payload, Answer>, 'id'>[] = [];
  if (difficulty === 1) {
    for (let i = 0; i < 3; i++) {
      const n = randInt(100, 999);
      const place = randInt(0, 2) as 0 | 1 | 2;
      const ans = digitsOf(n)[place];
      items.push({ payload: { mode: 'digit', q: `Число ${n}: яка цифра в розряді ${PLACES[place]}?`, n, place, options: numOptions(ans, digitsOf(n).concat(randInt(0, 9)), 4, 0) }, answer: String(ans) });
    }
    for (let i = 0; i < 2; i++) {
      let n = randInt(101, 999);
      if (i === 0) n = Math.random() < 0.5 ? randInt(1, 9) * 100 + randInt(1, 9) : randInt(1, 9) * 100 + randInt(1, 9) * 10;
      items.push({ payload: { mode: 'compose', q: `Яке число: ${composeText(n, Math.random() < 0.5)}?`, n, options: numOptions(n, perms(n).concat(Number(String(n).replace(/0/g, '')) || 0), 4, 1) }, answer: String(n) });
    }
  } else if (difficulty === 2) {
    for (let i = 0; i < 3; i++) {
      let [a, b] = sameHundreds();
      let left = String(a);
      if (Math.random() < 0.2) {
        const [h, t, u] = digitsOf(a);
        b = a;
        left = `${h * 100} + ${t * 10} + ${u}`;
      } else if (a === b) b = a + 1;
      items.push({ payload: { mode: 'sign', q: 'Порівняй числа. Який знак треба поставити?', left, right: String(b), a, b, options: ['>', '<', '='] }, answer: a > b ? '>' : a < b ? '<' : '=' });
    }
    for (let i = 0; i < 2; i++) {
      const h = randInt(1, 9);
      const set = new Set<number>();
      while (set.size < 3) set.add(h * 100 + (Math.random() < 0.5 ? randInt(0, 99) : randInt(0, 9) * 10 + 5));
      const nums = shuffle([...set]);
      const big = i === 0;
      items.push({ payload: { mode: 'extreme', q: big ? 'Яке число найбільше?' : 'Яке число найменше?', nums, big, options: nums.map(String) }, answer: String(big ? Math.max(...nums) : Math.min(...nums)) });
    }
  } else {
    const kinds = shuffle(['mul', 'div', 'mul10', 'div10', Math.random() < 0.5 ? 'mul' : 'div']);
    for (const k of kinds) {
      let a: number, b: number, op: '×' | ':', ans: number, extras: number[];
      if (k === 'mul') {
        b = randInt(2, 4); a = randInt(11, Math.floor(100 / b)); op = '×'; ans = a * b;
        extras = [ans - 10, ans + 10, ans - 1, ans + 1, a + b, ans - 2];
      } else if (k === 'div') {
        b = randInt(2, 9); const q = randInt(11, Math.floor(100 / b)); a = b * q; op = ':'; ans = q;
        extras = [q + 1, q - 1, q + 10, q - 10, b];
      } else if (k === 'mul10') {
        a = randInt(11, 99); b = 10; op = '×'; ans = a * 10;
        extras = [a, a * 100, ans + 10, ans - 10];
      } else {
        const q = randInt(11, 99); a = q * 10; b = 10; op = ':'; ans = q;
        extras = [a, q * 100, Number(String(q).split('').reverse().join('')), q + 1, q - 1];
      }
      items.push({ payload: { mode: 'calc', q: 'Обчисли.', a, b, op, options: numOptions(ans, extras, 4, 1) }, answer: String(ans) });
    }
  }
  return { difficulty, rounds: shuffle(items).map((r, i) => ({ ...r, id: `r${i}` })) };
}

export const PHRASES = {
  digit: { key: 'p_n1000_digit', text: 'Яка цифра стоїть у цьому розряді?' },
  compose: { key: 'p_n1000_compose', text: 'Яке це число?' },
  sign: { key: 'p_n1000_sign', text: 'Порівняй числа. Який знак треба поставити?' },
  extreme: { key: 'p_n1000_extreme', text: 'Знайди потрібне число.' },
  calc: { key: 'p_n1000_calc', text: 'Обчисли.' },
} as const;

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = PHRASES[p.mode];
  const say = hasUkAudio(phrase.key) ? () => sayUkSeq([phrase]) : undefined;
  const big = { fontSize: 34, fontWeight: 900, textAlign: 'center' as const, margin: '6px 0' };
  return (
    <>
      <PromptCard question={p.q} answerState={answerState} say={say} sayKey={round.id}>
        {p.mode === 'digit' && <div style={big}>{p.n}</div>}
        {p.mode === 'sign' && <div style={big}>{p.left} <span style={{ border: '2px dashed #94A3B8', borderRadius: 8, padding: '0 14px' }}>?</span> {p.right}</div>}
        {p.mode === 'calc' && <div style={big}>{p.a} {p.op} {p.b} = ?</div>}
      </PromptCard>
      <ChoiceGrid options={p.options.map((o) => ({ value: o, node: <span style={{ fontSize: p.mode === 'sign' ? 32 : 24, fontWeight: 800 }}>{o}</span> }))}
        correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={p.mode === 'sign' || p.mode === 'extreme' ? 3 : 2} />
    </>
  );
}

const numbers1000: GameDefinition<Payload, Answer> = {
  id: 'numbers-1000',
  title: 'Числа до 1000',
  subject: 'math',
  levels: ['L3'],
  icon: '💯',
  description: 'Сотні, десятки й одиниці, порівняння трицифрових чисел, множення і ділення в межах 100.',
  accent: '#FEF3C7',
  skillsFor: (d) => (d === 1 ? ['math.count.l3.numbers-1000'] : d === 2 ? ['math.count.l3.compare-1000'] : ['math.ops.l3.mult-div-nontable-100']),
  explain: (round) => {
    const p = round.payload;
    if (p.mode === 'digit') {
      const [h, t, u] = digitsOf(p.n);
      return { steps: [`У числі ${p.n}: ${h} ${pl(h, UNITS[0])}, ${t} ${pl(t, UNITS[1])}, ${u} ${pl(u, UNITS[2])}.`, `У розряді ${PLACES[p.place]} стоїть ${round.answer}.`] };
    }
    if (p.mode === 'compose') {
      return { steps: [`${composeText(p.n, true)} — це ${p.n}.`, 'Сотні пишемо першими, потім десятки, потім одиниці. Якщо розряду немає, ставимо 0.'] };
    }
    if (p.mode === 'sign') {
      return { steps: ['Порівнюємо розряди зліва направо: спершу сотні, потім десятки, потім одиниці.', `${p.a} ${round.answer} ${p.b}.`] };
    }
    if (p.mode === 'extreme') {
      return { steps: ['Порівняй сотні, а якщо однакові, то десятки, а потім одиниці.', `${p.big ? 'Найбільше' : 'Найменше'} число — ${round.answer}.`] };
    }
    if (p.b === 10) {
      return { steps: [p.op === '×' ? `Множимо на 10: до числа ${p.a} дописуємо справа 0.` : `Ділимо на 10: у числі ${p.a} прибираємо останній 0.`, `${p.a} ${p.op} 10 = ${round.answer}.`] };
    }
    if (p.op === '×') {
      const t = Math.floor(p.a / 10) * 10, u = p.a % 10;
      return { steps: [`Розбий ${p.a} на ${t} і ${u}.`, `${t} · ${p.b} = ${t * p.b}, ${u} · ${p.b} = ${u * p.b}.`, `${t * p.b} + ${u * p.b} = ${round.answer}.`] };
    }
    const ans = Number(round.answer);
    return { steps: [`Шукаємо число, яке при множенні на ${p.b} дає ${p.a}.`, `${ans} · ${p.b} = ${p.a}, тому ${p.a} : ${p.b} = ${ans}.`] };
  },
  generate,
  Component,
};

export default numbers1000;
