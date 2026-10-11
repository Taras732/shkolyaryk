import { describe, it, expect } from 'vitest';
import { generate } from './index';

describe('number-parts', () => {
  it('d1/d3: відповідь = total − seen, серед різних варіантів, у межах 0..total', () => {
    for (const d of [1, 3] as const) for (let i = 0; i < 40; i++) for (const r of generate(d).rounds) {
      const p = r.payload as { total: number; seen: number; options: number[] };
      expect(r.answer).toBe(p.total - p.seen);
      expect(p.options).toContain(r.answer);
      expect(new Set(p.options).size).toBe(p.options.length);
      expect(p.total).toBeLessThanOrEqual(10);
    }
  });
  it('d2: рівно одна пара дає total', () => {
    for (let i = 0; i < 40; i++) for (const r of generate(2).rounds) {
      const p = r.payload as { total: number; options: string[] };
      const sums = p.options.map((o) => o.split(' + ').map(Number).reduce((a, b) => a + b));
      expect(sums.filter((s) => s === p.total)).toHaveLength(1);
      expect(p.options.length).toBeGreaterThanOrEqual(2);
    }
  });
});
