import { describe, it, expect } from 'vitest';
import { POUR_TASKS, TASKS_PER_GAME, minMoves, pickTasks, pour } from './core';

describe('pour-kids: переливайка для малих', () => {
  it('рівень 1 — один рух, 2 — два, 3 — чотири; на старті ціль ще не досягнута', () => {
    const want = { 1: 1, 2: 2, 3: 4 } as const;
    for (const d of [1, 2, 3] as const) {
      for (const t of POUR_TASKS[d]) {
        expect(minMoves(t)).toBe(want[d]);
        expect(t.start).not.toContain(t.target);
        // зірочка має бути хоч на одній банці
        expect(Math.max(...t.caps)).toBeGreaterThanOrEqual(t.target);
      }
    }
  });

  it('переливається стільки, скільки влізе', () => {
    expect(pour([5, 0], [5, 3], 0, 1)).toEqual([2, 3]);
    expect(pour([1, 2], [5, 3], 0, 1)).toEqual([0, 3]);
  });

  it('у грі — 3 різні задачі', () => {
    for (const d of [1, 2, 3] as const) {
      const ts = pickTasks(d);
      expect(ts).toHaveLength(TASKS_PER_GAME);
      expect(new Set(ts).size).toBe(TASKS_PER_GAME);
    }
  });
});
