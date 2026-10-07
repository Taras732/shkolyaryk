import type { Difficulty } from '../types';

/**
 * «Шлях до числа»: сітка чисел, треба пройти сусідніми клітинками (вгору/вниз/
 * вбік, без повторів) так, щоб сума була рівно `target`. Задачу будуємо від
 * випадкового шляху — тож розв'язок точно є (можуть бути й інші — теж зараховуємо).
 */
export const LEVELS: Record<Difficulty, { n: number; len: number; max: number }> = {
  1: { n: 3, len: 3, max: 5 },
  2: { n: 4, len: 4, max: 9 },
  3: { n: 4, len: 5, max: 9 },
};

export function neighbours(i: number, n: number): number[] {
  const r = Math.floor(i / n);
  const c = i % n;
  const out: number[] = [];
  if (r > 0) out.push(i - n);
  if (r < n - 1) out.push(i + n);
  if (c > 0) out.push(i - 1);
  if (c < n - 1) out.push(i + 1);
  return out;
}

export interface PathTask {
  n: number;
  grid: number[];
  target: number;
  len: number;
}

export function generate(d: Difficulty, rng: () => number = Math.random): PathTask {
  const { n, len, max } = LEVELS[d];
  const grid = Array.from({ length: n * n }, () => 1 + Math.floor(rng() * max));
  for (;;) {
    const path = [Math.floor(rng() * n * n)];
    while (path.length < len) {
      const opts = neighbours(path[path.length - 1], n).filter((x) => !path.includes(x));
      if (!opts.length) break;
      path.push(opts[Math.floor(rng() * opts.length)]);
    }
    if (path.length === len) return { n, grid, target: path.reduce((s, i) => s + grid[i], 0), len };
  }
}

/** Хід допустимий: перша клітинка будь-яка, далі — сусідня до останньої і ще не взята. */
export function canAdd(path: number[], i: number, n: number): boolean {
  if (path.includes(i)) return false;
  return path.length === 0 || neighbours(path[path.length - 1], n).includes(i);
}
