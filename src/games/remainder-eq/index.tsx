import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle, randInt } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Остача і рівняння» (11.10.2026) — 3 клас:
 *  d1 — ділення з остачею (сюжет і приклад), остача завжди менша за дільник;
 *  d2 — прості рівняння на одну дію: x + a = b, a − x = b, x · a = b, x : a = b;
 *  d3 — нерівність зі змінною: яке число підходить.
 */

export type EqKind = 'add' | 'subFrom' | 'mul' | 'div';
export type IneqKind = 'mul<' | 'add<' | 'sub>' | 'mul>';

export type Payload =
  | { mode: 'rem'; q: string; n: number; d: number; options: string[] }
  | { mode: 'eq'; q: string; kind: EqKind; a: number; res: number; options: string[] }
  | { mode: 'ineq'; q: string; kind: IneqKind; a: number; b: number; options: string[] };
type Answer = string;

const STORIES: { make: (n: number, d: number) => string }[] = [
  { make: (n, d) => `У Соломійки ${n} цукерок. Вона розкладає їх у коробки по ${d}. Скільки повних коробок вийде і скільки цукерок залишиться?` },
  { make: (n, d) => `У класі ${n} учнів. Їх ділять на групи по ${d} учнів. Скільки повних груп вийде і скільки учнів лишиться без групи?` },
  { make: (n, d) => `Тарас купив ${n} наліпок і клеїть по ${d} на сторінку альбому. Скільки сторінок буде повністю заклеєно і скільки наліпок лишиться?` },
  { make: (n, d) => `Бабуся спекла ${n} пиріжків і ділить їх на тарілки по ${d}. Скільки тарілок вона наповнить повністю і скільки пиріжків лишиться?` },
  { make: (n, d) => `У саду ${n} яблук. Їх складають у кошики по ${d}. Скільки кошиків буде повних і скільки яблук залишиться?` },
];

export const fmtRem = (q: number, r: number) => `${q} (ост. ${r})`;

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

function remOptions(n: number, d: number): string[] {
  const q = Math.floor(n / d), r = n % d;
  const cand: [number, number][] = [[q + 1, r], [q, d - r], [r, q], [q - 1, r], [q, r + 1], [q + 1, d - r], [q - 1, d - r]];
  const pool: string[] = [];
  for (const [a, b] of shuffle(cand)) {
    if (a < 0 || b < 0 || b >= d || a * d + b === n) continue;
    const s = fmtRem(a, b);
    if (!pool.includes(s)) pool.push(s);
  }
  return shuffle([fmtRem(q, r), ...pool.slice(0, 3)]);
}

export function eqText(kind: EqKind, a: number, res: number): string {
  return kind === 'add' ? `x + ${a} = ${res}` : kind === 'subFrom' ? `${a} − x = ${res}` : kind === 'mul' ? `x · ${a} = ${res}` : `x : ${a} = ${res}`;
}
export function eqHolds(kind: EqKind, a: number, res: number, x: number): boolean {
  return kind === 'add' ? x + a === res : kind === 'subFrom' ? a - x === res : kind === 'mul' ? x * a === res : x / a === res;
}
export function ineqHolds(kind: IneqKind, a: number, b: number, x: number): boolean {
  return kind === 'mul<' ? x * a < b : kind === 'add<' ? x + a < b : kind === 'sub>' ? x - a > b : x * a > b;
}
export function ineqText(kind: IneqKind, a: number, b: number): string {
  return kind === 'mul<' ? `x · ${a} < ${b}` : kind === 'add<' ? `x + ${a} < ${b}` : kind === 'sub>' ? `x − ${a} > ${b}` : `x · ${a} > ${b}`;
}

function eqRound(kind: EqKind): Omit<Round<Payload, Answer>, 'id'> {
  let a: number, x: number, res: number, extras: number[];
  if (kind === 'add') { a = randInt(10, 40); x = randInt(11, 50); res = x + a; extras = [res + a, a, res - a + 10, x + 1, x - 1]; }
  else if (kind === 'subFrom') { x = randInt(11, 40); res = randInt(10, 40); a = x + res; extras = [a + res, res, x + 10, x - 10, x + 1]; }
  else if (kind === 'mul') { a = randInt(3, 9); x = randInt(3, 9); res = a * x; extras = [res + a, res - a, a, x + 1, x - 1]; }
  else { a = randInt(3, 9); res = randInt(3, 9); x = a * res; extras = [a + res, res, x + a, x - a, a * res + 1]; }
  return { payload: { mode: 'eq', q: 'Розвʼяжи рівняння. Чому дорівнює x?', kind, a, res, options: numOptions(x, extras, 4, 1) }, answer: String(x) };
}

