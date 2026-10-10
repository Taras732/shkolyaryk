import type { Difficulty } from '../types';
import { shuffleWith } from '../puzzles/shared';

/**
 * Сортуй кольори: пробірки по CAP шарів. Переливати можна верхній колір у порожню
 * пробірку або на такий самий колір, якщо є місце (переливається весь однаковий
 * верхній шар, скільки влізе). Мета — кожна пробірка порожня або одного кольору.
 */
export const CAP = 4;
export const COLORS = ['#EF4444', '#3B82F6', '#22C55E', '#EAB308', '#A855F7', '#F97316'];
export const LEVELS: Record<Difficulty, { colors: number; empty: number }> = {
  1: { colors: 3, empty: 2 },
  2: { colors: 4, empty: 2 },
  3: { colors: 5, empty: 2 },
};

export type Tubes = number[][];

export function canPour(t: Tubes, from: number, to: number, cap = CAP): boolean {
  if (from === to || t[from].length === 0 || t[to].length >= cap) return false;
  return t[to].length === 0 || t[to][t[to].length - 1] === t[from][t[from].length - 1];
}

export function pour(t: Tubes, from: number, to: number, cap = CAP): Tubes {
  if (!canPour(t, from, to, cap)) return t;
  const out = t.map((x) => [...x]);
  const color = out[from][out[from].length - 1];
  while (out[from].length && out[from][out[from].length - 1] === color && out[to].length < cap) out[to].push(out[from].pop()!);
  return out;
}

export const isSolved = (t: Tubes, cap = CAP) => t.every((x) => x.length === 0 || (x.length === cap && x.every((c) => c === x[0])));

/** Пошук у глибину з пам'яттю станів — перевірити, що розкладку можна розв'язати. */
export function isSolvable(start: Tubes, limit = 50000, cap = CAP): boolean {
  const key = (t: Tubes) => t.map((x) => x.join('')).sort().join('|');
  const seen = new Set<string>();
  const stack = [start];
  while (stack.length && seen.size < limit) {
    const t = stack.pop()!;
    if (isSolved(t, cap)) return true;
    const k = key(t);
    if (seen.has(k)) continue;
    seen.add(k);
    for (let i = 0; i < t.length; i++) for (let j = 0; j < t.length; j++) if (canPour(t, i, j, cap)) stack.push(pour(t, i, j, cap));
  }
  return false;
}

/** Дошкілля (10.10.2026): менше кольорів і коротші пробірки — 2×3 → 3×3 → 3×4 кульки. */
export const KID_LEVELS: Record<Difficulty, { colors: number; empty: number; cap: number }> = {
  1: { colors: 2, empty: 1, cap: 3 },
  2: { colors: 3, empty: 1, cap: 3 },
  3: { colors: 3, empty: 2, cap: 4 },
};

export function generate(d: Difficulty, rng: () => number = Math.random, kid = false): Tubes {
  const { colors, empty } = kid ? KID_LEVELS[d] : LEVELS[d];
  const cap = kid ? KID_LEVELS[d].cap : CAP;
  for (;;) {
    const units = shuffleWith(Array.from({ length: colors * cap }, (_, i) => Math.floor(i / cap)), rng);
    const tubes: Tubes = Array.from({ length: colors }, (_, i) => units.slice(i * cap, i * cap + cap));
    for (let e = 0; e < empty; e++) tubes.push([]);
    if (!isSolved(tubes, cap) && isSolvable(tubes, 50000, cap)) return tubes;
  }
}
