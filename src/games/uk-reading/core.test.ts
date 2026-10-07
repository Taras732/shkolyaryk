import { describe, it, expect } from 'vitest';
import { TEXTS, wordCount } from './texts';
import { MAX_PLAUSIBLE_WPM, addResult, pickText, readingSummary, wpm } from './core';

describe('uk-reading: тексти', () => {
  it('по 4 тексти на рівень, у кожного 3 питання з 3 варіантами і валідною відповіддю', () => {
    for (const lvl of [1, 2, 3]) expect(TEXTS.filter((t) => t.level === lvl)).toHaveLength(4);
    expect(new Set(TEXTS.map((t) => t.id)).size).toBe(TEXTS.length);
    for (const t of TEXTS) {
      expect(t.questions).toHaveLength(3);
      for (const q of t.questions) {
        expect(q.options).toHaveLength(3);
        expect(new Set(q.options).size).toBe(3);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(3);
      }
    }
  });

  it('довжина росте з рівнем', () => {
    const avg = (l: number) => TEXTS.filter((t) => t.level === l).reduce((s, t) => s + wordCount(t.text), 0) / 4;
    expect(avg(1)).toBeLessThan(avg(2));
    expect(avg(2)).toBeLessThan(avg(3));
  });
});

describe('uk-reading: швидкість і вибір тексту', () => {
  it('слів за хвилину; «прогортання» не рахується', () => {
    const t = 'один два три чотири п\'ять шість сім вісім дев\'ять десять';
    expect(wpm(t, 15000)).toBe(40);
    expect(wpm(t, 1000)).toBeNull(); // 600 сл/хв > MAX_PLAUSIBLE_WPM
    expect(MAX_PLAUSIBLE_WPM).toBeGreaterThan(100);
  });

  it('спершу непрочитані; коли всі прочитані — найдавніший', () => {
    let log = {};
    const seen = new Set<string>();
    for (let i = 0; i < 4; i++) {
      const t = pickText(1, log, () => 0);
      expect(seen.has(t.id)).toBe(false);
      seen.add(t.id);
      log = addResult(log, t.id, { at: 100 + i, wpm: 40, correct: 3, total: 3 });
    }
    const oldest = TEXTS.filter((t) => t.level === 1).find((t) => (log as any)[t.id][0].at === 100)!;
    expect(pickText(1, log, () => 0).id).toBe(oldest.id);
  });

  it('звіт: середня швидкість лише з чесних вимірів', () => {
    let log = addResult({}, 'a', { at: 10, wpm: 40, correct: 2, total: 3 });
    log = addResult(log, 'b', { at: 20, wpm: null, correct: 3, total: 3 });
    log = addResult(log, 'c', { at: 30, wpm: 60, correct: 1, total: 3 });
    expect(readingSummary(log, 0)).toEqual({ texts: 3, avgWpm: 50, correct: 6, total: 9 });
    expect(readingSummary(log, 25).texts).toBe(1);
  });
});

import { computeStars, unlockedAfter } from '../types';
import ukReading from './index';

describe('uk-reading: зірки', () => {
  it('рівень відкривається лише з 2+ правильними з 3', () => {
    const rounds = ukReading.generate(1, 'L3').rounds.length;
    expect(unlockedAfter(1, computeStars(1, rounds), 1)).toBe(2);
    expect(unlockedAfter(1, computeStars(2, rounds), 1)).toBe(1);
  });
});
