import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle, randInt } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Вирази й рівняння» (11.10.2026) — 4 клас:
 *  d1 — порядок дій у виразі з дужками (3–4 дії): яка дія перша, значення;
 *  d2 — рівняння за правилом компонентів дії;
 *  d3 — двоступеневі рівняння й перевірка підстановкою.
 */

export const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

function pick3(ans: number, cands: number[]): number[] {
  const out: number[] = [];
  const ok = (c: number) => Number.isInteger(c) && c > 0 && c !== ans && !out.includes(c);
  for (const c of shuffle(cands)) if (ok(c) && out.length < 3) out.push(c);
  for (const k of [10, 1, 2, 5, 100]) for (const c of [ans + k, ans - k]) if (out.length < 3 && ok(c)) out.push(c);
  return out;
}

// ---------- вирази ----------
type Op = '+' | '−' | '·' | ':';
interface Tpl { ops: Op[]; paren?: number; max: number }
const TEMPLATES: Tpl[] = [
  { ops: ['+', '·', '−'], paren: 0, max: 30 },
  { ops: ['+', '·', '−'], max: 30 },
  { ops: ['·', '−', '+'], paren: 1, max: 30 },
  { ops: ['−', ':', '+'], max: 60 },
  { ops: ['+', '−', '·', '−'], paren: 1, max: 30 },
];

export function renderExpr(nums: number[], ops: Op[], paren?: number): string {
  let s = '';
  nums.forEach((n, i) => {
    s += (i === paren ? '(' : '') + n + (i === (paren ?? -9) + 1 ? ')' : '');
    if (i < ops.length) s += ` ${ops[i]} `;
  });
  return s;
}

function apply(x: number, op: Op, y: number): number {
  return op === '+' ? x + y : op === '−' ? x - y : op === '·' ? x * y : x / y;
}

/** обчислення за правилами порядку дій; ok=false — не цілі або не додатні проміжні результати */
export function evalExpr(nums: number[], ops: Op[], paren?: number) {
  const vals = [...nums];
  const os = [...ops];
  const orig = os.map((_, i) => i);
  const steps: string[] = [];
  let ok = true;
  let first = -1;
  const act = (i: number) => {
    const r = apply(vals[i], os[i], vals[i + 1]);
    if (!Number.isInteger(r) || r <= 0) ok = false;
    steps.push(`${vals[i]} ${os[i]} ${vals[i + 1]} = ${r}`);
    if (first < 0) first = orig[i];
    vals.splice(i, 2, r);
    os.splice(i, 1);
    orig.splice(i, 1);
  };
  if (paren !== undefined) act(paren);
  for (;;) {
    const i = os.findIndex((o) => o === '·' || o === ':');
    if (i < 0) break;
    act(i);
  }
  while (os.length) act(0);
  return { value: vals[0], steps, first, ok };
}

/** помилково: усі дії підряд зліва направо */
function leftToRight(nums: number[], ops: Op[]): number {
  return nums.slice(1).reduce((acc, n, i) => apply(acc, ops[i], n), nums[0]);
}
/** помилково: без дужок */
function noParens(nums: number[], ops: Op[]): number {
  return evalExpr(nums, ops).value;
}

type Payload =
  | { mode: 'first'; expr: string; options: string[]; steps: string[] }
  | { mode: 'value'; expr: string; options: string[]; steps: string[] }
  | { mode: 'comp'; eq: string; options: string[]; rule: string; steps: string[] }
  | { mode: 'two'; eq: string; options: string[]; steps: string[] }
  | { mode: 'check'; eq: string; options: string[]; steps: string[] };
type Answer = string;
type Item = Omit<Round<Payload, Answer>, 'id'>;

function genNums(tpl: Tpl): number[] {
  const n = tpl.ops.length + 1;
  for (;;) {
    const nums = Array.from({ length: n }, () => randInt(2, tpl.max));
    const di = tpl.ops.indexOf(':');
    if (di >= 0) {
      const c = randInt(2, 9);
      nums[di + 1] = c;
      nums[di] = c * randInt(2, 9);
    }
    if (tpl.ops.some((o) => o === '·')) {
      const mi = tpl.ops.indexOf('·');
      nums[mi + 1] = randInt(2, 9);
      if (mi === 0) nums[0] = randInt(2, 9);
    }
    if (new Set(nums).size !== n) continue;
    const r = evalExpr(nums, tpl.ops, tpl.paren);
    if (r.ok && r.value <= 600) return nums;
  }
}

