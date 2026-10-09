import { describe, it, expect } from 'vitest';
import { CATEGORIES, ROUNDS, TRAITS, buildTasks, explain, makeTask } from './core';

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const catOf = (e: string) => CATEGORIES.find((c) => c.items.includes(e));

describe('odd-one-out: лише класифікація', () => {
  it('кожна картинка — лише в одній категорії; ознаки «так» і «ні» не перетинаються', () => {
    const all = CATEGORIES.flatMap((c) => c.items);
    expect(new Set(all).size).toBe(all.length);
    for (const t of TRAITS) for (const y of t.yes) expect(t.no).not.toContain(y);
  });

  it('сходинка 1 — зайва з іншої «сімʼї»; сходинка 2 — з тієї ж сімʼї, інша категорія; решта — одна категорія, без однакових', () => {
    for (let s = 1; s < 60; s++) {
      for (const step of [1, 2] as const) {
        const t = makeTask(step, seeded(s));
        const rest = t.items.filter((_, i) => i !== t.odd);
        expect(new Set(rest).size).toBe(3); // не однакові картинки
        const c = catOf(rest[0])!;
        for (const e of rest) expect(catOf(e)).toBe(c);
        const o = catOf(t.items[t.odd])!;
        expect(o.id).not.toBe(c.id);
        if (step === 1) expect(o.family).not.toBe(c.family);
        else expect(o.family).toBe(c.family);
        expect(explain(t).text).toContain(c.plural);
      }
    }
  });

  it('сходинка 3 — за ознакою: решта мають ознаку, зайва — ні', () => {
    for (let s = 1; s < 40; s++) {
      const t = makeTask(3, seeded(s));
      const tr = TRAITS.find((x) => t.why === `odd_${x.id}`)!;
      t.items.forEach((e, i) => (i === t.odd ? expect(tr.no).toContain(e) : expect(tr.yes).toContain(e)));
    }
  });

  it('сесія — 6 раундів', () => {
    for (const d of [1, 2, 3] as const) expect(buildTasks(d, seeded(d))).toHaveLength(ROUNDS);
  });
});
