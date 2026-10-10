import { describe, expect, it } from 'vitest';
import { ANIMALS, ROUNDS, makePairs } from './core';

const rank = (id: string) => ANIMALS.findIndex((a) => a.id === id);

describe('heavy-kids', () => {
  it.each([1, 2, 3] as const)('level %i: 5 pairs, heavy is the heavier, gap by level', (d) => {
    for (let k = 0; k < 50; k++) {
      const pairs = makePairs(d);
      expect(pairs).toHaveLength(ROUNDS);
      for (const p of pairs) {
        expect(p.left).not.toBe(p.right);
        const [a, b] = [rank(p.left), rank(p.right)];
        expect(rank(p.heavy)).toBe(Math.max(a, b));
        const gap = Math.abs(a - b);
        expect(gap).toBeGreaterThanOrEqual(d === 1 ? 7 : d === 2 ? 4 : 2);
      }
    }
  });
});
