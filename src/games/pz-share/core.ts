import type { Difficulty } from '../types';
import { pickOne } from '../puzzles/shared';

/**
 * Розклади порівну: N предметів на K тарілок так, щоб на всіх було однаково.
 * На 3 рівні ділиться з остачею: на тарілках порівну, а решта (менше за K)
 * лишається в коробці — дитина бачить, що таке остача, руками.
 */
export interface ShareTask {
  emoji: string;
  n: number;
  k: number;
}

const ITEMS = ['🍬', '🍪', '🍓', '🥕', '🍒', '🧁', '🍎', '🥟'];

export function makeTasks(d: Difficulty, rng: () => number = Math.random): ShareTask[] {
  return Array.from({ length: 3 }, () => {
    const k = d === 1 ? 2 + Math.floor(rng() * 2) : 3 + Math.floor(rng() * 2);
    const per = d === 1 ? 2 + Math.floor(rng() * 3) : 3 + Math.floor(rng() * 3);
    const rest = d === 3 ? 1 + Math.floor(rng() * (k - 1)) : 0;
    return { emoji: pickOne(ITEMS, rng), n: k * per + rest, k };
  });
}

/** Правильно: на всіх тарілках однаково, і в коробці лишилось менше, ніж тарілок. */
export function isFair(plates: number[], pile: number): boolean {
  return plates.every((p) => p === plates[0]) && pile < plates.length;
}
