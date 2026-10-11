import { describe, it, expect } from 'vitest';
import { generate } from './index';
import { CLOSE, MULTI, OPPOSITES, SWAPS } from './data';

describe('uk-words', () => {
  it('d1: три різні варіанти, правильний — пара до слова', () => {
    for (let i = 0; i < 40; i++) for (const r of generate(1).rounds) {
      const p = r.payload as { word: string; options: string[] };
      expect(new Set(p.options).size).toBe(3);
      const o = OPPOSITES.find((x) => x.a === p.word || x.b === p.word)!;
      expect(r.answer).toBe(o.a === p.word ? o.b : o.a);
      expect(p.options).toContain(r.answer);
    }
  });
  it('d2: серед варіантів близьке, протилежне і ще одне', () => {
    for (let i = 0; i < 40; i++) for (const r of generate(2).rounds) {
      const p = r.payload as { word: string; options: string[] };
      const c = CLOSE.find((x) => x.a === p.word)!;
      expect(p.options).toContain(c.b);
      expect(p.options).toContain(c.opp);
      expect(new Set(p.options).size).toBe(3);
    }
  });
  it('d3: 3 раунди «один звук» і 2 «кілька значень»; у «кількох значень» відповідь — друге значення', () => {
    for (let i = 0; i < 40; i++) {
      const rounds = generate(3).rounds;
      const multi = rounds.filter((r) => (r.payload as { mode: string }).mode === 'multi');
      expect(multi).toHaveLength(2);
      for (const r of multi) {
        const p = r.payload as { word: string; shown: string; options: string[] };
        const m = MULTI.find((x) => x.word === p.word)!;
        expect(r.answer).toBe(m.other);
        expect(p.options).not.toContain(p.shown);
        expect(new Set(p.options).size).toBe(3);
      }
    }
  });
  it('d3: картинка слова, картинка пари і третя — різні', () => {
    for (let i = 0; i < 40; i++) for (const r of generate(3).rounds.filter((x) => (x.payload as { mode: string }).mode === 'swap')) {
      const p = r.payload as { word: string; options: string[] };
      const s = SWAPS.find((x) => x.word === p.word)!;
      expect(p.options).toContain(s.emoji);
      expect(p.options).toContain(s.pairEmoji);
      expect(new Set(p.options).size).toBe(3);
    }
  });
});
