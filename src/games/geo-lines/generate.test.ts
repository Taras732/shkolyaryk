import { describe, it, expect } from 'vitest';
import { generate } from './index';

describe('geo-lines', () => {
  it('d1: ціль серед трьох різних варіантів', () => {
    for (let i = 0; i < 30; i++) for (const r of generate(1).rounds) {
      const p = r.payload as { target: string; options: string[] };
      expect(p.options).toContain(p.target);
      expect(new Set(p.options).size).toBe(3);
    }
  });
  it('d2: відповідь серед варіантів, відрізок у межах лінійки; два останні раунди — не з нуля', () => {
    for (let i = 0; i < 30; i++) {
      const rounds = generate(2).rounds;
      rounds.forEach((r, k) => {
        const p = r.payload as { start: number; length: number; options: number[] };
        expect(p.options).toContain(r.answer);
        expect(new Set(p.options).size).toBe(p.options.length);
        expect(p.start + p.length).toBeLessThanOrEqual(10);
        if (k >= 3) expect(p.start).toBeGreaterThan(0);
      });
    }
  });
  it('d3: різні довжини 2–8', () => {
    const ls = generate(3).rounds.map((r) => r.answer as number);
    expect(new Set(ls).size).toBe(ls.length);
    for (const l of ls) expect(l >= 2 && l <= 8).toBe(true);
  });
});
