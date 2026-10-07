import { describe, it, expect, beforeEach } from 'vitest';
import { buildCheck, checkDue, loadChecks, monthOf, saveCheck, score, weakAreas } from './monthly-check';
import { CLASS_LEVELS } from '@/games/types';
import { scoreGame } from './smart-plan';

const mem = new Map<string, string>();
beforeEach(() => {
  mem.clear();
  (globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
});

describe('перевірка місяця', () => {
  it('кожне питання має правильну відповідь серед різних варіантів', () => {
    for (const cl of CLASS_LEVELS) {
      for (const q of buildCheck(cl)) {
        expect(q.options, `${cl} ${q.prompt}`).toContain(q.answer);
        expect(new Set(q.options).size).toBe(q.options.length);
      }
    }
  });

  it('дошкілля — букви й лічба; 3 клас — без букв, з таблицею', () => {
    expect(new Set(buildCheck('preschool').map((q) => q.area))).toEqual(new Set(['letters', 'counting']));
    const g3 = new Set(buildCheck('grade3').map((q) => q.area));
    expect(g3.has('tables') && !g3.has('letters')).toBe(true);
  });

  it('один результат на місяць, «треба пройти» зникає після проходження', () => {
    const NOW = new Date(2026, 9, 7).getTime();
    expect(checkDue('k', NOW)).toBe(true);
    saveCheck('k', { month: monthOf(NOW), at: NOW, scores: { tables: { c: 2, t: 6 } } });
    saveCheck('k', { month: monthOf(NOW), at: NOW + 1, scores: { tables: { c: 5, t: 6 } } });
    expect(loadChecks('k')).toHaveLength(1);
    expect(checkDue('k', NOW)).toBe(false);
    expect(checkDue('k', new Date(2026, 10, 1).getTime())).toBe(true);
  });

  it('слабка область піднімає свою гру в розумному плані', () => {
    saveCheck('k', { month: '2026-10', at: 1, scores: { tables: { c: 2, t: 6 }, arith: { c: 5, t: 5 } } });
    expect(weakAreas('k')).toEqual(['tables']);
    const sig = { weakFacts: 0, dueWords: 0, lettersInProgress: 0, checkWeak: ['times-tables'] };
    const r = scoreGame('times-tables', [], sig, Date.now());
    expect(r.reason).toContain('перевірка місяця');
    expect(r.score).toBeGreaterThan(scoreGame('math-examples', [], sig, Date.now()).score);
  });

  it('підрахунок по областях', () => {
    const qs = buildCheck('grade2');
    const s = score(qs, qs.map((q) => q.answer));
    for (const v of Object.values(s)) expect(v!.c).toBe(v!.t);
  });
});
