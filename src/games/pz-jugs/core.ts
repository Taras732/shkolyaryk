import type { Difficulty } from '../types';

/**
 * Переливайка: банки заданого об'єму, треба відміряти рівно `target` літрів у будь-якій.
 * З краном (`tap: true`) банку можна наповнити й вилити; без крана — лише переливати
 * (класика: 8 л повна, 5 і 3 порожні → розділити навпіл).
 */
export interface JugTask {
  caps: number[];
  start: number[];
  target: number;
  tap: boolean;
}

export const TASKS: Record<Difficulty, JugTask[]> = {
  1: [
    { caps: [3, 5], start: [0, 0], target: 2, tap: true },
    { caps: [2, 5], start: [0, 0], target: 3, tap: true },
    { caps: [4, 7], start: [0, 0], target: 3, tap: true },
  ],
  2: [
    { caps: [3, 5], start: [0, 0], target: 4, tap: true },
    { caps: [4, 9], start: [0, 0], target: 1, tap: true },
    { caps: [3, 7], start: [0, 0], target: 5, tap: true },
  ],
  3: [
    { caps: [8, 5, 3], start: [8, 0, 0], target: 4, tap: false },
    { caps: [10, 7, 3], start: [10, 0, 0], target: 5, tap: false },
    { caps: [6, 4, 1], start: [6, 0, 0], target: 2, tap: false },
  ],
};

export const solved = (t: JugTask, s: number[]) => s.includes(t.target);

export function fill(t: JugTask, s: number[], i: number): number[] {
  return s.map((v, k) => (k === i ? t.caps[i] : v));
}

export function empty(s: number[], i: number): number[] {
  return s.map((v, k) => (k === i ? 0 : v));
}

export function pour(t: JugTask, s: number[], from: number, to: number): number[] {
  if (from === to) return s;
  const amount = Math.min(s[from], t.caps[to] - s[to]);
  return s.map((v, k) => (k === from ? v - amount : k === to ? v + amount : v));
}

/** Найменше ходів до розв'язку (BFS) — для тестів і для підказки «можна за N». */
export function minMoves(t: JugTask): number {
  const key = (s: number[]) => s.join(',');
  const seen = new Set([key(t.start)]);
  let frontier = [t.start];
  for (let d = 0; d < 30; d++) {
    if (frontier.some((s) => solved(t, s))) return d;
    const next: number[][] = [];
    for (const s of frontier) {
      const moves: number[][] = [];
      for (let i = 0; i < s.length; i++) {
        if (t.tap) moves.push(fill(t, s, i), empty(s, i));
        for (let j = 0; j < s.length; j++) moves.push(pour(t, s, i, j));
      }
      for (const m of moves) if (!seen.has(key(m))) (seen.add(key(m)), next.push(m));
    }
    frontier = next;
  }
  return -1;
}