function exprRound(kind: 'first' | 'value'): Item {
  for (;;) {
    const tpl = TEMPLATES[randInt(0, TEMPLATES.length - 1)];
    const nums = genNums(tpl);
    const r = evalExpr(nums, tpl.ops, tpl.paren);
    const expr = renderExpr(nums, tpl.ops, tpl.paren);
    const rule = 'Спершу дужки, потім · і :, потім + і − (зліва направо).';
    if (kind === 'first') {
      const pair = (k: number) => `${nums[k]} ${tpl.ops[k]} ${nums[k + 1]}`;
      const wrong = shuffle(tpl.ops.map((_, k) => k).filter((k) => k !== r.first)).slice(0, 2);
      const options = shuffle([r.first, ...wrong].map(pair));
      return { payload: { mode: 'first', expr, options, steps: [rule, `Перша дія: ${pair(r.first)}.`] }, answer: pair(r.first) };
    }
    const cands = [leftToRight(nums, tpl.ops), noParens(nums, tpl.ops), r.value + 10, r.value - 10];
    const d = pick3(r.value, cands);
    if (d.length < 3) continue;
    return { payload: { mode: 'value', expr, options: shuffle([r.value, ...d].map(String)), steps: [rule, r.steps.join('; ') + '.'] }, answer: String(r.value) };
  }
}

// ---------- рівняння за правилом компонентів ----------
function compRound(type: string): Item {
  let x = 0;
  let eq = '';
  let rule = '';
  let step = '';
  let cands: number[] = [];
  const b = randInt(3, 9);
  if (type === 'mulx') {
    x = randInt(12, 120);
    const c = x * b;
    eq = `x · ${b} = ${fmt(c)}`;
    rule = 'Невідомий множник = добуток : відомий множник.';
    step = `x = ${fmt(c)} : ${b} = ${x}`;
    cands = [c * b, c + b, c - b, c / 2];
  } else if (type === 'divx') {
    const c = randInt(12, 150);
    x = c * b;
    eq = `x : ${b} = ${c}`;
    rule = 'Невідоме ділене = частка · дільник.';
    step = `x = ${c} · ${b} = ${fmt(x)}`;
    cands = [c + b, c - b, c / b, x + b];
  } else if (type === 'subx') {
    const m = randInt(4, 10) * 100 + (Math.random() < 0.5 ? 0 : 50);
    x = randInt(11, 35) * 10 + 5;
    const c = m - x;
    eq = `${fmt(m)} − x = ${c}`;
    rule = 'Невідомий відʼємник = зменшуване − різниця.';
    step = `x = ${fmt(m)} − ${c} = ${x}`;
    cands = [m + c, c, c - 100, m - 2 * c];
  } else if (type === 'addx') {
    const c = randInt(5, 90) * 10 + 5;
    const a = randInt(11, 60) * 5;
    x = c;
    const s = c + a;
    eq = `x + ${a} = ${fmt(s)}`;
    rule = 'Невідомий доданок = сума − відомий доданок.';
    step = `x = ${fmt(s)} − ${a} = ${fmt(x)}`;
    cands = [s + a, a, s, x + 10];
  } else if (type === 'minx') {
    const a = randInt(11, 90) * 5;
    const c = randInt(12, 90) * 5;
    x = a + c;
    eq = `x − ${a} = ${c}`;
    rule = 'Невідоме зменшуване = різниця + відʼємник.';
    step = `x = ${c} + ${a} = ${x}`;
    cands = [c - a, a, c, x + 10];
  } else {
    const c = randInt(3, 12);
    x = randInt(4, 15);
    const m = x * c;
    eq = `${m} : x = ${c}`;
    rule = 'Невідомий дільник = ділене : частка.';
    step = `x = ${m} : ${c} = ${x}`;
    cands = [m * c, m + c, m - c, c];
  }
  const options = shuffle([x, ...pick3(x, cands)].map(String));
  return { payload: { mode: 'comp', eq, options: options.map((o) => fmt(Number(o))), rule, steps: [rule, step] }, answer: fmt(x) };
}

