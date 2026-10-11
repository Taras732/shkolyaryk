import { describe, it, expect } from 'vitest';
import { generate, seq } from './index';

describe('number-line', () => {
  it('d1: ряд у межах 0–10, відповідь = число на дірці, серед варіантів', () => {
    for (let i = 0; i < 50; i++) for (const r of generate(1).rounds) {
      const p = r.payload as { start: number; dir: 1 | -1; hole: number; options: number[] };
      const nums = seq(p);
      expect(Math.min(...nums)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...nums)).toBeLessThanOrEqual(10);
      expect(r.answer).toBe(nums[p.hole]);
      expect(p.options).toContain(r.answer);
      expect(new Set(p.options).size).toBe(p.options.length);
    }
  });
  it('d2: ціль у черзі, відповідь — її порядковий номер', () => {
    for (const r of generate(2).rounds) {
      const p = r.payload as { row: string[]; target: string; options: string[] };
      expect(p.options).toContain(r.answer);
      expect(new Set(p.row).size).toBe(6);
    }
  });
  it('d3: парність правильна', () => {
    for (const r of generate(3).rounds) {
      const n = (r.payload as { n: number }).n;
      expect(r.answer).toBe(n % 2 === 0 ? 'парне' : 'непарне');
    }
  });
});
