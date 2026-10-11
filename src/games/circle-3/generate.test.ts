import { describe, it, expect } from 'vitest';
import { generate, PART_NAME, GRID_N, type Payload } from './index';

describe('circle-3', () => {
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
  it('змістовно: підсвічена частина, діаметр = 2 радіуси, коло на клітинках', () => {
    for (let i = 0; i < 40; i++) for (const d of [1, 2, 3] as const) for (const r of generate(d).rounds) {
      const p = r.payload as Payload;
      if (p.mode === 'kind') expect(r.answer).toBe(PART_NAME[p.what]);
      if (p.mode === 'conv') {
        expect(r.answer).toBe(`${p.dir === 'toD' ? p.given * 2 : p.given / 2} см`);
        if (p.dir === 'toR') expect(p.given % 2).toBe(0);
      }
      if (p.mode === 'grid') {
        const want = p.asked === 'r' ? p.r : 2 * p.r;
        const m = /(радіус|діаметр) (\d+) см/.exec(p.q)!;
        expect(Number(m[2])).toBe(want);
        const radiusCm = p.asked === 'r' ? Number(m[2]) : Number(m[2]) / 2;
        const ok = p.options.filter((o) => p.radii[o] === radiusCm);
        expect(ok).toEqual([r.answer]);
        expect(new Set(Object.values(p.radii)).size).toBe(4);
        for (const v of Object.values(p.radii)) expect(v * 2).toBeLessThan(GRID_N);
      }
    }
  });
});
