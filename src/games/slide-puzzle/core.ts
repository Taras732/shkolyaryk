import type { Difficulty } from '../types';

/**
 * П'ятнашки: n×n, остання клітинка порожня (значення n*n-1). Перемішуємо випадковими
 * ХОДАМИ від складеної картинки — так розкладка завжди розв'язна, а кількість ходів
 * задає складність (на 2×2 вистачить кількох, на 3×3 — більше).
 */
export const LEVELS: Record<Difficulty, { n: number; moves: number }> = {
  1: { n: 2, moves: 6 },
  2: { n: 3, moves: 14 },
  3: { n: 3, moves: 40 },
};

export const isSolved = (b: number[]) => b.every((v, i) => v === i);

export function neighbours(pos: number, n: number): number[] {
  const r = Math.floor(pos / n);
  const c = pos % n;
  const out: number[] = [];
  if (r > 0) out.push(pos - n);
  if (r < n - 1) out.push(pos + n);
  if (c > 0) out.push(pos - 1);
  if (c < n - 1) out.push(pos + 1);
  return out;
}

/** Хід: якщо клітинка поруч із порожньою — міняємо їх місцями, інакше дошка без змін. */
export function move(b: number[], pos: number, n: number): number[] {
  const empty = b.indexOf(n * n - 1);
  if (!neighbours(empty, n).includes(pos)) return b;
  const out = [...b];
  [out[empty], out[pos]] = [out[pos], out[empty]];
  return out;
}

export function shuffleByMoves(n: number, moves: number, rng: () => number = Math.random): number[] {
  for (;;) {
    let b = Array.from({ length: n * n }, (_, i) => i);
    let prev = -1;
    for (let i = 0; i < moves; i++) {
      const empty = b.indexOf(n * n - 1);
      const opts = neighbours(empty, n).filter((p) => p !== prev); // не скасовувати попередній хід
      const pick = opts[Math.floor(rng() * opts.length)];
      prev = empty;
      b = move(b, pick, n);
    }
    if (!isSolved(b)) return b;
  }
}
