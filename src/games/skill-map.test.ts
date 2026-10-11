import { describe, it, expect } from 'vitest';
import { GAMES, gameSkills } from './registry';
import { CLASS_LEVELS } from './types';
import { MATH_SKILLS } from '../school/skills-math';
import { LANGUAGE_SKILLS } from '../school/skills-language';

// 11.10.2026: навички ігор за класом × складністю мають існувати в графі —
// інакше гра мовчки нічого не зараховує в засвоєння.
describe('мапа гра → навички', () => {
  it('кожна навичка з skillIds/skillsFor є в графі', () => {
    const ids = new Set([...MATH_SKILLS, ...LANGUAGE_SKILLS].map((s) => s.id));
    const bad = new Set<string>();
    for (const g of GAMES) for (const cl of CLASS_LEVELS) for (const d of [1, 2, 3])
      for (const s of gameSkills(g, d, cl)) if (!ids.has(s)) bad.add(`${g.id}: ${s}`);
    expect([...bad]).toEqual([]);
  });

  it('1 клас: порівняння чисел до 10 не зараховується як навичка 2 класу', () => {
    const g = GAMES.find((x) => x.id === 'math-compare')!;
    expect(gameSkills(g, 1, 'grade1')).toEqual(['math.count.l1.compare-numbers-20']);
  });
});
