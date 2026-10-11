import { describe, it, expect } from 'vitest';
import { generate } from './index';

describe('tens-ones', () => {
  it('d1: числа 11–20, відповідь серед варіантів', () => {
    for (let i = 0; i < 40; i++) for (const r of generate(1).rounds) {
      const p = r.payload as { n: number; options: number[] };
      expect(p.n >= 11 && p.n <= 20).toBe(true);
      expect(p.options).toContain(r.answer);
      expect(new Set(p.options).size).toBe(p.options.length);
      expect(p.options.length).toBeGreaterThanOrEqual(2);
    }
  });
  it('d2: «скільки десятків/одиниць» — відповідь правильна і серед варіантів', () => {
    for (let i = 0; i < 60; i++) for (const r of generate(2).rounds) {
      const p = r.payload as { mode: string; n: number; ask?: string; options: number[] };
      expect(p.options).toContain(r.answer);
      expect(p.options.length).toBeGreaterThanOrEqual(2);
      if (p.mode === 'part') expect(r.answer).toBe(p.ask === 'десятків' ? Math.floor(p.n / 10) : p.n % 10);
    }
  });
  it('d3: два різні числа до 100, відповідь — більше', () => {
    for (let i = 0; i < 60; i++) for (const r of generate(3).rounds) {
      const p = r.payload as { a: number; b: number };
      expect(p.a).not.toBe(p.b);
      expect(Math.max(p.a, p.b)).toBeLessThanOrEqual(99);
      expect(r.answer).toBe(Math.max(p.a, p.b));
    }
  });
});
