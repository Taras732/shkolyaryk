import { describe, it, expect } from 'vitest';
import { GAMES } from './registry';

// 11.10.2026: у грі 1 класу є «💡 Чому так?» — пояснення не має бути порожнім ні для якого завдання
const IDS = ['geo-lines', 'number-parts', 'number-line', 'geo-shapes', 'uk-words', 'tens-ones', 'pictograms', 'space-time', 'make-problem', 'mult-meaning', 'window-ops', 'geo-2', 'alpha-hyphen', 'uk-sounds', 'uk-sentences', 'math-examples', 'math-compare', 'clock-time', 'grammar-parts'];

describe('пояснення «чому так»', () => {
  for (const id of IDS) {
    it(id, () => {
      const g = GAMES.find((x) => x.id === id)!;
      for (const d of [1, 2, 3] as const) for (let i = 0; i < 10; i++) {
        for (const r of g.generate(d, 'L3', 'grade1').rounds) {
          const e = g.explain!(r, r.answer);
          if (id === 'clock-time' && (r.payload as { mode: string }).mode !== 'read') continue;
          expect(e?.steps.length).toBeGreaterThan(0);
          for (const s of e!.steps) expect(s).not.toMatch(/undefined|NaN/);
        }
      }
    });
  }
});
