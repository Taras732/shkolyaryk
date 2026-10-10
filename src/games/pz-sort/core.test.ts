import { describe, expect, it } from 'vitest';
import { KID_LEVELS, generate, isSolvable, isSolved } from './core';

describe('pz-sort kids levels', () => {
  it.each([1, 2, 3] as const)('level %i generates a solvable, unsolved board', (d) => {
    const { cap, colors, empty } = KID_LEVELS[d];
    for (let k = 0; k < 20; k++) {
      const t = generate(d, Math.random, true);
      expect(t).toHaveLength(colors + empty);
      expect(isSolved(t, cap)).toBe(false);
      expect(isSolvable(t, 50000, cap)).toBe(true);
    }
  });
});
