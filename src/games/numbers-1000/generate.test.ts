import { describe, it, expect } from 'vitest';
import { generate, digitsOf, type Payload } from './index';

describe('numbers-1000', () => {
  it('усі рівні: 5 раундів, відповідь серед різних варіантів', () => {
    for (const d of [1, 2, 3] as const) for (let i = 0; i < 30; i++) {
      const rounds = generate(d).rounds;
      expect(rounds).toHaveLength(5);
      for (const r of rounds) {
        const o = r.payload.options;
        expect(o).toContain(r.answer);
        expect(new Set(o).size).toBe(o.length);
        expect(o.length).toBeGreaterThanOrEqual(3);
      }
    }
  });
  it('змістовно: розряди, порівняння, обчислення', () => {
    for (let i = 0; i < 30; i++) {
      for (const d of [1, 2, 3] as const) for (const r of generate(d).rounds) {
        const p = r.payload as Payload;
        if (p.mode === 'digit') expect(r.answer).toBe(String(digitsOf(p.n)[p.place]));
        if (p.mode === 'compose') expect(r.answer).toBe(String(p.n));
        if (p.mode === 'sign') {
          expect(r.answer).toBe(p.a > p.b ? '>' : p.a < p.b ? '<' : '=');
          if (p.left.includes('+')) expect(p.left.split('+').reduce((s, x) => s + Number(x), 0)).toBe(p.a);
        }
        if (p.mode === 'extreme') {
          expect(new Set(p.nums).size).toBe(3);
          expect(r.answer).toBe(String(p.big ? Math.max(...p.nums) : Math.min(...p.nums)));
        }
        if (p.mode === 'calc') {
          const v = p.op === '×' ? p.a * p.b : p.a / p.b;
          expect(Number.isInteger(v)).toBe(true);
          expect(r.answer).toBe(String(v));
          if (p.b !== 10) expect(p.a).toBeLessThanOrEqual(100);
        }
      }
    }
  });
});
