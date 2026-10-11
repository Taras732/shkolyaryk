import { describe, it, expect } from 'vitest';
import { generate, KINDS } from './index';

describe('text-2', () => {
  it('вид речення відповідає знаку в кінці', () => {
    for (const k of KINDS) {
      if (k.s.endsWith('?')) expect(k.k).toBe('питальне');
      else expect(k.k).not.toBe('питальне');
    }
  });
  it('усі рівні: 5 раундів; відповідь серед варіантів', () => {
    for (const d of [1, 2, 3] as const) for (let i = 0; i < 20; i++) {
      const rounds = generate(d).rounds;
      expect(rounds).toHaveLength(5);
      for (const r of rounds) {
        const p = r.payload as { options?: string[]; parts?: string[] };
        if (p.options) expect(p.options).toContain(r.answer);
        if (p.parts) expect([...p.parts].sort()).toEqual(String(r.answer).match(/[^.!?]+[.!?]/g)!.map((x) => x.trim()).sort());
      }
    }
  });
});
