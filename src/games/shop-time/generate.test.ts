import { describe, it, expect } from 'vitest';
import { generate, fmtTime, fmtDur, plural, ITEMS, type Payload } from './index';

describe('shop-time', () => {
  it('усі рівні: 5 раундів, відповідь серед різних варіантів', () => {
    for (const d of [1, 2, 3] as const) for (let i = 0; i < 30; i++) {
      const rounds = generate(d).rounds;
      expect(rounds).toHaveLength(5);
      for (const r of rounds) {
        const o = r.payload.options;
        expect(o).toContain(r.answer);
        expect(new Set(o).size).toBe(o.length);
        expect(o.length).toBe(4);
      }
    }
  });
  it('ціна, зведення до одиниці, час: відповідь перераховується незалежно', () => {
    for (let i = 0; i < 40; i++) for (const d of [1, 2, 3] as const) for (const r of generate(d).rounds) {
      const p = r.payload as Payload;
      if (p.mode === 'price') {
        const cost = p.price * p.qty;
        expect(r.answer).toBe(String(p.find === 'cost' ? cost : p.find === 'price' ? cost / p.qty : cost / p.price));
        expect(p.qty).toBeGreaterThanOrEqual(2);
      }
      if (p.mode === 'unit') {
        expect(p.t1 % p.q1).toBe(0);
        expect(p.q1).not.toBe(p.q2);
        expect(r.answer).toBe(String((p.t1 / p.q1) * p.q2));
      }
      if (p.mode === 'time') {
        expect(p.start % 5).toBe(0);
        expect(p.dur % 5).toBe(0);
        expect(p.start + p.dur).toBeLessThan(1440);
        const want = p.find === 'end' ? fmtTime(p.start + p.dur) : p.find === 'dur' ? fmtDur(p.dur) : fmtTime(p.start);
        expect(r.answer).toBe(want);
        if (p.find !== 'dur') for (const o of p.options) {
          const [h, m] = o.split(':').map(Number);
          expect(h).toBeLessThan(24);
          expect(m % 5).toBe(0);
        }
      }
    }
  });
  it('відмінювання: 2 зошити, 5 зошитів, 21 зошит, 12 зошитів', () => {
    const z = ITEMS[0];
    expect([2, 5, 21, 12].map((n) => plural(n, z))).toEqual(['зошити', 'зошитів', 'зошит', 'зошитів']);
  });
});
