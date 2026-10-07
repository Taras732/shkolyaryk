import type { Difficulty } from '../types';
import { pickOne, shuffleWith } from '../puzzles/shared';

/**
 * Терези: предмет на лівій шальці, гирі — щоб урівноважити рівно.
 * 1–2: гирі лише на праву шальку (додавання); 3: гирі можна класти і до предмета
 * (віднімання — класика з гирями 1, 3, 9: ними зважиш усе від 1 до 13).
 */
export type Side = 0 | 1 | -1; // 0 — не на терезах, 1 — права шалька, -1 — ліва (до предмета)

export interface ScaleTask {
  item: { emoji: string; name: string };
  weight: number;
  weights: number[];
  twoSided: boolean;
}

const ITEMS = [
  { emoji: '🍉', name: 'кавун' }, { emoji: '🎃', name: 'гарбуз' }, { emoji: '🧺', name: 'кошик' },
  { emoji: '🐱', name: 'котик' }, { emoji: '🎒', name: 'рюкзак' }, { emoji: '🍍', name: 'ананас' },
];

const SETS: Record<Difficulty, number[]> = { 1: [1, 2, 5], 2: [1, 2, 4, 8], 3: [1, 3, 9] };

/** Чи можна урівноважити вагу цим набором (з/без гир на лівій шальці). */
export function reachable(weights: number[], target: number, twoSided: boolean): boolean {
  const sides: Side[] = twoSided ? [0, 1, -1] : [0, 1];
  const go = (i: number, sum: number): boolean => (i === weights.length ? sum === target : sides.some((s) => go(i + 1, sum + s * weights[i])));
  return go(0, 0);
}

export function makeTasks(d: Difficulty, rng: () => number = Math.random): ScaleTask[] {
  const weights = SETS[d];
  const twoSided = d === 3;
  const max = weights.reduce((s, w) => s + w, 0);
  const candidates = Array.from({ length: max }, (_, i) => i + 1).filter((w) => reachable(weights, w, twoSided) && !weights.includes(w));
  // на 3 рівні — лише ті, де без віднімання не обійтись
  const pool = twoSided ? candidates.filter((w) => !reachable(weights, w, false)) : candidates;
  return shuffleWith(pool, rng)
    .slice(0, 3)
    .map((weight) => ({ item: pickOne(ITEMS, rng), weight, weights, twoSided }));
}

/** Різниця шальок: >0 — переважує права (гирі), <0 — ліва (предмет). */
export function balance(t: ScaleTask, sides: Side[]): number {
  return sides.reduce<number>((s, side, i) => s + side * t.weights[i], 0) - t.weight;
}
