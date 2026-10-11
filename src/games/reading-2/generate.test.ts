import { describe, it, expect } from 'vitest';
import { generate, TABLE } from './index';

describe('reading-2', () => {
  it('усі рівні: 5 раундів, відповідь серед різних варіантів', () => {
    for (const d of [1, 2, 3] as const) for (let i = 0; i < 20; i++) {
      const rounds = generate(d).rounds;
      expect(rounds).toHaveLength(5);
      for (const r of rounds) {
        const p = r.payload as { options: string[] };
        expect(p.options).toContain(r.answer);
        expect(new Set(p.options).size).toBe(p.options.length);
      }
    }
  });
  it('таблиця: відповідь — день гуртка з таблиці', () => {
    for (let i = 0; i < 20; i++) for (const r of generate(3).rounds) {
      const p = r.payload as { mode: string; q: string };
      if (p.mode === 'table') {
        const row = TABLE.rows.find(([, c]) => p.q.includes(`«${c}»`))!;
        expect(r.answer).toBe(row[0]);
      }
    }
  });
});
