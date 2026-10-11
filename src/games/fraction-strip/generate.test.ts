import { describe, it, expect } from 'vitest';
import { generate, same, parseFrac, type Payload } from './index';

describe('fraction-strip', () => {
  it('усі рівні й класи: 5 раундів, відповідь серед різних варіантів', () => {
    for (const cls of ['grade3', 'grade4'] as const) for (const d of [1, 2, 3] as const) for (let i = 0; i < 30; i++) {
      const rounds = generate(d, 'L3', cls).rounds;
      expect(rounds).toHaveLength(5);
      for (const r of rounds) {
        const o = r.payload.options;
        expect(o).toContain(r.answer);
        expect(new Set(o).size).toBe(o.length);
        expect(o.length).toBe(4);
      }
    }
  });
  it('змістовно: дріб за малюнком, частина від числа, число за частиною', () => {
    for (const cls of ['grade3', 'grade4'] as const) for (const d of [1, 2, 3] as const) for (let i = 0; i < 30; i++) {
      for (const r of generate(d, 'L3', cls).rounds) {
        const p = r.payload as Payload;
        if (p.mode === 'frac') {
          const k = p.shaded.length;
          expect(k).toBeGreaterThan(0);
          expect(k).toBeLessThan(p.n);
          expect(r.answer).toBe(`${k}/${p.n}`);
          const eq = p.options.filter((o) => same(parseFrac(o), [k, p.n]));
          expect(eq).toEqual([r.answer]);
          for (const o of p.options) { const [a, b] = parseFrac(o); expect(a).toBeLessThan(b); }
        }
        if (p.mode === 'total') expect(r.answer).toBe(String(p.n));
        if (p.mode === 'shaded') expect(r.answer).toBe(String(p.shaded.length));
        if (p.mode === 'of') {
          expect(p.N % p.n).toBe(0);
          expect(r.answer).toBe(String((p.N / p.n) * p.k));
          if (cls === 'grade3' || d === 2) expect(p.k).toBe(1);
        }
        if (p.mode === 'whole') {
          expect(p.a % p.k).toBe(0);
          const ok = p.options.filter((o) => (Number(o) / p.n) * p.k === p.a);
          expect(ok).toEqual([r.answer]);
          if (cls === 'grade3') expect(p.k).toBe(1);
        }
      }
    }
  });
});
