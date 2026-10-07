import type { Difficulty, LevelData, Round } from '../types';
import { shuffle } from '../shared/ui';

/**
 * «Знайди тінь»: кольорова картинка → яка з тіней її? Тінь — та сама емодзі з
 * фільтром brightness(0): лишається лише силует, тож дивитись треба на форму.
 *
 * Окремий набір, а не групи «схожих»: у тіні ⚽ і 🏀, 🍎 і 🍏 — однакове коло,
 * і задача стала б нерозв'язною. Тут кожен силует упізнаваний за формою.
 * Складність — кількість варіантів: 3 → 4 → 6.
 */
export const SHADOW_SET = [
  '🐘', '🦒', '🦕', '🐢', '🐌', '🦀', '🐙', '🦋', '🐇', '🐓', '🦆', '🐧', '🐈', '🐕', '🐎', '🦔', '🐿️', '🦩',
  '✈️', '🚲', '⛵', '🚂', '🚁', '🎸', '☂️', '🔑', '🌵', '🍄', '🌙', '⭐', '🍌', '🍐', '🥕', '🎈', '🪁', '👓',
];

const OPTIONS: Record<Difficulty, number> = { 1: 3, 2: 4, 3: 6 };

export interface Payload {
  target: string;
  options: string[];
}

export function generate(difficulty: Difficulty): LevelData<Payload, string> {
  const targets = shuffle(SHADOW_SET).slice(0, 5);
  const rounds: Round<Payload, string>[] = targets.map((target, i) => {
    const others = shuffle(SHADOW_SET.filter((e) => e !== target)).slice(0, OPTIONS[difficulty] - 1);
    return { id: `r${i}`, payload: { target, options: shuffle([target, ...others]) }, answer: target };
  });
  return { difficulty, rounds };
}
