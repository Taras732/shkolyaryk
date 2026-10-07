import { describe, it, expect } from 'vitest';
import { CVC_WORDS, ROUNDS, buildQuiz, syllableOptions } from './core';

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

describe('uk-syllables', () => {
  it('слово = склад + звук', () => {
    for (const w of CVC_WORDS) expect(w.syl + w.end).toBe(w.word);
  });

  it('відволікачі — схожі на слух: той самий приголосний або той самий голосний', () => {
    for (let s = 1; s < 30; s++) {
      const opts = syllableOptions('М', 'А', 4, seeded(s));
      expect(opts).toHaveLength(4);
      expect(opts).toContain('МА');
      expect(new Set(opts).size).toBe(4);
      for (const o of opts) expect(o[0] === 'М' || o[1] === 'А').toBe(true);
    }
  });

  it('«Легко» — лише злиття з найлегших звуків; без голосу немає питань «почуй»', () => {
    for (let s = 1; s < 20; s++) {
      const easy = buildQuiz(1, true, seeded(s));
      expect(easy).toHaveLength(ROUNDS);
      for (const q of easy) {
        expect(q.mode).toBe('merge');
        if (q.mode !== 'word') expect(['М', 'Н', 'Л', 'Т']).toContain(q.c);
      }
      for (const q of buildQuiz(2, false, seeded(s))) expect(q.mode).not.toBe('hear');
    }
  });

  it('«Складно» — є слова; правильна картинка серед варіантів', () => {
    const qs = buildQuiz(3, true, seeded(3));
    const words = qs.filter((q) => q.mode === 'word');
    expect(words.length).toBeGreaterThan(0);
    for (const q of words) if (q.mode === 'word') expect(q.options.map((o) => o.word)).toContain(q.item.word);
  });
});
