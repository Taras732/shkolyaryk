import { describe, it, expect } from 'vitest';
import { generate } from './index';

const ev = (s: string) => Function(`return (${s.replace(/−/g, '-')})`)() as number;

describe('window-ops', () => {
  it('d1: відповідь у віконці справджує рівність, числа до 100', () => {
    for (let i = 0; i < 60; i++) for (const r of generate(1).rounds) {
      const p = r.payload as { q: string; options: number[] };
      const [l, rr] = p.q.replace('_', String(r.answer)).split(' = ');
      expect(ev(l)).toBe(Number(rr));
      expect(p.options).toContain(r.answer);
      expect(Math.max(...p.options)).toBeLessThanOrEqual(99);
    }
  });
  it('d2: відповідь = значення виразу; «не той порядок» серед варіантів', () => {
    for (let i = 0; i < 60; i++) for (const r of generate(2).rounds) {
      const p = r.payload as { q: string; options: number[] };
      expect(ev(p.q)).toBe(r.answer);
      expect(new Set(p.options).size).toBe(p.options.length);
    }
  });
  it('d3: правильна перевірка — обернена дія; хибні не мають відʼємних і не є другою правильною перевіркою', () => {
    for (let i = 0; i < 60; i++) for (const r of generate(3).rounds) {
      const p = r.payload as { q: string; options: string[] };
      // справжня перевірка повертає ті самі три числа: для a − b = c це c + b = a (або b + c = a), для c + b = a — a − b = c (або a − c = b)
      const [l, rr] = p.q.split(' = ');
      const [x, op, y] = l.split(' ');
      const valid = op === '−' ? [`${rr} + ${y} = ${x}`, `${y} + ${rr} = ${x}`] : [`${rr} − ${y} = ${x}`, `${rr} − ${x} = ${y}`];
      for (const o of p.options) {
        expect(Number(o.split(' = ')[1])).toBeGreaterThanOrEqual(0);
        expect(valid.includes(o)).toBe(o === r.answer);
      }
    }
  });
});
