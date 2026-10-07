import type { Difficulty, GameExplain } from '../types';

/**
 * Таблиця множення v2 — тренажер ФАКТІВ, а не випадкових пар.
 *
 * Навіщо переробка (аудит 07.10): стара гра давала випадкові a×b з 2..9 одразу
 * і 4 варіанти на вибір — дитина вгадувала, а не згадувала, і не було як
 * сказати «сьогодні вчимо ×7». Тепер:
 *  - дитина обирає таблицю (×6) або «Мікс» / «Мої помилки»;
 *  - відповідь вводиться з клавіатури (згадати, а не впізнати);
 *  - кожен факт має власну статистику: що плутається, те повертається частіше;
 *  - таймера немає свідомо: на етапі вивчення він вчить поспіху, не таблиці.
 *
 * Складність (відкривається зірками, як у решти ігор):
 *  1 — по порядку (6×2, 6×3, …): спирається на лічбу через крок;
 *  2 — врозкид, множники міняються місцями (6×7 і 7×6);
 *  3 — врозкид + табличне ділення (42 ÷ 6).
 */

export const TABLES = [2, 3, 4, 5, 6, 7, 8, 9] as const;
/** Множники в межах однієї таблиці: ×1 і ×10 тривіальні, не тренують навичку. */
export const FACTORS = [2, 3, 4, 5, 6, 7, 8, 9] as const;
export const SESSION_LEN = 10;
/** Факт вважається вивченим після стількох правильних відповідей з першої спроби поспіль. */
export const KNOWN_STREAK = 3;

export type Op = '×' | '÷';

export interface Question {
  a: number;
  b: number;
  op: Op;
  answer: number;
  /** Ключ факту для статистики: ділення 42÷6 рахується на факт 6×7. */
  fact: string;
}

export interface FactStat {
  ok: number;
  bad: number;
  streak: number;
  last: number;
}

export type FactStats = Record<string, FactStat>;

export type Mode = { kind: 'table'; n: number } | { kind: 'mix' } | { kind: 'mistakes' };

export type Rng = () => number;

export function factKey(a: number, b: number): string {
  return a <= b ? `${a}x${b}` : `${b}x${a}`;
}

function parseKey(key: string): [number, number] {
  const [a, b] = key.split('x').map(Number);
  return [a, b];
}

export function isKnown(stat: FactStat | undefined): boolean {
  return !!stat && stat.streak >= KNOWN_STREAK;
}

/** Слабкий факт: хоч раз помилилась і ще не закріпила. */
export function isWeak(stat: FactStat | undefined): boolean {
  return !!stat && stat.bad > 0 && stat.streak < KNOWN_STREAK;
}

/** Факти таблиці n: n×2 … n×9 (8 штук; 6×6 входить один раз). */
export function tableFacts(n: number): string[] {
  return FACTORS.map((k) => factKey(n, k));
}

export function tableProgress(stats: FactStats, n: number): { known: number; total: number } {
  const facts = tableFacts(n);
  return { known: facts.filter((f) => isKnown(stats[f])).length, total: facts.length };
}

/** Перша таблиця, яку ще не вивчено. null — вивчено все. */
export function recommendedTable(stats: FactStats): number | null {
  for (const n of TABLES) {
    const { known, total } = tableProgress(stats, n);
    if (known < total) return n;
  }
  return null;
}

/** Слабкі факти, найпроблемніші першими. */
export function weakFacts(stats: FactStats): string[] {
  return Object.keys(stats)
    .filter((k) => isWeak(stats[k]))
    .sort((x, y) => {
      const sx = stats[x];
      const sy = stats[y];
      return sy.bad - sy.ok - (sx.bad - sx.ok) || sy.last - sx.last;
    });
}

export function recordAnswer(stats: FactStats, fact: string, firstTry: boolean, now: number): FactStats {
  const prev = stats[fact] ?? { ok: 0, bad: 0, streak: 0, last: 0 };
  const next: FactStat = firstTry
    ? { ok: prev.ok + 1, bad: prev.bad, streak: prev.streak + 1, last: now }
    : { ok: prev.ok, bad: prev.bad + 1, streak: 0, last: now };
  return { ...stats, [fact]: next };
}

function shuffleWith<T>(arr: readonly T[], rng: Rng): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Невивчене — утричі частіше за вивчене; слабке — ще вдвічі. */
function weightOf(stat: FactStat | undefined): number {
  if (isWeak(stat)) return 6;
  if (!isKnown(stat)) return 3;
  return 1;
}

function weightedPick(keys: string[], stats: FactStats, rng: Rng, avoid?: string): string {
  const pool = keys.length > 1 && avoid ? keys.filter((k) => k !== avoid) : keys;
  const total = pool.reduce((s, k) => s + weightOf(stats[k]), 0);
  let r = rng() * total;
  for (const k of pool) {
    r -= weightOf(stats[k]);
    if (r < 0) return k;
  }
  return pool[pool.length - 1];
}

/**
 * Перетворити факт на питання. `table` — якщо тренуємо конкретну таблицю,
 * її число стоїть першим множником (6×7), інакше порядок за складністю.
 */
