import { describe, it, expect } from 'vitest';
import { WORDS_BY_LEN, buildTasks } from './index';

describe('en-build', () => {
  it('на кожну довжину вистачає слів на сесію з 5', () => {
    for (const len of [3, 4, 5] as const) expect(WORDS_BY_LEN[len].length).toBeGreaterThanOrEqual(5);
  });
  it('плитки містять усі букви слова + зайві', () => {
    for (const len of [3, 4, 5] as const) for (const t of buildTasks(len)) {
      const rest = [...t.tiles];
      for (const ch of t.word.en) {
        const i = rest.indexOf(ch);
        expect(i).toBeGreaterThanOrEqual(0);
        rest.splice(i, 1);
      }
      expect(rest.length).toBe(len === 5 ? 2 : 1);
    }
  });
});
