import { describe, it, expect } from 'vitest';
import { generate, centuryOf, UNITS } from './index';

const num = (s: string) => Number(s.replace(/\s/g, ''));
const VAL: Record<string, number> = { I: 1, V: 5, X: 10 };
const rom = (s: string) => {
  const a = s.split(' ')[0].split('').map((c) => VAL[c]);
  return a.reduce((t, v, i) => t + (a[i + 1] > v ? -v : v), 0);
};

describe('big-numbers', () => {
  it('структура: 5 раундів, відповідь серед унікальних варіантів', () => {
    for (const d of [1, 2, 3] as const) for (let i = 0; i < 30; i++) {
      const rounds = generate(d).rounds;
      expect(rounds).toHaveLength(5);
      rounds.forEach((r, k) => {
        expect(r.id).toBe(`r${k}`);
        const p = r.payload as { options: string[] };
        expect(p.options).toContain(r.answer);
        expect(new Set(p.options).size).toBe(p.options.length);
        expect(p.options.length).toBeGreaterThanOrEqual(3);
      });
    }
  });
  it('змістовно: розряди, порівняння, одиниці, століття', () => {
    for (let i = 0; i < 30; i++) for (const d of [1, 2, 3] as const) for (const r of generate(d).rounds) {
      const p = r.payload as any;
      if (p.mode === 'place') expect(num(r.answer)).toBe(Math.floor(p.n / 1000));
      if (p.mode === 'write') expect(num(r.answer)).toBe(p.a * 1000 + p.b * 100 + p.c);
      if (p.mode === 'cmp') expect(r.answer).toBe(p.x > p.y ? '>' : p.x < p.y ? '<' : '=');
      if (p.mode === 'extreme') {
        const exp = p.kind === 'max' ? Math.max(...p.nums) : Math.min(...p.nums);
        expect(num(r.answer)).toBe(exp);
        expect(p.options.map(num).sort()).toEqual([...p.nums].sort());
      }
      if (p.mode === 'unit') {
        const u = UNITS.find((x) => x.key === p.unit)!;
        expect(num(r.answer)).toBe(p.n * u.f);
      }
      if (p.mode === 'century') expect(rom(r.answer)).toBe(centuryOf(p.year));
    }
  });
});
