import { describe, it, expect } from 'vitest';
import { CAPS, COUNT, FILL, MARKS, wordCount } from './data';
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
  it('як правильно: правильний варіант відрізняється від хибних лише великими буквами', () => {
    for (const c of CAPS) for (const w of c.wrong) {
      expect(w).not.toBe(c.right);
      expect(w.toLowerCase()).toBe(c.right.toLowerCase());
    }
  });
  it('рівні 1 і 2: по 6 раундів, нові види — по 2', () => {
    const r1 = generate(1).rounds; const r2 = generate(2).rounds;
    expect(r1.filter((r) => (r.payload as { mode: string }).mode === 'kind')).toHaveLength(2);
    expect(r2.filter((r) => (r.payload as { mode: string }).mode === 'caps')).toHaveLength(2);
    expect(r1.map((r) => r.id)).toEqual(['r0', 'r1', 'r2', 'r3', 'r4', 'r5']);
  });
  it('знак: речення без знака в кінці; у сесії по два кожного знака', () => {
    for (const m of MARKS) expect(/[.?!]$/.test(m.text)).toBe(false);
    const ans = generate(3).rounds.map((r) => r.answer);
    for (const k of ['.', '?', '!']) expect(ans.filter((a) => a === k)).toHaveLength(2);
  });
});
