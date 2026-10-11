import { describe, it, expect } from 'vitest';
import { generate, ribbonRound, ITEMS, DAYS } from './index';

describe('space-time', () => {
  it('полиця: відповідь стоїть у потрібному місці сітки', () => {
    for (let i = 0; i < 60; i++) for (const r of generate(1).rounds) {
      const p = r.payload as { grid: string[]; rel: string; a: string; b?: string; options: string[] };
      const ia = p.grid.indexOf(p.a), ians = p.grid.indexOf(r.answer as string);
      const [ra, ca, rr, cr] = [Math.floor(ia / 3), ia % 3, Math.floor(ians / 3), ians % 3];
      if (p.rel === 'над') expect([rr, cr]).toEqual([ra - 1, ca]);
      if (p.rel === 'під') expect([rr, cr]).toEqual([ra + 1, ca]);
      if (p.rel === 'ліворуч від') expect([rr, cr]).toEqual([ra, ca - 1]);
      if (p.rel === 'праворуч від') expect([rr, cr]).toEqual([ra, ca + 1]);
      if (p.rel === 'між') expect(cr).toBe(1);
      expect(p.options).toContain(r.answer);
      expect(new Set(p.options).size).toBe(3);
    }
    expect(ITEMS).toHaveLength(9);
  });
  it('стрічки: найдальший кінець — не в цілі; довжини різні', () => {
    for (let i = 0; i < 100; i++) {
      const r = ribbonRound(i % 2 === 0);
      const p = r.payload as { lens: number[]; offs: number[] };
      expect(new Set(p.lens).size).toBe(3);
      const ends = p.lens.map((l, k) => l + p.offs[k]);
      const target = p.lens.indexOf(i % 2 === 0 ? Math.max(...p.lens) : Math.min(...p.lens));
      expect(ends.indexOf(Math.max(...ends))).not.toBe(target);
    }
  });
  it('дні: правильний наступний / попередній', () => {
    for (let i = 0; i < 60; i++) for (const r of generate(3).rounds) {
      const p = r.payload as { mode: string; today?: number; tomorrow?: boolean; options: string[] };
      expect(p.options).toContain(r.answer);
      if (p.mode === 'days') expect(r.answer).toBe(DAYS[(p.today! + (p.tomorrow ? 1 : 6)) % 7]);
    }
  });
});
