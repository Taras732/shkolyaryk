import { describe, it, expect } from 'vitest';
import { generate } from './index';

const clean = (s: string) => s.replace(/ /g, '').replace(/·/g, '*').replace(/−/g, '-').replace(/:/g, '/');
const evalJs = (s: string, x = 0) => new Function('x', `return (${clean(s)});`)(x) as number;

describe('equations-4', () => {
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
  it('вирази: значення збігається з JS-обчисленням, одне правильне', () => {
    for (let i = 0; i < 60; i++) for (const r of generate(1).rounds) {
      const p = r.payload as any;
      if (p.mode === 'value') {
        expect(evalJs(p.expr)).toBe(Number(r.answer));
        expect(p.options.filter((o: string) => Number(o) === evalJs(p.expr))).toHaveLength(1);
      } else {
        expect(p.options).toHaveLength(3);
        // перша дія: усередині дужок, інакше перше · або :, інакше перша +/−
        const m = /\((\d+) ([+−·:]) (\d+)\)/.exec(p.expr);
        let exp: string;
        if (m) exp = `${m[1]} ${m[2]} ${m[3]}`;
        else {
          const t = /(\d+) ([·:]) (\d+)/.exec(p.expr) ?? /(\d+) ([+−]) (\d+)/.exec(p.expr)!;
          exp = `${t[1]} ${t[2]} ${t[3]}`;
        }
        expect(r.answer).toBe(exp);
      }
    }
  });
  it('рівняння: рівно один варіант задовольняє рівність', () => {
    for (const d of [2, 3] as const) for (let i = 0; i < 40; i++) for (const r of generate(d).rounds) {
      const p = r.payload as { eq: string; options: string[] };
      const [l, rr] = p.eq.split('=');
      const rhs = evalJs(rr);
      const good = p.options.filter((o) => Math.abs(evalJs(l.replace(/x/g, '(x)'), Number(o.replace(/ /g, ''))) - rhs) < 1e-9);
      expect(good).toEqual([r.answer]);
    }
  });
});
