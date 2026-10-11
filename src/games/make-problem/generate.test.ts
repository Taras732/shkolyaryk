import { describe, it, expect } from 'vitest';
import { generate, noun, THINGS } from './index';

describe('make-problem', () => {
  it('форми іменника: 1 яблуко, 3 яблука, 7 яблук', () => {
    const t = THINGS[0];
    expect([noun(t, 1), noun(t, 3), noun(t, 7)]).toEqual(['яблуко', 'яблука', 'яблук']);
  });
  it('d1: правильне питання серед трьох різних; «стало» для +, «лишилось» для −', () => {
    for (let i = 0; i < 40; i++) for (const r of generate(1).rounds) {
      const p = r.payload as { op: string; options: string[] };
      expect(p.options).toContain(r.answer);
      expect(new Set(p.options).size).toBe(3);
      expect(String(r.answer)).toContain(p.op === '+' ? 'стало' : 'лишилось');
    }
  });
  it('d2: відповідь серед варіантів, варіанти різні', () => {
    for (let i = 0; i < 40; i++) for (const r of generate(2).rounds) {
      const p = r.payload as { options: string[] };
      expect(p.options).toContain(r.answer);
      expect(new Set(p.options).size).toBe(p.options.length);
      expect(p.options.length).toBeGreaterThanOrEqual(2);
    }
  });
  it('d3: правильна задача збирається з частин (по одній з кожного слота)', () => {
    for (let i = 0; i < 40; i++) for (const r of generate(3).rounds) {
      const p = r.payload as { slots: string[][] };
      const parts = String(r.answer);
      for (const s of p.slots) expect(s.filter((x) => parts.includes(x))).toHaveLength(1);
    }
  });
  it('числа в межах 10', () => {
    for (let i = 0; i < 40; i++) for (const d of [1, 3] as const) for (const r of generate(d).rounds) {
      const p = r.payload as { a: number; op: string; b: number };
      expect(p.op === '+' ? p.a + p.b : p.a).toBeLessThanOrEqual(10);
      if (p.op === '−') expect(p.b).toBeLessThan(p.a);
    }
  });
});
