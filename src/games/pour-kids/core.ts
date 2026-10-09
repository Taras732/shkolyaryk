import type { Difficulty } from '../types';

/**
 * «Переливайка» для дошкілля (10.10.2026, замість «Розклади порівну»).
 * Прозорі банки з рисками-літрами; треба, щоб у якійсь банці стало рівно до ⭐.
 *  1 — один рух: велика банка повна, переливаєш у меншу — у великій лишається скільки треба;
 *  2 — два рухи: є кран і відро (набрати / вилити);
 *  3 — чотири рухи: класика «двома банками відміряй».
 * Мінімальну кількість рухів кожної задачі доводить тест (minMoves).
 */
export interface PourTask {
  caps: number[];
  start: number[];
  target: number;
  /** Кран (набрати повну) і відро (вилити) доступні. */
  tap: boolean;
}

export const POUR_TASKS: Record<Difficulty, PourTask[]> = {
  1: [
    { caps: [5, 3], start: [5, 0], target: 2, tap: false },
    { caps: [4, 1], start: [4, 0], target: 3, tap: false },
    { caps: [5, 2], start: [5, 0], target: 3, tap: false },
    { caps: [3, 1], start: [3, 0], target: 2, tap: false },
    { caps: [5, 4], start: [5, 0], target: 1, tap: false },
  ],
  2: [
    { caps: [5, 3], start: [0, 0], target: 2, tap: true },
    { caps: [5, 2], start: [0, 0], target: 3, tap: true },
    { caps: [5, 4], start: [0, 0], target: 1, tap: true },
    { caps: [4, 1], start: [0, 0], target: 3, tap: true },
  ],
  3: [
    { caps: [5, 3], start: [0, 0], target: 1, tap: true },
    { caps: [5, 2], start: [0, 0], target: 1, tap: true },
    { caps: [4, 3], start: [0, 0], target: 2, tap: true },
  ],
};

export const TASKS_PER_GAME = 3;

/** Перелити з банки `from` у банку `to` — скільки влізе. */
export function pour(v: number[], caps: number[], from: number, to: number): number[] {
  const n = Math.min(v[from], caps[to] - v[to]);
  return v.map((x, i) => (i === from ? x - n : i === to ? x + n : x));
}
export const fill = (v: number[], caps: number[], i: number) => v.map((x, k) => (k === i ? caps[k] : x));
export const empty = (v: number[], i: number) => v.map((x, k) => (k === i ? 0 : x));
export const solved = (v: number[], target: number) => v.includes(target);

/** Найменша кількість рухів (BFS); -1 — нерозвʼязна. */
export function minMoves(t: PourTask): number {
  const key = (v: number[]) => v.join(',');
  let frontier = [t.start];
  const seen = new Set([key(t.start)]);
  for (let d = 0; d <= 12; d++) {
    if (frontier.some((v) => solved(v, t.target))) return d;
    const next: number[][] = [];
    for (const v of frontier) {
      const moves: number[][] = [];
      for (let a = 0; a < v.length; a++) {
        for (let b = 0; b < v.length; b++) if (a !== b) moves.push(pour(v, t.caps, a, b));
        if (t.tap) moves.push(fill(v, t.caps, a), empty(v, a));
      }
      for (const m of moves) if (!seen.has(key(m))) { seen.add(key(m)); next.push(m); }
    }
    frontier = next;
  }
  return -1;
}

export function pickTasks(d: Difficulty, rng: () => number = Math.random): PourTask[] {
  const pool = [...POUR_TASKS[d]];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, TASKS_PER_GAME);
}
