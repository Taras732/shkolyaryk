import { describe, it, expect } from 'vitest';
import { CATEGORIES, ROUNDS, buildTasks, explain, makeTask } from './core';

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

describe('odd-one-out: що тут зайве', () => {
  it('групи класифікації — кожна картинка лише в одній групі', () => {
    const all = CATEGORIES.flatMap((c) => c.items);
    expect(new Set(all).size).toBe(all.length);
  });

  it('однакові/схожі: три однакові й одна інша, зайва на своєму місці', () => {
    for (let s = 1; s < 40; s++) {
      for (const k of ['different', 'lookalike'] as const) {
        const t = makeTask(k, seeded(s));
        expect(t.items).toHaveLength(4);
        const rest = t.items.filter((_, i) => i !== t.odd);
        expect(new Set(rest).size).toBe(1);
        expect(t.items[t.odd]).not.toBe(rest[0]);
      }
    }
  });

  it('класифікація: решта з однієї групи, зайва — з іншої; пояснення називає групу', () => {
    for (let s = 1; s < 40; s++) {
      const t = makeTask('category', seeded(s));
      const rest = t.items.filter((_, i) => i !== t.odd);
      for (const e of rest) expect(t.category!.items).toContain(e);
      expect(t.category!.items).not.toContain(t.items[t.odd]);
      expect(explain(t).text).toContain(t.category!.plural);
    }
  });

  it('сесія — 6 раундів; на «Легко» класифікації немає, на «Складно» — переважає', () => {
    expect(buildTasks(1, seeded(1))).toHaveLength(ROUNDS);
    expect(buildTasks(1, seeded(1)).some((t) => t.kind === 'category')).toBe(false);
    expect(buildTasks(3, seeded(1)).filter((t) => t.kind === 'category').length).toBeGreaterThanOrEqual(4);
  });
});
