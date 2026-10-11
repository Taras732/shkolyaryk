import { describe, it, expect } from 'vitest';
import { generate } from './index';

type Row = { e: string; n: number };
describe('pictograms', () => {
  it('d1: відповідь — кількість у рядку цілі', () => {
    for (let i = 0; i < 40; i++) for (const r of generate(1).rounds) {
      const p = r.payload as { rows: Row[]; target: string; options: number[] };
      expect(r.answer).toBe(p.rows.find((x) => x.e === p.target)!.n);
      expect(p.options).toContain(r.answer);
    }
  });
  it('d2: найбільше/найменше — однозначне', () => {
    for (let i = 0; i < 40; i++) for (const r of generate(2).rounds) {
      const p = r.payload as { rows: Row[]; most: boolean };
      const ns = p.rows.map((x) => x.n);
      expect(new Set(ns).size).toBe(3);
      const want = p.most ? Math.max(...ns) : Math.min(...ns);
      expect(p.rows.find((x) => x.e === r.answer)!.n).toBe(want);
    }
  });
  it('d3: різниця більшого й меншого', () => {
    for (let i = 0; i < 40; i++) for (const r of generate(3).rounds) {
      const p = r.payload as { rows: Row[]; a: string; b: string; options: number[] };
      const a = p.rows.find((x) => x.e === p.a)!.n, b = p.rows.find((x) => x.e === p.b)!.n;
      expect(r.answer).toBe(a - b);
      expect(a).toBeGreaterThan(b);
      expect(p.options).toContain(r.answer);
    }
  });
});
