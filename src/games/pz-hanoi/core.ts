import type { Difficulty } from '../types';

/** Ханойська вежа: усі кільця з першої палички на останню; велике на мале класти не можна. */
export const DISKS: Record<Difficulty, number> = { 1: 3, 2: 4, 3: 5 };
export type Pegs = number[][]; // кільця знизу вгору, число = розмір

export const start = (n: number): Pegs => [Array.from({ length: n }, (_, i) => n - i), [], []];
export const minMoves = (n: number) => 2 ** n - 1;

export function canMove(p: Pegs, from: number, to: number): boolean {
  const a = p[from][p[from].length - 1];
  const b = p[to][p[to].length - 1];
  return from !== to && a !== undefined && (b === undefined || a < b);
}

export function move(p: Pegs, from: number, to: number): Pegs {
  if (!canMove(p, from, to)) return p;
  const out = p.map((x) => [...x]);
  out[to].push(out[from].pop()!);
  return out;
}

export const isSolved = (p: Pegs, n: number) => p[2].length === n;
