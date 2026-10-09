import type { Difficulty, LevelData, Round } from '../types';
import { shuffle } from '../shared/ui';

/**
 * «Знайди тінь»: кольорова картинка → яка з тіней її? Тінь — та сама емодзі з
 * фільтром brightness(0): лишається лише силует, тож дивитись треба на форму.
 *
 * Ускладнення (09.10.2026, Тарас: «літачок і окуляри — надто легко»):
 *  1 — 3 варіанти, різні за формою;
 *  2 — 4 варіанти, СХОЖІ за формою (усі чотирилапі / усе, що літає…);
 *  3 — 4 варіанти схожих + ДЗЕРКАЛЬНА тінь самої картинки: та сама форма, але повернута —
 *      треба помітити, куди дивиться. Для дзеркала — лише несиметричні картинки.
 * Окремий набір, а не групи «схожих» з look-alike: у тіні ⚽ і 🏀 — однакове коло.
 */
export const SHAPE_GROUPS: string[][] = [
  ['🐘', '🦒', '🐈', '🐕', '🐎', '🦔', '🐿️', '🐇'], // чотирилапі
  ['🐓', '🦆', '🐧', '🦩'], // птахи
  ['🐢', '🐌', '🦀', '🐙', '🦕'], // повзають і плавають
  ['✈️', '🚁', '🪁', '🦋', '🎈'], // літає
  ['🚲', '🚂', '⛵'], // їде і пливе
  ['🍌', '🥕', '🌙', '☂️', '🔑', '🎸'], // довгі й вигнуті
  ['🌵', '🍄', '🍐', '⭐', '👓'], // інше
];
export const SHADOW_SET = SHAPE_GROUPS.flat();

/** Симетричні — дзеркальна тінь не відрізняється, тому для «дзеркала» їх не беремо. */
const SYMMETRIC = new Set(['⭐', '🍄', '🎈', '🍐', '🌵', '🦋', '👓', '🦀', '🐙']);

/** Варіант тіні: емодзі й чи віддзеркалено. Значення в сітці — `🐕` або `🐕|m`. */
export const mirrored = (v: string) => v.endsWith('|m');
export const emojiOf = (v: string) => v.replace('|m', '');

export interface Payload {
  target: string;
  options: string[];
}

const groupOf = (e: string) => SHAPE_GROUPS.find((g) => g.includes(e))!;

function optionsFor(target: string, d: Difficulty): string[] {
  if (d === 1) {
    const g = groupOf(target);
    const far = shuffle(SHADOW_SET.filter((e) => !g.includes(e))).slice(0, 2);
    return shuffle([target, ...far]);
  }
  const g = groupOf(target);
  const near = shuffle(g.filter((e) => e !== target));
  const fill = shuffle(SHADOW_SET.filter((e) => e !== target && !near.includes(e)));
  if (d === 2) return shuffle([target, ...[...near, ...fill].slice(0, 3)]);
  // 3: дзеркальна тінь цілі + двоє схожих
  return shuffle([target, `${target}|m`, ...[...near, ...fill].slice(0, 2)]);
}

export function generate(difficulty: Difficulty): LevelData<Payload, string> {
  const pool = difficulty === 3 ? SHADOW_SET.filter((e) => !SYMMETRIC.has(e)) : SHADOW_SET;
  const targets = shuffle(pool).slice(0, 5);
  const rounds: Round<Payload, string>[] = targets.map((target, i) => ({
    id: `r${i}`,
    payload: { target, options: optionsFor(target, difficulty) },
    answer: target,
  }));
  return { difficulty, rounds };
}
