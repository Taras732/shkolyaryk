import { describe, it, expect } from 'vitest';
import { generate } from './index';

describe('geo-shapes', () => {
  it('d1: ціль серед трьох різних; «чотирикутник» — без квадрата серед варіантів', () => {
    for (let i = 0; i < 50; i++) for (const r of generate(1).rounds) {
      const p = r.payload as { target: string; options: { kind: string }[] };
      const kinds = p.options.map((o) => o.kind);
      expect(kinds).toContain(p.target);
      expect(new Set(kinds).size).toBe(3);
      if (p.target === 'quad') expect(kinds).not.toContain('square');
    }
  });
  it('d2: ціль серед варіантів, 2 раунди з предметом', () => {
    for (let i = 0; i < 20; i++) {
      const rounds = generate(2).rounds;
      expect(rounds.filter((r) => (r.payload as { object?: string }).object)).toHaveLength(2);
      for (const r of rounds) expect((r.payload as { options: string[] }).options).toContain(r.answer);
    }
  });
  it('d3: відповідь = кількість сторін', () => {
    for (const r of generate(3).rounds) expect(r.answer).toBe((r.payload as { sides: number }).sides);
  });
});
