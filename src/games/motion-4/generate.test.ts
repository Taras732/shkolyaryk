import { describe, it, expect } from 'vitest';
import { generate } from './index';

const val = (s: string) => Number(s.replace(/ /g, '').split(' ')[0]);

describe('motion-4', () => {
  it('структура: 5 раундів, відповідь серед унікальних варіантів', () => {
    for (const d of [1, 2, 3] as const) for (let i = 0; i < 30; i++) {
      const rounds = generate(d).rounds;
      expect(rounds).toHaveLength(5);
      rounds.forEach((r, k) => {
        expect(r.id).toBe(`r${k}`);
        const p = r.payload as { options: string[]; steps: string[] };
        expect(p.options).toContain(r.answer);
        expect(new Set(p.options).size).toBe(p.options.length);
        expect(p.options).toHaveLength(4);
        expect(p.steps.length).toBeGreaterThan(0);
      });
    }
  });
  it('змістовно: відповідь збігається з незалежним розрахунком', () => {
    for (let i = 0; i < 30; i++) for (const d of [1, 2, 3] as const) for (const r of generate(d).rounds) {
      const p = r.payload as any;
      const a = val(r.answer);
      if (p.mode === 'sp') {
        expect(p.s).toBe(p.v * p.t);
        expect(a).toBe(p.kind === 's' ? p.s : p.kind === 'v' ? p.v : p.t);
      } else if (p.mode === 'meetT') {
        expect(a * (p.v1 + p.v2)).toBe(p.d);
      } else if (p.mode === 'meetS' || p.mode === 'oppS') {
        expect(a).toBe((p.v1 + p.v2) * p.t);
      } else if (p.mode === 'oppV') {
        expect(a).toBe(p.d / p.t - p.v1);
        expect(a).toBe(p.v2);
      } else if (p.mode === 'cost2') {
        const [pr, qq, x, y] = p.nums;
        expect(a).toBe(x * pr + y * qq);
      } else if (p.mode === 'costUnit') {
        const [n, s, m] = p.nums;
        expect(s % n).toBe(0);
        expect(a).toBe((s / n) * m);
      } else if (p.mode === 'work') {
        const [rr, k, h] = p.nums;
        expect(a).toBe(rr * k * h);
      } else if (p.mode === 'crew') {
        const [k, h, total] = p.nums;
        expect(total % (k * h)).toBe(0);
        expect(a).toBe(total / (k * h));
      } else if (p.mode === 'snail') {
        const [h, dist, h2] = p.nums;
        expect(dist % h).toBe(0);
        expect(a).toBe((dist / h) * h2);
      }
    }
  });
});
