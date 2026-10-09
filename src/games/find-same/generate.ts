import type { Difficulty, LevelData, Round } from '../types';
import { BOARD_DONE } from '../types';
import { randInt, shuffle } from '../shared/ui';
import { ALL_LOOK_ALIKE, LOOK_ALIKE } from '../shared/look-alike';

/**
 * «Знайди всіх таких самих» (переробка 09.10.2026): зразок угорі, у сітці сховано кілька
 * таких самих — знайди всі; зайчик рахує вголос («один… два… три!»). Уважність + лічба.
 *  1 — 9 клітинок, 2 такі самі, інші з різних груп;
 *  2 — 12 клітинок, 3 такі самі, половина зі схожої групи;
 *  3 — 12 клітинок, 4 такі самі, усі схожі (🐶 серед 🐕 🐩 🐺 🦊).
 */
export interface Task {
  target: string;
  cells: string[];
  /** Скільки разів зразок сховано в сітці. */
  count: number;
}
export interface Payload {
  difficulty: Difficulty;
}

export const ROUNDS = 4;
const CELLS: Record<Difficulty, number> = { 1: 9, 2: 12, 3: 12 };
const HIDDEN: Record<Difficulty, number> = { 1: 2, 2: 3, 3: 4 };

export function buildTasks(difficulty: Difficulty): Task[] {
  const groups = shuffle(LOOK_ALIKE);
  const out: Task[] = [];
  for (let i = 0; i < ROUNDS; i++) {
    const group = groups[i % groups.length];
    const target = group[randInt(0, group.length - 1)];
    const same = group.filter((e) => e !== target);
    const other = ALL_LOOK_ALIKE.filter((e) => !group.includes(e));
    const n = CELLS[difficulty];
    const count = HIDDEN[difficulty];
    const cells: string[] = Array.from({ length: count }, () => target);
    for (let k = cells.length; k < n; k++) {
      const fromSame = difficulty === 3 || (difficulty === 2 && k % 2 === 0);
      const pool = fromSame ? same : other;
      cells.push(pool[randInt(0, pool.length - 1)]);
    }
    out.push({ target, cells: shuffle(cells), count });
  }
  return out;
}

/** Гра-дошка: раунди веде компонент, оболонка рахує помилки й зірки. */
export function generate(difficulty: Difficulty): LevelData<Payload, typeof BOARD_DONE> {
  const round: Round<Payload, typeof BOARD_DONE> = { id: 'fs-board', payload: { difficulty }, answer: BOARD_DONE };
  return { difficulty, rounds: Array.from({ length: ROUNDS }, () => round) };
}
