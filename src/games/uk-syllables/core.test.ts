import { describe, it, expect } from 'vitest';
import { CVC_WORDS, LONG, ROUNDS, VOWELS, buildQuiz, syllableOptions } from './core';

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

describe('uk-syllables: буква біжить до букви', () => {
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

  it('«Легко» — лише протяжні приголосні й А О У; без «И»', () => {
    for (let s = 1; s < 20; s++) {
      const easy = buildQuiz(1, seeded(s));
      expect(easy).toHaveLength(ROUNDS);
      for (const q of easy) {
        expect(q.mode).toBe('syl');
        if (q.mode === 'syl') {
          expect(LONG as readonly string[]).toContain(q.left);
          expect(['А', 'О', 'У']).toContain(q.right);
        }
      }
    }
    expect(VOWELS as readonly string[]).not.toContain('И');
  });

  it('той самий склад двічі поспіль не йде', () => {
    for (let s = 1; s < 40; s++) {
      const qs = buildQuiz(2, seeded(s));
      for (let i = 1; i < qs.length; i++) {
        const a = qs[i - 1], b = qs[i];
        if (a.mode === 'syl' && b.mode === 'syl') expect(a.answer).not.toBe(b.answer);
      }
    }
  });

  it('«Складно» — є слова; правильна картинка серед варіантів', () => {
    const qs = buildQuiz(3, seeded(3));
    const words = qs.filter((q) => q.mode === 'word');
    expect(words.length).toBeGreaterThan(0);
    for (const q of words) if (q.mode === 'word') expect(q.options.map((o) => o.word)).toContain(q.item.word);
  });
});
