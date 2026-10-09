import { describe, it, expect } from 'vitest';
import { LETTERS } from './letters';
import {
  GROUPS, KNOWN_STREAK, QUICK_PASS, QUIZ_LEN, buildCheck, buildQuiz, currentGroup, dueLetters, isFresh, isKnown,
  newLetters, open, passGroup, record, statusOf, type LetterProgress,
} from './core';

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const DAY = 24 * 60 * 60 * 1000;

const learn = (p: LetterProgress, ch: string, now = 0) => {
  let out = open(p, ch, now);
  for (let i = 0; i < KNOWN_STREAK; i++) out = record(out, ch, true, now);
  return out;
};

describe('uk-letters: буквар групами', () => {
  it('33 букви, унікальні; опорне слово починається з букви (крім И та Ь)', () => {
    expect(LETTERS).toHaveLength(33);
    expect(new Set(LETTERS.map((l) => l.ch)).size).toBe(33);
    for (const l of LETTERS) if (l.initial) expect(l.word[0].toUpperCase()).toBe(l.ch);
  });

  it('групи покривають усі 33 букви рівно по разу', () => {
    const all = GROUPS.flatMap((g) => g.letters);
    expect(all).toHaveLength(33);
    expect(new Set(all)).toEqual(new Set(LETTERS.map((l) => l.ch)));
  });

  it('старт — голосні, свіжа група: спершу перевірка з 5 питань «почуй і знайди»', () => {
    expect(currentGroup({})).toBe(0);
    expect(isFresh({}, 0)).toBe(true);
    const check = buildCheck({}, 0, 1, seeded(1));
    expect(check).toHaveLength(QUICK_PASS);
    for (const q of check) {
      expect(GROUPS[0].letters).toContain(q.target.ch);
      expect(q.mode).toBe('same');
      expect(q.options.map((o) => o.ch)).toContain(q.target.ch);
    }
  });

  it('швидкий прохід — уся група «знаю», поточна стає наступною', () => {
    const p = passGroup({}, 0, 0);
    for (const ch of GROUPS[0].letters) expect(isKnown(p[ch])).toBe(true);
    expect(currentGroup(p)).toBe(1);
  });

  it('нових букв за сесію не більше двох', () => {
    expect(newLetters({}).length).toBeLessThanOrEqual(2);
    let p: LetterProgress = {};
    for (const l of newLetters(p)) p = open(p, l.ch, 0);
    expect(newLetters(p)).toHaveLength(0); // дві «вчу» — нових не додаємо
  });

  it('помилка скидає серію — буква знову «вчу»', () => {
    let p = learn({}, 'А');
    expect(isKnown(p.А)).toBe(true);
    p = record(p, 'А', false, 0);
    expect(isKnown(p.А)).toBe(false);
  });
});

describe('uk-letters: повтор 1 · 3 · 7', () => {
  it('вивчена буква йде в повтор завтра; три вчасні повтори — «золота»', () => {
    let p = learn({}, 'А', 0);
    expect(dueLetters(p, 0)).toHaveLength(0);
    expect(dueLetters(p, 1 * DAY).map((l) => l.ch)).toEqual(['А']);
    p = record(p, 'А', true, 1 * DAY);
    p = record(p, 'А', true, 4 * DAY);
    p = record(p, 'А', true, 11 * DAY);
    expect(statusOf(p.А)).toBe('gold');
  });
});

describe('uk-letters: питання', () => {
  it('нова буква — двічі; правильна відповідь серед варіантів; варіанти різні; не довше сесії', () => {
    let p: LetterProgress = {};
    const fresh = newLetters(p);
    for (const l of fresh) p = open(p, l.ch, 0);
    const quiz = buildQuiz(p, fresh, 2, seeded(7), 0);
    expect(quiz.length).toBeGreaterThan(0);
    expect(quiz.length).toBeLessThanOrEqual(QUIZ_LEN);
    for (const f of fresh) expect(quiz.filter((q) => q.target.ch === f.ch).length).toBeGreaterThanOrEqual(2);
    for (const q of quiz) {
      expect(q.options.map((o) => o.ch)).toContain(q.target.ch);
      expect(new Set(q.options.map((o) => o.ch)).size).toBe(q.options.length);
    }
  });

  it('И та Ь — лише «почуй і знайди» (їхнє слово не з них починається)', () => {
    let p = learn({}, 'И');
    p = learn(p, 'А');
    for (const q of buildQuiz(p, null, 3, seeded(3), 0)) if (q.target.ch === 'И') expect(q.mode).toBe('same');
  });

  it('у режимі «картинка» серед варіантів немає двох слів на одну букву', () => {
    let p: LetterProgress = {};
    for (const ch of ['А', 'О', 'У', 'І', 'Е', 'М']) p = learn(p, ch);
    for (let s = 1; s < 30; s++) {
      for (const q of buildQuiz(p, null, 2, seeded(s), 0)) {
        if (q.mode !== 'same') expect(new Set(q.options.map((o) => o.word[0])).size).toBe(q.options.length);
      }
    }
  });
});
