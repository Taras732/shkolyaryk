import { describe, it, expect } from 'vitest';
import { generate, NUMERAL } from './index';

describe('words-2', () => {
  it('усі рівні: 5 раундів, відповідь серед різних варіантів', () => {
    for (const d of [1, 2, 3] as const) for (let i = 0; i < 30; i++) {
      const rounds = generate(d).rounds;
      expect(rounds).toHaveLength(5);
      for (const r of rounds) {
        const p = r.payload as { options: string[] };
        expect(p.options).toContain(r.answer);
        expect(new Set(p.options).size).toBe(p.options.length);
      }
    }
  });
  it('числівник є в реченні', () => {
    for (const n of NUMERAL) expect(n.s.split(' ')).toContain(n.num);
  });
  it('наголошений варіант відрізняється лише великою літерою', () => {
    for (const r of generate(3).rounds) {
      const p = r.payload as { mode: string; options: string[] };
      if (p.mode === 'stress') expect(p.options[0].toLowerCase()).toBe(p.options[1].toLowerCase());
    }
  });
});
