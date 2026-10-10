import { describe, expect, it } from 'vitest';
import game, { WEATHER } from './index';

describe('dress-weather', () => {
  it.each([1, 2, 3] as const)('level %i: exactly one right item among options, answer is right', (d) => {
    for (let k = 0; k < 50; k++) {
      for (const r of game.generate(d, 'L0').rounds) {
        const right = r.payload.options.filter((o) => (WEATHER[r.payload.weather].wear as readonly string[]).includes(o));
        expect(right).toEqual([r.answer]);
        expect(r.payload.options).toHaveLength(d === 1 ? 2 : d === 2 ? 3 : 4);
        expect(game.isCorrect!(r, r.answer)).toBe(true);
      }
    }
  });
});
