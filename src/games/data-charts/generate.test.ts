import { describe, it, expect } from 'vitest';
import { generate, type Payload } from './index';

const CLASSES = ['grade3', 'grade4'] as const;

describe('data-charts', () => {
  it('усі рівні й класи: 5 раундів, відповідь серед різних варіантів', () => {
    for (const cls of CLASSES) for (const d of [1, 2, 3] as const) for (let i = 0; i < 30; i++) {
      const rounds = generate(d, 'L3', cls).rounds;
      expect(rounds).toHaveLength(5);
      for (const r of rounds) {
        const o = r.payload.options;
        expect(o).toContain(r.answer);
        expect(new Set(o).size).toBe(o.length);
        expect(o.length).toBeGreaterThanOrEqual(3);
      }
    }
  });
  it('значення кратні кроку, різні; відповіді перераховуються незалежно', () => {
    for (const cls of CLASSES) for (const d of [1, 2, 3] as const) for (let i = 0; i < 30; i++) for (const r of generate(d, 'L3', cls).rounds) {
      const p = r.payload as Payload;
      expect(p.cats.length).toBeGreaterThanOrEqual(4);
      expect(p.cats.length).toBeLessThanOrEqual(5);
      expect(new Set(p.cats).size).toBe(p.cats.length);
      expect(new Set(p.vals).size).toBe(p.vals.length);
      for (const v of p.vals) expect(v % p.step).toBe(0);
      expect(p.top).toBeGreaterThanOrEqual(Math.max(...p.vals));
      expect(p.top / p.step).toBeLessThanOrEqual(8);
      if (p.mode === 'match') {
        for (const k of Object.keys(p.charts)) for (const v of p.charts[k]) { expect(v % p.step).toBe(0); expect(v).toBeGreaterThan(0); expect(v).toBeLessThanOrEqual(p.top); }
        const eq = p.options.filter((k) => p.charts[k].join() === p.vals.join());
        expect(eq).toEqual([r.answer]);
        expect(new Set(p.options.map((k) => p.charts[k].join())).size).toBe(3);
        if (cls === 'grade4') for (const k of p.options) expect([...p.charts[k]].sort((a, b) => a - b)).toEqual([...p.vals].sort((a, b) => a - b));
        continue;
      }
      const [a, b] = p.ask;
      if (p.mode === 'value') expect(r.answer).toBe(String(p.vals[a]));
      if (p.mode === 'extreme') {
        const best = p.flag ? Math.max(...p.vals) : Math.min(...p.vals);
        expect(p.vals[p.cats.indexOf(r.answer)]).toBe(best);
      }
      if (p.mode === 'diff') expect(r.answer).toBe(String(Math.abs(p.vals[a] - p.vals[b])));
      if (p.mode === 'sum') expect(r.answer).toBe(String(p.vals[a] + p.vals[b]));
      if (p.mode === 'ratio') {
        const big = Math.max(p.vals[a], p.vals[b]), small = Math.min(p.vals[a], p.vals[b]);
        expect(big % small).toBe(0);
        expect(r.answer).toBe(String(big / small));
      }
      if (p.mode === 'pairs') {
        const sums = p.options.map((_, k) => p.vals[p.ask[2 * k]] + p.vals[p.ask[2 * k + 1]]);
        expect(new Set(sums).size).toBe(3);
        expect(p.options[sums.indexOf(Math.max(...sums))]).toBe(r.answer);
      }
    }
  });
  it('3 клас не отримує завдань 4 класу і навпаки', () => {
    for (let i = 0; i < 20; i++) {
      for (const r of generate(1, 'L3', 'grade3').rounds) expect(['value', 'extreme']).toContain(r.payload.mode);
      for (const r of generate(1, 'L3', 'grade4').rounds) expect(['sum', 'pairs']).toContain(r.payload.mode);
      for (const r of generate(2, 'L3', 'grade3').rounds) expect(r.payload.mode).toBe('diff');
      for (const r of generate(2, 'L3', 'grade4').rounds) expect(r.payload.mode).toBe('ratio');
    }
  });
});
