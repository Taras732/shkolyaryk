import type { Difficulty } from '../types';

/** Розмір пазла за рівнем: 2×2 → 3×3 → 4×4 (рішення Тараса 10.10). */
export const SIZE: Record<Difficulty, { cols: number; rows: number }> = {
  1: { cols: 2, rows: 2 },
  2: { cols: 3, rows: 3 },
  3: { cols: 4, rows: 4 },
};

export const isSolved = (order: number[]) => order.every((v, i) => v === i);

/** Перемішати так, щоб щонайменше половина шматків стояла не на своєму місці. */
export function scramble(n: number, rng: () => number = Math.random): number[] {
  for (;;) {
    const a = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    if (a.filter((v, i) => v !== i).length >= Math.ceil(n / 2)) return a;
  }
}

export function swap(order: number[], i: number, j: number): number[] {
  const out = [...order];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
}
