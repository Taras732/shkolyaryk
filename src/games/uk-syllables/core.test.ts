import { describe, it, expect } from 'vitest';
import {
  CVC_WORDS, KNOWN_STREAK, PRACTICE, QUICK_PASS, SGROUPS, VOWELS, buildSession, currentGroup, isFresh, isKnown,
  open, passGroup, record, statusOf, syllableOptions, sylsOf, type SylProgress,
} from './core';

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const DAY = 24 * 60 * 60 * 1000;
const learn = (p: SylProgress, s: string, now = 0) => {
  let out = open(p, s, now);
  for (let i = 0; i < KNOWN_STREAK; i++) out = record(out, s, true, now);
  return out;
};

describe('uk-syllables: групи й сесії', () => {
  it('слово = склад + звук; без «И» серед голосних', () => {
    for (const w of CVC_WORDS) expect(w.syl + w.end).toBe(w.word);
    expect(VOWELS as readonly string[]).not.toContain('И');
  });

  it('відволікачі — схожі на слух: той самий приголосний або той самий голосний', () => {
    for (let s = 1; s < 30; s++) {
      const opts = syllableOptions('М', 'А', 4, seeded(s));
      expect(opts).toHaveLength(4);
      expect(opts).toContain('МА');
      expect(new Set(opts).size).toBe(4);
      for (const o of opts) expect(o[0] === 'М' || o[1] === 'А').toBe(true);
    }
  });

  it('старт — група 1, свіжа: перевірка з 5 питань «знайди» по складах групи', () => {
    expect(currentGroup({})).toBe(0);
    expect(isFresh({}, 0)).toBe(true);
    const s = buildSession({}, 1, seeded(1), 0);
    expect(s.check).toBe(true);
    expect(s.steps).toHaveLength(QUICK_PASS);
    for (const st of s.steps) {
      expect(st.kind).toBe('find');
      if (st.kind === 'find') {
        expect(sylsOf(0)).toContain(st.target);
        expect(st.options).toContain(st.target);
      }
    }
  });

  it('швидкий прохід — уся група «знає», поточна стає наступною', () => {
    const p = passGroup({}, 0, 0);
    for (const s of sylsOf(0)) expect(isKnown(p[s])).toBe(true);
    expect(currentGroup(p)).toBe(1);
  });

  it('навчальна сесія: спершу доріжки нових, потім практика; ціль не йде одразу після своєї доріжки', () => {
    for (let seed = 1; seed < 40; seed++) {
      // група почата (один склад зустрівся, не знає) — не свіжа
      const p = record({}, 'МА', false, 0);
      const s = buildSession(p, 1, seeded(seed), 0);
      expect(s.check).toBe(false);
      const slides = s.steps.filter((x) => x.kind === 'slide');
      const finds = s.steps.filter((x) => x.kind === 'find');
      expect(slides.length).toBeGreaterThan(0);
      expect(slides.length).toBeLessThanOrEqual(2);
      expect(finds.length).toBeLessThanOrEqual(PRACTICE);
      const firstFind = s.steps.findIndex((x) => x.kind === 'find');
      expect(s.steps.slice(0, firstFind).every((x) => x.kind === 'slide')).toBe(true);
      const lastSlide = s.steps[firstFind - 1];
      const ff = s.steps[firstFind];
      if (lastSlide?.kind === 'slide' && ff?.kind === 'find' && new Set(finds.map((f) => (f.kind === 'find' ? f.target : ''))).size > 1) {
        expect(ff.target).not.toBe(lastSlide.syl);
      }
      // та сама ціль двічі поспіль у практиці — ні
      for (let i = 1; i < finds.length; i++) {
        const a = finds[i - 1], b = finds[i];
        if (a.kind === 'find' && b.kind === 'find' && new Set(finds.map((f) => (f.kind === 'find' ? f.target : ''))).size > 1) expect(a.target).not.toBe(b.target);
      }
    }
  });

  it('повтор 1 · 3 · 7 — «золотий»', () => {
    let p = learn({}, 'МА', 0);
    p = record(p, 'МА', true, 1 * DAY);
    p = record(p, 'МА', true, 4 * DAY);
    p = record(p, 'МА', true, 11 * DAY);
    expect(statusOf(p.МА)).toBe('gold');
  });

  it('групи — лише з наших приголосних і голосних', () => {
    for (const g of SGROUPS) for (const v of g.vs) expect(VOWELS as readonly string[]).toContain(v);
  });
});
