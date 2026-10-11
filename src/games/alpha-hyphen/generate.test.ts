import { describe, it, expect } from 'vitest';
import { generate, alphaSort } from './index';

describe('alpha-hyphen', () => {
  it('алфавітний порядок: українська абетка (ґ після г, є після е, ї після і)', () => {
    expect(alphaSort(['їжак', 'ірис', 'гуска', 'ґудзик', 'єнот', 'екран'])).toEqual(['гуска', 'ґудзик', 'екран', 'єнот', 'ірис', 'їжак']);
    expect(alphaSort(['мак', 'малина', 'миска'])).toEqual(['мак', 'малина', 'миска']);
  });
  it('d1: 5 різних слів; відповідь — відсортований рядок', () => {
    for (let i = 0; i < 30; i++) for (const r of generate(1).rounds) {
      const p = r.payload as { words: string[] };
      expect(new Set(p.words).size).toBe(5);
      expect(r.answer).toBe(alphaSort(p.words).join(','));
    }
  });
  it('d2/d3: правильний варіант серед трьох різних; хибні — те саме слово інакше', () => {
    for (const d of [2, 3] as const) for (let i = 0; i < 30; i++) for (const r of generate(d).rounds) {
      const p = r.payload as { options: string[] };
      expect(p.options).toContain(r.answer);
      expect(new Set(p.options).size).toBe(3);
      if (d === 2) for (const o of p.options) expect(o.replace(/-/g, '')).toBe(String(r.answer).replace(/-/g, ''));
    }
  });
});