function ineqRound(kind: IneqKind): Omit<Round<Payload, Answer>, 'id'> {
  let a: number, b: number, sat: number[], fail: number[];
  const range = (lo: number, hi: number) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  if (kind === 'mul<') {
    a = randInt(3, 6); b = randInt(4 * a + 1, 9 * a + a - 1);
    const lim = Math.ceil(b / a) - 1; // найбільше x
    sat = range(1, lim); fail = range(lim + 1, lim + 6);
  } else if (kind === 'add<') {
    a = randInt(10, 30); b = a + randInt(5, 14);
    const lim = b - a - 1;
    sat = range(1, lim); fail = range(lim + 1, lim + 6);
  } else if (kind === 'sub>') {
    a = randInt(10, 30); b = randInt(5, 14);
    const lim = a + b; // x має бути більше за lim
    sat = range(lim + 1, lim + 9); fail = range(Math.max(a, lim - 6), lim);
  } else {
    a = randInt(3, 6); b = randInt(3 * a, 6 * a);
    const lim = Math.floor(b / a); // x має бути більше за lim
    sat = range(lim + 1, lim + 8); fail = range(Math.max(1, lim - 5), lim);
  }
  const ans = shuffle(sat)[0];
  const wrong = shuffle(fail.filter((v) => !ineqHolds(kind, a, b, v))).slice(0, 3);
  return { payload: { mode: 'ineq', q: 'Яке число підходить? Підстав його замість x.', kind, a, b, options: shuffle([ans, ...wrong]).map(String) }, answer: String(ans) };
}

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const items: Omit<Round<Payload, Answer>, 'id'>[] = [];
  if (difficulty === 1) {
    for (let i = 0; i < 5; i++) {
      const d = randInt(3, 9), q = randInt(2, 9);
      const r = randInt(1, d - 1);
      const n = q * d + r;
      const story = i < 3;
      items.push({ payload: { mode: 'rem', q: story ? shuffle(STORIES)[0].make(n, d) : `Поділи з остачею: ${n} : ${d}`, n, d, options: remOptions(n, d) }, answer: fmtRem(q, r) });
    }
  } else if (difficulty === 2) {
    const kinds: EqKind[] = shuffle(['add', 'subFrom', 'mul', 'div', Math.random() < 0.5 ? 'add' : 'mul'] as EqKind[]);
    for (const k of kinds) items.push(eqRound(k));
  } else {
    const kinds: IneqKind[] = shuffle(['mul<', 'add<', 'sub>', 'mul>', Math.random() < 0.5 ? 'mul<' : 'add<'] as IneqKind[]);
    for (const k of kinds) items.push(ineqRound(k));
  }
  return { difficulty, rounds: shuffle(items).map((r, i) => ({ ...r, id: `r${i}` })) };
}

export const PHRASES = {
  rem: { key: 'p_rem_rem', text: 'Поділи з остачею. Остача завжди менша за дільник.' },
  eq: { key: 'p_rem_eq', text: 'Розвʼяжи рівняння. Чому дорівнює x?' },
  ineq: { key: 'p_rem_ineq', text: 'Яке число підходить? Підстав його замість x.' },
} as const;

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = PHRASES[p.mode];
  const say = hasUkAudio(phrase.key) ? () => sayUkSeq([phrase]) : undefined;
  const big = { fontSize: 34, fontWeight: 900, textAlign: 'center' as const, margin: '8px 0' };
  return (
    <>
      <PromptCard question={p.q} answerState={answerState} say={say} sayKey={round.id}>
        {p.mode === 'eq' && <div style={big}>{eqText(p.kind, p.a, p.res)}</div>}
        {p.mode === 'ineq' && <div style={big}>{ineqText(p.kind, p.a, p.b)}</div>}
      </PromptCard>
      <ChoiceGrid options={p.options.map((o) => ({ value: o, node: <span style={{ fontSize: p.mode === 'rem' ? 20 : 26, fontWeight: 800 }}>{o}</span> }))}
        correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={p.mode === 'rem' ? 2 : 2} />
    </>
  );
}

const remainderEq: GameDefinition<Payload, Answer> = {
  id: 'remainder-eq',
  title: 'Остача і рівняння',
  subject: 'math',
  levels: ['L3'],
  icon: '🧮',
  description: 'Ділення з остачею, прості рівняння та нерівності зі змінною.',
  accent: '#E0F2FE',
  skillsFor: (d) => (d === 1 ? ['math.ops.l3.division-remainder'] : d === 2 ? ['math.ops.l3.equations-simple'] : ['math.ops.l3.inequality-variable']),
  explain: (round) => {
    const p = round.payload;
    if (p.mode === 'rem') {
      const q = Math.floor(p.n / p.d), r = p.n % p.d;
      return { steps: [`Шукаємо найбільше число, що ділиться на ${p.d} і не перевищує ${p.n}: ${q} · ${p.d} = ${q * p.d}.`, `Остача: ${p.n} − ${q * p.d} = ${r}.`, `Остача менша за ${p.d}, тож відповідь: ${fmtRem(q, r)}.`] };
    }
    if (p.mode === 'eq') {
      const x = Number(round.answer);
      const how = p.kind === 'add' ? `Невідомий доданок: x = ${p.res} − ${p.a}.` : p.kind === 'subFrom' ? `Невідомий відʼємник: x = ${p.a} − ${p.res}.` : p.kind === 'mul' ? `Невідомий множник: x = ${p.res} : ${p.a}.` : `Невідоме ділене: x = ${p.res} · ${p.a}.`;
      return { steps: [how, `x = ${x}.`, `Перевір: ${eqText(p.kind, p.a, p.res).replace('x', String(x))} — вірно.`] };
    }
    const x = Number(round.answer);
    return { steps: ['Підстав число замість x і перевір, чи нерівність правдива.', `${ineqText(p.kind, p.a, p.b).replace('x', String(x))} — правда, тож підходить ${x}.`] };
  },
  generate,
  Component,
};

export default remainderEq;
