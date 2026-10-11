import { describe, it, expect } from 'vitest';
import { HS_WORDS, STRESS_WORDS, VC_WORDS, VOWELS } from './words';
import { generate } from './index';

// 11.10.2026: дані розписано вручну — тест звіряє їх із правилами, щоб помилка не дійшла до дитини
describe('uk-sounds: дані', () => {
  it('голосний/приголосний: ціль — не я, ю, є, ї, ь', () => {
    for (const w of VC_WORDS) expect('яюєїь'.includes(w.word[w.at])).toBe(false);
  });
  it('твердий/мʼякий: ціль — приголосний; мʼякий ⇔ далі і, я, ю, є, ь', () => {
    for (const w of HS_WORDS) {
      const ch = w.word[w.at];
      expect(VOWELS.has(ch) || 'яюєїьй'.includes(ch)).toBe(false);
      const next = w.word[w.at + 1] ?? '';
      expect(`${w.word}: ${'іяюєь'.includes(next) && next !== ''}`).toBe(`${w.word}: ${w.soft}`);
    }
  });
  it('наголос: склади разом дають слово, наголос у межах', () => {
    for (const w of STRESS_WORDS) {
      expect(w.syllables.join('')).toBe(w.word);
      expect(w.stress).toBeLessThan(w.syllables.length);
      expect(new Set(w.syllables).size).toBe(w.syllables.length);
    }
  });
  it('генератор: 6 раундів; d2 — порівну твердих і мʼяких', () => {
    for (const d of [1, 2, 3] as const) expect(generate(d).rounds).toHaveLength(6);
    const ans = generate(2).rounds.map((r) => r.answer);
    expect(ans.filter((a) => a === 'soft')).toHaveLength(3);
  });
});
