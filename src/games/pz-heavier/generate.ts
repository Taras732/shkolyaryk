import type { Difficulty, LevelData, Round } from '../types';
import { shuffleWith } from '../puzzles/shared';

/**
 * «Хто важчий?»: кілька зважувань на терезах → хто найважчий / найлегший.
 * Тренує логічний висновок: якщо 🍎 важче за 🍐, а 🍐 важче за 🍌 — то 🍎 найважче,
 * хоч їх ніхто разом не зважував.
 *  1 — 3 предмети, 2 зважування, питання «хто найважчий»;
 *  2 — 3 предмети, зважування переплутані, питання то про найважчого, то про найлегшого;
 *  3 — 4 предмети, 3 зважування.
 */

/**
 * Предмети схожої ваги: відповідь має йти від зважувань, а не від знання світу
 * (з 🐘 і 🐭 дитина «вгадає» без терезів — або, гірше, засперечається з ними).
 */
const SETS = [
  ['🟥', '🟦', '🟩', '🟨'],
  ['🍎', '🍐', '🍊', '🍋'],
  ['🔴', '🔵', '🟢', '🟡'],
  ['🎁', '📦', '🛍️', '🧺'],
  ['🐱', '🐶', '🐰', '🦊'],
];

export interface Weighing {
  heavy: string;
  light: string;
}

export interface Payload {
  weighings: Weighing[];
  ask: 'heaviest' | 'lightest';
  options: string[];
}

/** Порядок за вагою (перший — найважчий), зважування — сусідні пари цього порядку. */
export function makeRound(d: Difficulty, rng: () => number = Math.random): { payload: Payload; answer: string } {
  const set = SETS[Math.floor(rng() * SETS.length)];
  const count = d === 3 ? 4 : 3;
  const order = shuffleWith(set, rng).slice(0, count);
  const pairs: Weighing[] = [];
  for (let i = 0; i < count - 1; i++) pairs.push({ heavy: order[i], light: order[i + 1] });
  const weighings = d === 1 ? pairs : shuffleWith(pairs, rng);
  const ask: Payload['ask'] = d === 1 || rng() < 0.5 ? 'heaviest' : 'lightest';
  return { payload: { weighings, ask, options: shuffleWith(order, rng) }, answer: ask === 'heaviest' ? order[0] : order[count - 1] };
}

export function generate(difficulty: Difficulty): LevelData<Payload, string> {
  const rounds: Round<Payload, string>[] = Array.from({ length: 5 }, (_, i) => ({ id: `r${i}`, ...makeRound(difficulty) }));
  return { difficulty, rounds };
}