// ---------- двоступеневі ----------
function twoRound(kind: 'two' | 'check'): Item {
  const form = randInt(0, 3);
  const a = randInt(2, 9);
  const b = randInt(5, 40);
  let x = randInt(4, 30);
  let eq = '';
  let c = 0;
  let steps: string[] = [];
  let cands: number[] = [];
  let sub = '';
  if (form === 0) {
    c = x * a + b;
    eq = `x · ${a} + ${b} = ${c}`;
    steps = [`Спершу знайдемо x · ${a}: ${c} − ${b} = ${c - b}.`, `Тепер x = ${c - b} : ${a} = ${x}.`];
    cands = [c - b, c / a, (c - b) * a, c + b, (c + b) / a];
    sub = `${x} · ${a} + ${b} = ${x * a} + ${b} = ${c}`;
  } else if (form === 1) {
    c = x * a - b;
    if (c <= 0) return twoRound(kind);
    eq = `x · ${a} − ${b} = ${c}`;
    steps = [`Спершу знайдемо x · ${a}: ${c} + ${b} = ${c + b}.`, `Тепер x = ${c + b} : ${a} = ${x}.`];
    cands = [c + b, c / a, (c - b) / a, c * a, (c + b) * a];
    sub = `${x} · ${a} − ${b} = ${x * a} − ${b} = ${c}`;
  } else if (form === 2) {
    const k = randInt(3, 20);
    x = k * a;
    c = k + b;
    eq = `x : ${a} + ${b} = ${c}`;
    steps = [`Спершу знайдемо x : ${a}: ${c} − ${b} = ${k}.`, `Тепер x = ${k} · ${a} = ${x}.`];
    cands = [c - b, c * a, (c + b) * a, c - b + a, c - a];
    sub = `${x} : ${a} + ${b} = ${k} + ${b} = ${c}`;
  } else {
    c = (x + b) * a;
    eq = `(x + ${b}) · ${a} = ${c}`;
    steps = [`Спершу знайдемо x + ${b}: ${c} : ${a} = ${x + b}.`, `Тепер x = ${x + b} − ${b} = ${x}.`];
    cands = [c / a, c - b, (c - b) / a, c / a + b, c + b];
    sub = `(${x} + ${b}) · ${a} = ${x + b} · ${a} = ${c}`;
  }
  const options = shuffle([x, ...pick3(x, cands)].map(String));
  if (kind === 'check') steps = [`Підставляємо ${x}: ${sub}.`, `Вийшло ${c}, як у рівнянні, — це розвʼязок. Інші числа такого результату не дають.`];
  return { payload: { mode: kind, eq, options, steps }, answer: String(x) };
}

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const items: Item[] = [];
  if (difficulty === 1) {
    items.push(exprRound('first'), exprRound('first'), exprRound('value'), exprRound('value'), exprRound('value'));
  } else if (difficulty === 2) {
    for (const t of shuffle(['mulx', 'divx', 'subx', 'addx', 'minx', 'divd']).slice(0, 5)) items.push(compRound(t));
  } else {
    items.push(twoRound('two'), twoRound('two'), twoRound('two'), twoRound('check'), twoRound('check'));
  }
  return { difficulty, rounds: shuffle(items).map((r, i) => ({ ...r, id: `r${i}` })) };
}

const PHRASES = {
  first: { key: 'p_eq4_first', text: 'Яка дія виконується першою?' },
  value: { key: 'p_eq4_value', text: 'Знайди значення виразу.' },
  comp: { key: 'p_eq4_comp', text: 'Розвʼяжи рівняння. Чому дорівнює ікс?' },
  two: { key: 'p_eq4_two', text: 'Розвʼяжи рівняння у дві дії. Чому дорівнює ікс?' },
  check: { key: 'p_eq4_check', text: 'Підстав числа в рівняння. Яке з них розвʼязок?' },
} as const;

const big = { fontSize: 26, fontWeight: 800, textAlign: 'center' as const, margin: '8px 0' };

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = PHRASES[p.mode];
  const say = hasUkAudio(phrase.key) ? () => sayUkSeq([phrase]) : undefined;
  const q = {
    first: 'Яка дія перша?',
    value: 'Чому дорівнює вираз?',
    comp: 'Знайди x',
    two: 'Знайди x',
    check: 'Підстав: який x правильний?',
  }[p.mode];
  const text = p.mode === 'first' || p.mode === 'value' ? p.expr : p.eq;
  return (
    <>
      <PromptCard question={q} answerState={answerState} say={say} sayKey={round.id}>
        <div style={big}>{text}</div>
      </PromptCard>
      <ChoiceGrid
        options={p.options.map((o) => ({ value: o, node: <span style={{ fontSize: 20, fontWeight: 800 }}>{o}</span> }))}
        correct={round.answer}
        disabled={disabled}
        answerState={answerState}
        onPick={onAnswer}
        columns={p.mode === 'first' ? 3 : 2}
      />
    </>
  );
}

const equations4: GameDefinition<Payload, Answer> = {
  id: 'equations-4',
  title: 'Вирази й рівняння',
  subject: 'math',
  levels: ['L3'],
  icon: '🧮',
  description: 'Порядок дій з дужками, рівняння за правилом, двоступеневі рівняння.',
  accent: '#EDE9FE',
  skillsFor: (d) => (d === 1 ? ['math.ops.l4.combined-expressions'] : ['math.ops.l4.equations-advanced']),
  explain: (round) => ({ steps: round.payload.steps }),
  generate,
  Component,
};

export default equations4;
