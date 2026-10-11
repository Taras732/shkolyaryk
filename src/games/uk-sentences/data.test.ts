import { describe, it, expect } from 'vitest';
import { COUNT, FILL, MARKS, wordCount } from './data';
import { generate } from './index';

describe('uk-sentences', () => {
  it('скільки слів: кожне речення має 2–4 слова (варіанти 2, 3, 4)', () => {
    for (const c of COUNT) expect([2, 3, 4]).toContain(wordCount(c.text));
  });
  it('доповни: один пропуск, відповідь не серед хибних', () => {
    for (const f of FILL) {
      expect(f.text.split('___')).toHaveLength(2);
      expect(f.wrong).not.toContain(f.answer);
    }
  });
  it('знак: речення без знака в кінці; у сесії по два кожного знака', () => {
    for (const m of MARKS) expect(/[.?!]$/.test(m.text)).toBe(false);
    const ans = generate(3).rounds.map((r) => r.answer);
    for (const k of ['.', '?', '!']) expect(ans.filter((a) => a === k)).toHaveLength(2);
  });
});
