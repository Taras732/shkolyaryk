import { describe, it, expect, beforeEach } from 'vitest';
import { mergeLogs } from './family-sync';
import { masteryFromAttempts } from './mastery-local-core';
import { createDailyPlan, fetchDailyPlan, fetchMastery, updatePlanItemStatus, upsertMasteryMany } from './db';

describe('mergeLogs — журнал з двох пристроїв', () => {
  it('обʼєднує без дублів і за часом', () => {
    const a = JSON.stringify([{ at: 1, gameId: 'x' }, { at: 3, gameId: 'y' }]);
    const b = JSON.stringify([{ at: 2, gameId: 'z' }, { at: 3, gameId: 'y' }]);
    expect(JSON.parse(mergeLogs(a, b)).map((e: { at: number }) => e.at)).toEqual([1, 2, 3]);
  });
  it('битий локальний — бере серверний', () => {
    expect(mergeLogs('{', '[]')).toBe('[]');
  });
});

describe('masteryFromAttempts', () => {
  const skills = [{ id: 'a', mastery_threshold: 0.8 }, { id: 'b', mastery_threshold: 0.8 }];
  const prereqs = [{ skill_id: 'b', prerequisite_id: 'a' }];

  it('EMA по спробах у хронології; b відкривається одразу, а «засвоєно» для a — ще ні (один день)', () => {
    const rows = masteryFromAttempts('p', [
      { skillId: 'a', correct: 5, total: 5, at: 2 },
      { skillId: 'a', correct: 4, total: 5, at: 1 },
    ], {}, skills, prereqs);
    const a = rows.find((r) => r.skill_id === 'a')!;
    expect(a.mastery).toBeCloseTo(0.8 + 0.4 * (1 - 0.8));
    expect(a.status).toBe('frontier');
    expect(rows.find((r) => r.skill_id === 'b')!.status).toBe('frontier');
  });

  // 11.10.2026: стійкість — «засвоєно» лише після вдалих повторів через 1 і 3 дні
  const D = 24 * 60 * 60 * 1000;
  const ok = (at: number) => ({ skillId: 'a', correct: 5, total: 5, at });
  it('стійкість: день 0 → +1 → +3 дає «засвоєно»; ще +7 — стійко', () => {
    const two = masteryFromAttempts('p', [ok(0), ok(1 * D), ok(4 * D)], {}, skills, prereqs).find((r) => r.skill_id === 'a')!;
    expect(two.stability).toBe(2);
    expect(two.status).toBe('mastered');
    const three = masteryFromAttempts('p', [ok(0), ok(1 * D), ok(4 * D), ok(11 * D)], {}, skills, prereqs).find((r) => r.skill_id === 'a')!;
    expect(three.stability).toBe(3);
  });
  it('стійкість: зарано (той самий день) не рахується; невдача скидає', () => {
    const early = masteryFromAttempts('p', [ok(0), ok(D / 2), ok(D * 0.9)], {}, skills, prereqs).find((r) => r.skill_id === 'a')!;
    expect(early.stability).toBe(0);
    const reset = masteryFromAttempts('p', [ok(0), ok(1 * D), ok(4 * D), { skillId: 'a', correct: 1, total: 5, at: 5 * D }], {}, skills, prereqs).find((r) => r.skill_id === 'a')!;
    expect(reset.stability).toBe(0);
    expect(reset.status).not.toBe('mastered');
  });
  it('тест на рівень: стартова точка вважається стійкою', () => {
    const f = masteryFromAttempts('p', [], { a: 0.9 }, skills, prereqs).find((r) => r.skill_id === 'a')!;
    expect(f.status).toBe('mastered');
  });

  it('тест на рівень — стартова точка, а не стеля', () => {
    const rows = masteryFromAttempts('p', [{ skillId: 'a', correct: 0, total: 5, at: 1 }], { a: 0.9 }, skills, prereqs);
    expect(rows.find((r) => r.skill_id === 'a')!.mastery).toBeCloseTo(0.9 * 0.6);
  });
});

describe('db.ts на локальних даних', () => {
  const mem = new Map<string, string>();
  beforeEach(() => {
    mem.clear();
    (globalThis as unknown as { localStorage: Pick<Storage, 'getItem' | 'setItem'> }).localStorage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
    };
  });

  it('засвоєння з журналу + тест на рівень', async () => {
    await upsertMasteryMany([{ profile_id: 'p', skill_id: 'math.count.l1.compose-10', mastery: 0.5 }]);
    localStorage.setItem('shk.log.v1.p', JSON.stringify([{ at: 1, gameId: 'number-tiles', difficulty: 1, mistakes: 0, stars: 3, total: 5 }]));
    const m = (await fetchMastery('p')).find((r) => r.skill_id === 'math.count.l1.compose-10')!;
    expect(m.mastery).toBeCloseTo(0.5 + 0.4 * 0.5);
  });

  it('план дня: створити, відмітити крок, прочитати', async () => {
    const day = await createDailyPlan('p', '2026-10-11', [{ kind: 'game', ref_id: 'x', skill_id: null, status: 'pending', result: null, sort: 0 }]);
    await updatePlanItemStatus(day.items[0].id, 'done');
    expect((await fetchDailyPlan('p', '2026-10-11'))!.items[0].status).toBe('done');
  });
});
