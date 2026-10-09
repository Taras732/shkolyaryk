import { describe, it, expect } from 'vitest';
import { CLEAN_TO_LEVEL_UP, LETTER_WORDS, ROUNDS, SYL_WORDS, WORDS_BY_LEN, buildByLength, buildTasks, nextLength } from './core';

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

describe('syllable-build: склади слово', () => {
  it('слово = плитки по порядку; лише українські слова (без «КОТ»)', () => {
    for (const w of [...LETTER_WORDS, ...SYL_WORDS]) expect(w.parts.join('')).toBe(w.word);
    const all = [...LETTER_WORDS, ...SYL_WORDS].map((w) => w.word);
    expect(all).not.toContain('КОТ');
    expect(all).toContain('КІТ');
  });

  it('плитки-склади без «И» (синтезатор читає її як «І»)', () => {
    for (const w of SYL_WORDS) for (const p of w.parts) expect(p).not.toContain('И');
  });

  it('плитки перемішані й містять усі частини; на «складно» — одна зайва', () => {
    for (let s = 1; s < 30; s++) {
      for (const d of [1, 2, 3] as const) {
        const tasks = buildTasks(d, seeded(s));
        expect(tasks).toHaveLength(ROUNDS);
        for (const t of tasks) {
          for (const p of t.entry.parts) expect(t.tiles).toContain(p);
          expect(t.tiles.length).toBe(t.entry.parts.length + (d === 3 ? 1 : 0));
          if (d !== 3 && new Set(t.entry.parts).size > 1) expect(t.tiles.join('|')).not.toBe(t.entry.parts.join('|'));
        }
      }
    }
  });

  it('сходинки 3 → 4 → 5 букв: довжина слова відповідає сходинці; підйом після 5 чистих', () => {
    for (const len of [3, 4, 5] as const) {
      for (const w of WORDS_BY_LEN[len]) { expect(w.word.length).toBe(len); expect(w.parts.join('')).toBe(w.word); }
      for (const t of buildByLength(len, seeded(len))) expect(t.tiles).toHaveLength(len);
    }
    expect(nextLength(3, CLEAN_TO_LEVEL_UP - 1)).toBe(3);
    expect(nextLength(3, CLEAN_TO_LEVEL_UP)).toBe(4);
    expect(nextLength(5, 99)).toBe(5);
  });
});
