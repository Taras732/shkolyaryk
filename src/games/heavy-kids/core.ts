import type { Difficulty } from '../types';

/**
 * «Хто важчий?» для дошкілля (10.10.2026): на терезах два звірятка, намальовані ОДНАКОВОГО розміру —
 * дитина відповідає з того, що знає про звіра, а не «хто більший на картинці».
 * Вага — лише порядок (ранг), без кілограмів.
 */
export const ANIMALS = [
  { id: 'mouse', name: 'мишка' },
  { id: 'chick', name: 'курчатко' },
  { id: 'hedgehog', name: 'їжачок' },
  { id: 'bunny', name: 'зайчик' },
  { id: 'cat', name: 'котик' },
  { id: 'fox', name: 'лисичка' },
  { id: 'dog', name: 'песик' },
  { id: 'pig', name: 'свинка' },
  { id: 'bear', name: 'ведмедик' },
  { id: 'cow', name: 'корівка' },
  { id: 'horse', name: 'конячка' },
  { id: 'elephant', name: 'слоник' },
] as const;
export type AnimalId = (typeof ANIMALS)[number]['id'];

/** Різниця рангів за рівнем: 1 — очевидно (слон і мишка), 3 — ближчі, але відомі пари. */
const GAP: Record<Difficulty, [number, number]> = { 1: [7, 11], 2: [4, 6], 3: [2, 3] };
export const ROUNDS = 5;

export interface Pair {
  left: AnimalId;
  right: AnimalId;
  heavy: AnimalId;
}

export function makePairs(d: Difficulty, rng: () => number = Math.random): Pair[] {
  const [lo, hi] = GAP[d];
  const all: [number, number][] = [];
  for (let a = 0; a < ANIMALS.length; a++)
    for (let b = a + 1; b < ANIMALS.length; b++) if (b - a >= lo && b - a <= hi) all.push([a, b]);
  const out: Pair[] = [];
  const used = new Set<number>();
  while (out.length < ROUNDS) {
    const pool = all.filter(([a, b]) => !used.has(a) && !used.has(b));
    const src = pool.length ? pool : all;
    const [a, b] = src[Math.floor(rng() * src.length)];
    used.add(a).add(b);
    if (used.size > ANIMALS.length - 2) used.clear();
    const heavyLeft = rng() < 0.5;
    out.push({ left: ANIMALS[heavyLeft ? b : a].id, right: ANIMALS[heavyLeft ? a : b].id, heavy: ANIMALS[b].id });
  }
  return out;
}
