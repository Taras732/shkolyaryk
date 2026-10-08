import { describe, expect, it } from 'vitest';
import game, { INSTRUCTIONS } from './index';

describe('en-instructions', () => {
  it('40 інструкцій без дублів', () => {
    expect(INSTRUCTIONS).toHaveLength(40);
    expect(new Set(INSTRUCTIONS.map((i) => i.en)).size).toBe(40);
    expect(new Set(INSTRUCTIONS.map((i) => i.ua)).size).toBe(40);
  });
  it('кожен раунд: 3 різні варіанти, правильний серед них, лише з дозволеного рівня', () => {
    for (const d of [1, 2, 3] as const) {
      const { rounds } = game.generate(d, 'L3');
      expect(rounds.length).toBe(6);
      for (const r of rounds) {
        expect(r.payload.options).toHaveLength(3);
        expect(new Set(r.payload.options).size).toBe(3);
        expect(r.payload.options).toContain(r.answer);
        expect(r.payload.item.tier).toBeLessThanOrEqual(d);
      }
    }
  });
});
