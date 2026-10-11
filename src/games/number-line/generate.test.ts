import { describe, it, expect } from 'vitest';
import { generate, seq, orderQuestion } from './index';

describe('number-line', () => {
  it('d1: ряд у межах 0–10, відповідь = число на дірці, серед варіантів', () => {
    for (let i = 0; i < 50; i++) for (const r of generate(1).rounds) {
      const p = r.payload as { start: number; dir: 1 | -1; hole: number; options: number[] };
      const nums = seq(p);
      expect(Math.min(...nums)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...nums)).toBeLessThanOrEqual(10);
      expect(r.answer).toBe(nums[p.hole]);
      expect(p.options).toContain(r.answer);
      expect(new Set(p.options).size).toBe(p.options.length);
    }
  });
  it('d2: відповідь — місце цілі в черзі (1–6), серед варіантів', () => {
    for (let i = 0; i < 30; i++) for (const r of generate(2).rounds) {
      const p = r.payload as { row: string[]; target: string; options: number[] };
      expect(p.row.indexOf(p.target) + 1).toBe(r.answer);
      expect(p.options).toContain(r.answer);
      expect(new Set(p.row).size).toBe(6);
    }
  });
  it('d2: питання узгоджене з родом', () => {
    expect(orderQuestion('🦊')).toBe('Котра за рахунком лисичка?');
    expect(orderQuestion('🐻')).toBe('Котрий за рахунком ведмедик?');
    expect(orderQuestion('🐷')).toBe('Котре за рахунком порося?');
  });
  it('d3: парність правильна', () => {
    for (const r of generate(3).rounds) {
      const n = (r.payload as { n: number }).n;
      expect(r.answer).toBe(n % 2 === 0 ? 'парне' : 'непарне');
    }
  });
});
