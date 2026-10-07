import type { Difficulty } from '../types';

/**
 * Лабіринт: ідеальний (між будь-якими двома клітинками рівно один шлях), будуємо
 * пошуком у глибину з випадковим вибором. Стіни клітинки — 4 біти: N E S W.
 */
export const SIZE: Record<Difficulty, number> = { 1: 4, 2: 6, 3: 8 };
export const N = 1;
export const E = 2;
export const S = 4;
export const W = 8;

export function generate(n: number, rng: () => number = Math.random): number[] {
  const walls = Array(n * n).fill(N | E | S | W) as number[];
  const seen = new Set([0]);
  const stack = [0];
  while (stack.length) {
    const cur = stack[stack.length - 1];
    const r = Math.floor(cur / n);
    const c = cur % n;
    const opts: [number, number, number][] = [];
    if (r > 0 && !seen.has(cur - n)) opts.push([cur - n, N, S]);
    if (c < n - 1 && !seen.has(cur + 1)) opts.push([cur + 1, E, W]);
    if (r < n - 1 && !seen.has(cur + n)) opts.push([cur + n, S, N]);
    if (c > 0 && !seen.has(cur - 1)) opts.push([cur - 1, W, E]);
    if (!opts.length) {
      stack.pop();
      continue;
    }
    const [next, a, b] = opts[Math.floor(rng() * opts.length)];
    walls[cur] &= ~a;
    walls[next] &= ~b;
    seen.add(next);
    stack.push(next);
  }
  return walls;
}

export const DIRS = { up: [N, -1, 0], right: [E, 0, 1], down: [S, 1, 0], left: [W, 0, -1] } as const;
export type Dir = keyof typeof DIRS;

/** Крок у напрямку, якщо немає стіни; інакше — на місці. */
export function step(walls: number[], n: number, pos: number, dir: Dir): number {
  const [bit, dr, dc] = DIRS[dir];
  if (walls[pos] & bit) return pos;
  return pos + dr * n + dc;
}

/** Довжина шляху від старту до виходу (BFS) — для тестів. */
export function pathLength(walls: number[], n: number): number {
  const dist = new Map([[0, 0]]);
  const q = [0];
  while (q.length) {
    const p = q.shift()!;
    for (const d of Object.keys(DIRS) as Dir[]) {
      const nx = step(walls, n, p, d);
      if (nx !== p && !dist.has(nx)) {
        dist.set(nx, dist.get(p)! + 1);
        q.push(nx);
      }
    }
  }
  return dist.get(n * n - 1) ?? -1;
}