function toQuestion(fact: string, difficulty: Difficulty, rng: Rng, table?: number): Question {
  const [x, y] = parseKey(fact);
  const product = x * y;
  if (difficulty === 3 && rng() < 0.35) {
    const divisor = table && (table === x || table === y) ? table : rng() < 0.5 ? x : y;
    return { a: product, b: divisor, op: '÷', answer: product / divisor, fact };
  }
  let a: number;
  let b: number;
  if (table && difficulty === 1) {
    a = table;
    b = table === x ? y : x;
  } else if (rng() < 0.5) {
    [a, b] = [x, y];
  } else {
    [a, b] = [y, x];
  }
  return { a, b, op: '×', answer: product, fact };
}

/** Факти, які вже «в роботі»: усе з таблиць до рекомендованої включно. */
function mixPool(stats: FactStats): string[] {
  const upTo = recommendedTable(stats) ?? TABLES[TABLES.length - 1];
  const keys = new Set<string>();
  for (const n of TABLES) {
    if (n > upTo) break;
    for (const f of tableFacts(n)) keys.add(f);
  }
  return [...keys];
}

/**
 * Зібрати сесію з SESSION_LEN питань. Порожній масив — у режимі «Мої помилки»
 * помилок немає (UI каже про це, а не підсовує випадкове).
 */
export function buildSession(mode: Mode, difficulty: Difficulty, stats: FactStats, rng: Rng = Math.random): Question[] {
  if (mode.kind === 'table') {
    const facts = tableFacts(mode.n);
    const main = difficulty === 1 ? facts : shuffleWith(facts, rng);
    // Добираємо до SESSION_LEN найслабшими фактами цієї ж таблиці — повтор того, що не йде.
    const extra: string[] = [];
    while (main.length + extra.length < SESSION_LEN) {
      extra.push(weightedPick(facts, stats, rng, extra[extra.length - 1] ?? main[main.length - 1]));
    }
    return [...main, ...extra].map((f) => toQuestion(f, difficulty, rng, mode.n));
  }

  if (mode.kind === 'mistakes') {
    const weak = weakFacts(stats).slice(0, SESSION_LEN);
    if (weak.length === 0) return [];
    const seq = [...weak];
    while (seq.length < SESSION_LEN) seq.push(weightedPick(weak, stats, rng, seq[seq.length - 1]));
    return shuffleWith(seq, rng).map((f) => toQuestion(f, Math.max(2, difficulty) as Difficulty, rng));
  }

  const pool = mixPool(stats);
  const seq: string[] = [];
  while (seq.length < SESSION_LEN) seq.push(weightedPick(pool, stats, rng, seq[seq.length - 1]));
  return seq.map((f) => toQuestion(f, Math.max(2, difficulty) as Difficulty, rng));
}

/** Куди повернути помилкове питання в черзі: через 3 інших, щоб не відповідала з короткої пам'яті. */
export const REQUEUE_GAP = 3;

export function requeue(queue: Question[], index: number): Question[] {
  const q = queue[index];
  const at = Math.min(queue.length, index + 1 + REQUEUE_GAP);
  return [...queue.slice(0, at), q, ...queue.slice(at)];
}

/**
 * EP1 для множення: повторюване додавання + стратегія «від п'ятірки» для
 * великих множників (до ×5 діти зазвичай уже знають — спираємось на відоме).
 */
export function explainMultiply(a: number, b: number, answer: number): GameExplain {
  const correct = a * b;
  // менший множник — як кількість доданків: 8×3 читаємо як 8+8+8, а не 3 по 8
  const [times, value] = a <= b ? [a, b] : [b, a];
  const steps = [`${a} × ${b} — це ${times} рази по ${value}`];
  if (times <= 5) {
    steps.push(`${Array(times).fill(value).join(' + ')} = ${correct}`);
  } else {
    const chain = [`5 × ${value} = ${5 * value}`];
    for (let t = 6; t <= times; t++) chain.push(`ще ${value} → ${t * value}`);
    steps.push(`Від п'ятірки: ${chain.join(', ')}`);
  }

  if (answer === a + b) {
    return { steps, why: `${a} + ${b} = ${a + b} — це додавання. А тут знак ×: треба взяти ${value} кілька разів` };
  }
  if (answer === correct - value || answer === correct + value) {
    const off = answer < correct ? 'на один раз менше' : 'на один раз більше';
    return { steps, why: `Схоже, ${value} узято ${off}, ніж треба` };
  }
  return { steps };
}

/** EP1 для ділення: ділення — це множення навпаки. */
export function explainDivide(a: number, b: number, answer: number): GameExplain {
  const q = a / b;
  const steps = [`${a} ÷ ${b} — скільки разів по ${b} вміщується в ${a}?`, `${b} × ${q} = ${a}, тому ${a} ÷ ${b} = ${q}`];
  if (answer === a - b) return { steps, why: `${a} − ${b} = ${a - b} — це віднімання. А тут знак ÷` };
  if (answer * b === a + b || answer * b === a - b) return { steps, why: `Схоже, промах на один раз: ${b} × ${answer} = ${b * answer}` };
  return { steps };
}

export function explainQuestion(q: Question, answer: number): GameExplain {
  return q.op === '×' ? explainMultiply(q.a, q.b, answer) : explainDivide(q.a, q.b, answer);
}
