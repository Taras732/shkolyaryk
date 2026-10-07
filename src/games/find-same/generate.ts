import type { Difficulty, LevelData, Round } from '../types';
import { randInt, shuffle } from '../shared/ui';
import { ALL_LOOK_ALIKE, LOOK_ALIKE } from '../shared/look-alike';

/**
 * «Знайди такий самий»: зразок угорі, сітка картинок — знайди точно таку саму.
 *  1 — 6 клітинок, інші з різних груп;
 *  2 — 9 клітинок, половина зі схожої групи;
 *  3 — 12 клітинок, усі схожі (🐶 серед 🐕 🐩 🐺 🦊).
 * Відповідь — номер клітинки (картинки в сітці можуть повторюватись).
 */
export interface Payload {
  target: string;
  cells: string[];
}

const CELLS: Record<Difficulty, number> = { 1: 6, 2: 9, 3: 12 };

export function generate(difficulty: Difficulty): LevelData<Payload, string> {
  const rounds: Round<Payload, string>[] = [];
  const groups = shuffle(LOOK_ALIKE);
  for (let i = 0; i < 5; i++) {
    const group = groups[i % groups.length];
    const target = group[randInt(0, group.length - 1)];
    const same = group.filter((e) => e !== target);
    const other = ALL_LOOK_ALIKE.filter((e) => !group.includes(e));
    const n = CELLS[difficulty];
    const cells: string[] = [];
    for (let k = 0; k < n - 1; k++) {
      const fromSame = difficulty === 3 || (difficulty === 2 && k % 2 === 0);
      const pool = fromSame ? same : other;
      cells.push(pool[randInt(0, pool.length - 1)]);
    }
    const at = randInt(0, n - 1);
    cells.splice(at, 0, target);
    rounds.push({ id: `r${i}`, payload: { target, cells }, answer: String(at) });
  }
  return { difficulty, rounds };
}
