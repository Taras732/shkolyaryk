import { describe, it, expect } from 'vitest';
import { generate, eqHolds, ineqHolds, type Payload } from './index';

describe('remainder-eq', () => {
  it('усі рівні: 5 раундів, відповідь серед різних варіантів', () => {
    for (const d of [1, 2, 3] as const) for (let i = 0; i < 30; i++) {
      const rounds = generate(d).rounds;
      expect(rounds).toHaveLength(5);
      for (const r of rounds) {
        const o = r.payload.options;
        expect(o).toContain(r.answer);
        expect(new Set(o).size).toBe(o.length);
        expect(o.length).toBe(4);
      }
    }
  });
  it('остача: лише одна відповідь правильна, остача < дільника скрізь', () => {
    for (let i = 0; i < 60; i++) for (const r of generate(1).rounds) {
      const p = r.payload as Extract<Payload, { mode: 'rem' }>;
      const parse = (s: string) => { const m = /^(\d+) \(ост\. (\d+)\)$/.exec(s)!; return [Number(m[1]), Number(m[2])]; };
      const good = p.options.filter((o) => { const [q, rem] = parse(o); return q * p.d + rem === p.n && rem < p.d; });
      expect(good).toEqual([r.answer]);
      for (const o of p.options) expect(parse(o)[1]).toBeLessThan(p.d);
      expect(p.n % p.d).not.toBe(0);
    }
  });
  it('рівняння: лише один варіант є коренем', () => {
    for (let i = 0; i < 60; i++) for (const r of generate(2).rounds) {
      const p = r.payload as Extract<Payload, { mode: 'eq' }>;
      const roots = p.options.filter((o) => eqHolds(p.kind, p.a, p.res, Number(o)));
      expect(roots).toEqual([r.answer]);
    }
  });
  it('нерівність: лише один варіант задовольняє', () => {
    for (let i = 0; i < 60; i++) for (const r of generate(3).rounds) {
      const p = r.payload as Extract<Payload, { mode: 'ineq' }>;
      const ok = p.options.filter((o) => ineqHolds(p.kind, p.a, p.b, Number(o)));
      expect(ok).toEqual([r.answer]);
    }
  });
});
