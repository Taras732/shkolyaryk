import { describe, it, expect } from 'vitest';
import { generate, mulColumn, divColumn } from './index';

const num = (s: string) => Number(s.replace(/\s/g, ''));

describe('written-ops', () => {
  it('структура: 5 раундів, відповідь серед унікальних варіантів', () => {
    for (const d of [1, 2, 3] as const) for (let i = 0; i < 30; i++) {
      const rounds = generate(d).rounds;
      expect(rounds).toHaveLength(5);
      rounds.forEach((r, k) => {
        expect(r.id).toBe(`r${k}`);
        const p = r.payload as { options: string[] };
        expect(p.options).toContain(r.answer);
        expect(new Set(p.options).size).toBe(p.options.length);
        expect(p.options).toHaveLength(4);
      });
    }
  });
  it('змістовно: добуток і частка без остачі, стовпчик показує умову', () => {
    for (const d of [1, 2, 3] as const) for (let i = 0; i < 30; i++) for (const r of generate(d).rounds) {
      const p = r.payload as { mode: string; a: number; b: number; options: string[] };
      if (p.mode === 'mul1' || p.mode === 'mul2') {
        expect(num(r.answer)).toBe(p.a * p.b);
        expect(p.options.filter((o) => num(o) === p.a * p.b)).toHaveLength(1);
        expect(mulColumn(p.a, p.b)).toContain('?');
      } else {
        expect(p.a % p.b).toBe(0);
        expect(num(r.answer) * p.b).toBe(p.a);
        expect(p.options.filter((o) => num(o) * p.b === p.a)).toHaveLength(1);
        expect(divColumn(p.a, p.b)).toContain('?');
      }
    }
  });
  it('рівні: d1 одноцифровий множник, d2 двоцифровий, d3 двоцифровий дільник', () => {
    for (let i = 0; i < 30; i++) {
      for (const r of generate(1).rounds) expect((r.payload as { b: number }).b).toBeLessThan(10);
      for (const r of generate(2).rounds) expect((r.payload as { b: number }).b).toBeGreaterThanOrEqual(10);
      for (const r of generate(3).rounds) expect((r.payload as { b: number }).b).toBeGreaterThanOrEqual(10);
    }
  });
});
