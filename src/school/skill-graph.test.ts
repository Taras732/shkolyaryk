import { it, expect } from 'vitest';
import { MATH_SKILLS } from './skills-math';
import { LANGUAGE_SKILLS } from './skills-language';

// 11.10.2026: після перебудов графа за програмою — передумови існують і не з вищого класу, id унікальні
it('граф навичок цілісний', () => {
  const all = [...MATH_SKILLS, ...LANGUAGE_SKILLS] as { id: string; grade_band: string; prerequisites: string[] }[];
  const by = new Map(all.map((s) => [s.id, s]));
  const bad: string[] = [];
  for (const s of all) for (const p of s.prerequisites) {
    const q = by.get(p);
    if (!q) bad.push(`${s.id} -> немає ${p}`);
    else if (q.grade_band > s.grade_band) bad.push(`${s.id}(${s.grade_band}) -> ${p}(${q.grade_band})`);
  }
  const ids = all.map((s) => s.id);
  ids.forEach((x, i) => { if (ids.indexOf(x) !== i) bad.push('дубль ' + x); });
  expect(bad).toEqual([]);
});
