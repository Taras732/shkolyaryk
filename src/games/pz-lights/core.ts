import type { Difficulty } from '../types';

/**
 * «Вимкни всі лампи»: натискання перемикає лампу і її сусідів (хрестом).
 * Поле будуємо натисканнями з повністю вимкненого — тож розв'язок завжди є,
 * і він не довший за кількість цих натискань.
 */
export const LEVELS: Record<Difficulty, { n: number; presses: number }> = {
  1: { n: 3, presses: 2 },
  2: { n: 3, presses: 4 },
  3: { n: 4, presses: 6 },
};

export function press(b: boolean[], i: number, n: number): boolean[] {
  const r = Math.floor(i / n);
  const c = i % n;
  const hit = new Set([i]);
  if (r > 0) hit.add(i - n);
  if (r < n - 1) hit.add(i + n);
  if (c > 0) hit.add(i - 1);
  if (c < n - 1) hit.add(i + 1);
  return b.map((v, k) => (hit.has(k) ? !v : v));
}

export function generate(d: Difficulty, rng: () => number = Math.random): { n: number; board: boolean[]; presses: number } {
  const { n, presses } = LEVELS[d];
  for (;;) {
    let b = Array(n * n).fill(false) as boolean[];
    const used = new Set<number>();
    while (used.size < presses) used.add(Math.floor(rng() * n * n));
    for (const i of used) b = press(b, i, n);
    if (b.some(Boolean)) return { n, board: b, presses };
  }
}

export const allOff = (b: boolean[]) => b.every((v) => !v);
