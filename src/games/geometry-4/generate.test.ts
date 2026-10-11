import { describe, it, expect } from 'vitest';
import { generate, angleKind, SYM_ITEMS, AXIS_ITEMS, SOLIDS } from './index';

describe('geometry-4', () => {
  it('структура: 5 раундів, відповідь серед унікальних варіантів', () => {
    for (const d of [1, 2, 3] as const) for (let i = 0; i < 30; i++) {
      const rounds = generate(d).rounds;
      expect(rounds).toHaveLength(5);
      rounds.forEach((r, k) => {
        expect(r.id).toBe(`r${k}`);
        const p = r.payload as { options: string[] };
        expect(p.options).toContain(r.answer);
        expect(new Set(p.options).size).toBe(p.options.length);
        expect(p.options.length).toBeGreaterThanOrEqual(2);
      });
    }
  });
  it('кути: явно відмінні від 90° і відповідь за градусами', () => {
    for (let i = 0; i < 40; i++) for (const r of generate(1).rounds) {
      const p = r.payload as any;
      if (p.mode === 'angle') {
        const t = p.a.theta as number;
        expect(t === 90 || t <= 60 || t >= 120).toBe(true);
        expect(r.answer).toBe(angleKind(t));
      } else {
        const kinds = p.angles.map((a: any) => angleKind(a.theta));
        expect(new Set(kinds).size).toBe(3);
        expect(kinds[p.options.indexOf(r.answer)]).toBe(p.target);
      }
    }
  });
  it('симетрія й тіла: відповідь збігається з даними', () => {
    for (let i = 0; i < 40; i++) for (const r of generate(2).rounds) {
      const p = r.payload as any;
      if (p.mode === 'symYN') expect(r.answer).toBe(SYM_ITEMS[p.idx].has ? 'так' : 'ні');
      if (p.mode === 'axis') expect(r.answer).toBe(AXIS_ITEMS[p.idx].axis);
      if (p.mode === 'solid') expect(r.answer).toBe(SOLIDS[p.idx].name);
    }
  });
  it('периметр, площа, клітинки', () => {
    for (let i = 0; i < 40; i++) for (const r of generate(3).rounds) {
      const p = r.payload as any;
      const n = parseInt(r.answer);
      if (p.mode === 'sq') expect(n * 4).toBe(p.p);
      if (p.mode === 'rect') {
        expect(n * p.a).toBe(p.s);
        expect(p.options.filter((o: string) => parseInt(o) * p.a === p.s)).toHaveLength(1);
      }
      if (p.mode === 'grid') {
        const target = [p.w, p.h].sort().join('-');
        const matches = p.options.filter((o: string) => o.split('×').map(Number).sort().join('-') === target);
        expect(matches).toEqual([r.answer]);
      }
    }
  });
});
