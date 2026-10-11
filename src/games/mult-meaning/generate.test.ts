import { describe, it, expect } from 'vitest';
import { generate } from './index';

const calc = (q: string, x: string) => {
  const e = q.replace('?', x).split(' = ');
  const ev = (s: string) => { const [a, op, b] = s.split(' '); if (!op) return Number(a); return op === '×' ? Number(a) * Number(b) : Number(a) / Number(b); };
  return ev(e[0]) === ev(e[1]);
};

describe('mult-meaning', () => {
  it('усі раунди: відповідь серед варіантів, ≥2 різні варіанти', () => {
    for (const d of [1, 2, 3] as const) for (let i = 0; i < 40; i++) for (const r of generate(d).rounds) {
      const p = r.payload as { options: string[] };
      expect(p.options).toContain(r.answer);
      expect(new Set(p.options).size).toBe(p.options.length);
      expect(p.options.length).toBeGreaterThanOrEqual(2);
    }
  });
  it('d2/d3: рівність з відповіддю справджується (крім ділення на 0)', () => {
    for (const d of [2, 3] as const) for (let i = 0; i < 40; i++) for (const r of generate(d).rounds) {
      const p = r.payload as { mode: string; q?: string; kind?: string };
      if ((p.mode === 'special' && p.kind !== 'divzero') || p.mode === 'unknown') expect(calc(p.q!, String(r.answer))).toBe(true);
    }
  });
  it('d1: лише один варіант дає k × n (інакше правильних кілька)', () => {
    for (let i = 0; i < 60; i++) for (const r of generate(1).rounds) {
      const p = r.payload as { k: number; n: number; options: string[] };
      const val = (e: string) => { const [a, op, b] = e.split(' '); return op === '×' ? Number(a) * Number(b) : Number(a) + Number(b); };
      expect(p.options.filter((o) => val(o) === p.k * p.n)).toEqual([r.answer]);
    }
  });
  it('d3 «у скільки разів»: a = b × відповідь, лише таблиці 2 і 3', () => {
    for (let i = 0; i < 40; i++) for (const r of generate(3).rounds) {
      const p = r.payload as { mode: string; a?: number; b?: number };
      if (p.mode === 'times') { expect(p.a).toBe(p.b! * Number(r.answer)); expect([2, 3]).toContain(Number(r.answer)); }
    }
  });
});
