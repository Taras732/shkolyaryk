// Валідація seed skill-graph української мови (задача L1).
// Логіка DAG-перевірки дзеркалить supabase/seed/seed-skills.mjs (Kahn's algorithm),
// але тримається локально в TS, без мережі й без залежності на .mjs-сидер.

import { describe, expect, it } from 'vitest';
import { LANGUAGE_SKILLS } from './skills-language';
import type { SeedSkill } from './skills-language';

const BAND_ORDER: Record<string, number> = { L0: 0, L1: 1, L2: 2, L3: 3, L4: 4 };

function topoSort(skills: SeedSkill[]): { order: string[]; cyclic: string[] } {
  const byId = new Map(skills.map((s) => [s.id, s]));
  const inDegree = new Map(skills.map((s) => [s.id, 0]));
  const dependents = new Map<string, string[]>(skills.map((s) => [s.id, []]));

  for (const s of skills) {
    for (const prereqId of s.prerequisites) {
      if (!byId.has(prereqId)) continue; // хиснучі посилання перевіряються окремим тестом
      inDegree.set(s.id, (inDegree.get(s.id) ?? 0) + 1);
      dependents.get(prereqId)?.push(s.id);
    }
  }

  const queue = skills.filter((s) => inDegree.get(s.id) === 0).map((s) => s.id);
  const order: string[] = [];

  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(id);
    for (const depId of dependents.get(id) ?? []) {
      inDegree.set(depId, (inDegree.get(depId) ?? 0) - 1);
      if (inDegree.get(depId) === 0) queue.push(depId);
    }
  }

  const cyclic = skills.filter((s) => !order.includes(s.id)).map((s) => s.id);
  return { order, cyclic };
}

describe('LANGUAGE_SKILLS — структура', () => {
  // 11.10.2026: стеля 70 → 80 — звірка з програмою Савченко додала навички 1–2 класу
  it('має 55–80 навичок (з ≥8 на кожен grade_band)', () => {
    expect(LANGUAGE_SKILLS.length).toBeGreaterThanOrEqual(55);
    expect(LANGUAGE_SKILLS.length).toBeLessThanOrEqual(80);
  });

  it('усі id унікальні', () => {
    const ids = LANGUAGE_SKILLS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('усі id відповідають формату language.<strand>.<band>.<slug> (лише латиниця)', () => {
    const pattern = /^language\.[a-z0-9-]+\.l[0-4]\.[a-z0-9-]+$/;
    for (const s of LANGUAGE_SKILLS) {
      expect(s.id, `id "${s.id}" не відповідає формату`).toMatch(pattern);
    }
  });

  it('sort унікальний для кожної навички', () => {
    const sorts = LANGUAGE_SKILLS.map((s) => s.sort);
    expect(sorts.every((v) => v !== undefined)).toBe(true);
    expect(new Set(sorts).size).toBe(sorts.length);
  });

  it('subject === "language" для всіх записів', () => {
    for (const s of LANGUAGE_SKILLS) expect(s.subject).toBe('language');
  });
});

describe('LANGUAGE_SKILLS — grade_band розбивка', () => {
  const bands = ['L0', 'L1', 'L2', 'L3', 'L4'] as const;

  for (const band of bands) {
    it(`band ${band} має ≥8 навичок`, () => {
      const count = LANGUAGE_SKILLS.filter((s) => s.grade_band === band).length;
      expect(count).toBeGreaterThanOrEqual(8);
    });
  }
});

describe('LANGUAGE_SKILLS — DAG prerequisites', () => {
  it('усі prerequisites посилаються на існуючі id (0 висячих посилань)', () => {
    const byId = new Set(LANGUAGE_SKILLS.map((s) => s.id));
    const dangling: string[] = [];
    for (const s of LANGUAGE_SKILLS) {
      for (const prereqId of s.prerequisites) {
        if (!byId.has(prereqId)) dangling.push(`${s.id} -> ${prereqId}`);
      }
    }
    expect(dangling).toEqual([]);
  });

  it('DAG без циклів (topo-sort охоплює усі вузли)', () => {
    const { order, cyclic } = topoSort(LANGUAGE_SKILLS);
    expect(cyclic).toEqual([]);
    expect(order.length).toBe(LANGUAGE_SKILLS.length);
  });

  it('передумова завжди того самого або РАНІШОГО grade_band (без forward-посилань)', () => {
    const byId = new Map(LANGUAGE_SKILLS.map((s) => [s.id, s]));
    const violations: string[] = [];
    for (const s of LANGUAGE_SKILLS) {
      for (const prereqId of s.prerequisites) {
        const prereq = byId.get(prereqId);
        if (!prereq) continue;
        if (BAND_ORDER[prereq.grade_band] > BAND_ORDER[s.grade_band]) {
          violations.push(`${s.id} (${s.grade_band}) залежить від ${prereqId} (${prereq.grade_band}) — пізніший band`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});

describe('LANGUAGE_SKILLS — НУШ-атрибути', () => {
  it('galuzey === "МОВ" для всіх записів', () => {
    for (const s of LANGUAGE_SKILLS) expect(s.galuzey).toBe('МОВ');
  });

  it('cycle відповідає grade_band: L0→null, L1/L2→1, L3/L4→2', () => {
    const expectedCycle: Record<string, 1 | 2 | null> = {
      L0: null,
      L1: 1,
      L2: 1,
      L3: 2,
      L4: 2,
    };
    for (const s of LANGUAGE_SKILLS) {
      expect(s.cycle, `${s.id} (${s.grade_band}) має cycle=${s.cycle}`).toBe(expectedCycle[s.grade_band]);
    }
  });

  it('orn_refs не заповнено (SeedSkill не містить це поле — вигадувати коди ОРН заборонено)', () => {
    for (const s of LANGUAGE_SKILLS) {
      expect((s as unknown as Record<string, unknown>).orn_refs).toBeUndefined();
    }
  });
});

describe('LANGUAGE_SKILLS — strands', () => {
  it('4–5 strands, кожен українською', () => {
    const strands = [...new Set(LANGUAGE_SKILLS.map((s) => s.strand))];
    expect(strands.length).toBeGreaterThanOrEqual(4);
    expect(strands.length).toBeLessThanOrEqual(5);
    for (const strand of strands) {
      expect(strand).toMatch(/[а-яіїєґА-ЯІЇЄҐ]/);
    }
  });
});
