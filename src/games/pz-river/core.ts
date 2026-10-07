import type { Difficulty } from '../types';

/**
 * Переправа: фермер перевозить усіх на інший берег. У човні — фермер і ще
 * не більше `seats`. На березі без фермера не можна лишати «ворогів».
 *  1 — вовк, коза, капуста (класика);
 *  2 — лис, курка, зерно — та сама логіка, інші герої (перенести спосіб);
 *  3 — пес, кіт, миша, сир: кіт з мишею, миша з сиром, пес з котом не лишаються самі;
 *      у човні 2 місця.
 */
export interface RiverTask {
  items: { id: string; emoji: string; name: string }[];
  /** Пари «хто кого з'їсть / покривдить» без фермера: [хижак, жертва]. */
  conflicts: [string, string][];
  seats: number;
}

export const TASKS: Record<Difficulty, RiverTask> = {
  1: {
    items: [
      { id: 'wolf', emoji: '🐺', name: 'вовк' },
      { id: 'goat', emoji: '🐐', name: 'коза' },
      { id: 'cabbage', emoji: '🥬', name: 'капуста' },
    ],
    conflicts: [['wolf', 'goat'], ['goat', 'cabbage']],
    seats: 1,
  },
  2: {
    items: [
      { id: 'fox', emoji: '🦊', name: 'лис' },
      { id: 'hen', emoji: '🐔', name: 'курка' },
      { id: 'grain', emoji: '🌾', name: 'зерно' },
    ],
    conflicts: [['fox', 'hen'], ['hen', 'grain']],
    seats: 1,
  },
  3: {
    items: [
      { id: 'dog', emoji: '🐶', name: 'пес' },
      { id: 'cat', emoji: '🐱', name: 'кіт' },
      { id: 'mouse', emoji: '🐭', name: 'миша' },
      { id: 'cheese', emoji: '🧀', name: 'сир' },
    ],
    conflicts: [['dog', 'cat'], ['cat', 'mouse'], ['mouse', 'cheese']],
    seats: 2,
  },
};

/** Стан: де хто (false — лівий берег, true — правий) і де фермер з човном. */
export interface RiverState {
  farmer: boolean;
  at: Record<string, boolean>;
}

export const startState = (t: RiverTask): RiverState => ({ farmer: false, at: Object.fromEntries(t.items.map((i) => [i.id, false])) });

/** Хто кого скривдить на березі без фермера; null — усе гаразд. */
export function trouble(t: RiverTask, s: RiverState): [string, string] | null {
  for (const [a, b] of t.conflicts) if (s.at[a] === s.at[b] && s.at[a] !== s.farmer) return [a, b];
  return null;
}

/** Переправа з пасажирами (вони мусять бути на березі фермера). null — так не можна. */
export function cross(t: RiverTask, s: RiverState, passengers: string[]): RiverState | null {
  if (passengers.length > t.seats || passengers.some((p) => s.at[p] !== s.farmer)) return null;
  const at = { ...s.at };
  for (const p of passengers) at[p] = !s.farmer;
  return { farmer: !s.farmer, at };
}

export const isDone = (s: RiverState) => s.farmer && Object.values(s.at).every(Boolean);

/** Чи є розв'язок і за скільки переправ (BFS по безпечних станах) — для тестів. */
export function minCrossings(t: RiverTask): number {
  const key = (s: RiverState) => `${+s.farmer}${t.items.map((i) => +s.at[i.id]).join('')}`;
  const ids = t.items.map((i) => i.id);
  const combos: string[][] = [[]];
  for (const id of ids) for (const c of [...combos]) if (c.length < t.seats) combos.push([...c, id]);
  let frontier = [startState(t)];
  const seen = new Set([key(frontier[0])]);
  for (let d = 0; d < 30; d++) {
    if (frontier.some(isDone)) return d;
    const next: RiverState[] = [];
    for (const s of frontier)
      for (const c of combos) {
        const n = cross(t, s, c);
        if (n && !trouble(t, n) && !seen.has(key(n))) {
          seen.add(key(n));
          next.push(n);
        }
      }
    frontier = next;
  }
  return -1;
}
