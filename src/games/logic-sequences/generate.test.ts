import { describe, expect, it } from 'vitest';
import game from './index';

describe('logic-sequences', () => {
  it.each([1, 2, 3] as const)('L0 level %i: no sequence twice in a game, no same answer twice in a row', (d) => {
    for (let k = 0; k < 200; k++) {
      const { rounds } = game.generate(d, 'L0');
      const keys = rounds.map((r) => (r.payload as { sequence: number[] }).sequence.join(','));
      expect(new Set(keys).size).toBe(rounds.length);
      for (let i = 1; i < rounds.length; i++) expect(rounds[i].answer).not.toBe(rounds[i - 1].answer);
    }
  });
});
