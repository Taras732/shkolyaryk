import { describe, it, expect } from 'vitest';
import { CVC, LETTERS } from './data';
import { SESSION, buildSession, oneLetterOff, record } from './core';

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

describe('en-reading: дані', () => {
  it('опорне слово починається з літери; CVC — три літери; картинки не повторюються', () => {
    for (const l of LETTERS) expect(l.word[0], l.letter).toBe(l.letter);
    for (const c of CVC) expect(c.word).toMatch(/^[a-z]{3}$/);
    expect(new Set(CVC.map((c) => c.emoji)).size).toBe(CVC.length);
    expect(new Set(LETTERS.map((l) => l.emoji)).size).toBe(LETTERS.length);
  });

  it('схожі на слух: рівно одна літера різниці', () => {
    expect(oneLetterOff('cat')).toEqual(expect.arrayContaining(['cot', 'cut', 'hat']));
    for (const w of oneLetterOff('cat')) expect([...w].filter((ch, i) => ch !== 'cat'[i])).toHaveLength(1);
  });
});

describe('en-reading: сесія', () => {
  it('кожен рівень: правильна відповідь серед 3 різних варіантів', () => {
    for (const d of [1, 2, 3] as const) {
      for (let s = 1; s < 25; s++) {
        const qs = buildSession(d, {}, seeded(s));
        expect(qs).toHaveLength(SESSION);
        for (const q of qs) {
          expect(q.options).toHaveLength(3);
          expect(new Set(q.options.map((o) => o.key)).size).toBe(3);
          expect(q.options.map((o) => o.key)).toContain(q.answer);
        }
      }
    }
  });

  it('«Легко» — лише звуки; «Середньо» — читання і слух; «Складно» — є фрази', () => {
    expect(new Set(buildSession(1, {}, seeded(1)).map((q) => q.mode))).toEqual(new Set(['sound']));
    expect(new Set(buildSession(2, {}, seeded(1)).map((q) => q.mode))).toEqual(new Set(['read', 'listen']));
    expect(buildSession(3, {}, seeded(1)).some((q) => q.mode === 'phrase')).toBe(true);
  });

  it('фраза й картинка узгоджені: two → дві іконки', () => {
    for (let s = 1; s < 25; s++) {
      for (const q of buildSession(3, {}, seeded(s)).filter((x) => x.mode === 'phrase')) {
        const n = q.prompt.startsWith('one') ? 1 : q.prompt.startsWith('two') ? 2 : 3;
        expect([...q.answer.replace(/️/g, '')].length).toBe(n);
      }
    }
  });

  it('помилка скидає серію', () => {
    const p = record(record({}, 'w:cat', true, 0), 'w:cat', false, 1);
    expect(p['w:cat']).toEqual({ streak: 0, bad: 1, last: 1 });
  });
});
