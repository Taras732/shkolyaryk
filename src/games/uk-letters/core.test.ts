import { describe, it, expect } from 'vitest';
import { LETTERS } from './letters';
import { KNOWN_STREAK, QUIZ_LEN, buildQuiz, nextNewLetter, open, record, unlocked, type LetterProgress } from './core';

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const learn = (p: LetterProgress, ch: string) => {
  let out = open(p, ch, 0);
  for (let i = 0; i < KNOWN_STREAK; i++) out = record(out, ch, true, 0);
  return out;
};

describe('uk-letters: буквар', () => {
  it('33 букви, унікальні; опорне слово починається з букви (крім И та Ь)', () => {
    expect(LETTERS).toHaveLength(33);
    expect(new Set(LETTERS.map((l) => l.ch)).size).toBe(33);
    for (const l of LETTERS) {
      if (l.initial) expect(l.word[0].toUpperCase(), l.ch).toBe(l.ch);
      else expect(l.word.toUpperCase()).toContain(l.ch);
    }
  });

  it('перша буква — А; нова відкривається лише коли попередні «знаю»', () => {
    expect(nextNewLetter({})?.ch).toBe('А');
    let p = open({}, 'А', 0);
    expect(nextNewLetter(p)).toBeNull();
    p = learn(p, 'А');
    expect(nextNewLetter(p)?.ch).toBe('О');
  });

  it('помилка скидає серію — буква знову не «знаю»', () => {
    const p = record(learn({}, 'А'), 'А', false, 1);
    expect(nextNewLetter(p)).toBeNull();
  });
});

describe('uk-letters: питання', () => {
  it('половина питань — на нову букву; правильна відповідь серед варіантів; варіанти різні', () => {
    for (let s = 1; s < 30; s++) {
      const p = open(learn(learn({}, 'А'), 'О'), 'У', 0);
      const fresh = LETTERS.find((l) => l.ch === 'У')!;
      const qs = buildQuiz(p, fresh, 2, seeded(s));
      expect(qs).toHaveLength(QUIZ_LEN);
      expect(qs.filter((q) => q.target.ch === 'У').length).toBeGreaterThanOrEqual(QUIZ_LEN / 2);
      for (const q of qs) {
        expect(q.options.some((o) => o.ch === q.target.ch)).toBe(true);
        expect(new Set(q.options.map((o) => o.ch)).size).toBe(q.options.length);
        expect(unlocked(p).some((l) => l.ch === q.target.ch)).toBe(true);
      }
    }
  });

  it('И та Ь — лише «знайди таку саму» (їхнє слово не з них починається)', () => {
    const p = open({}, 'И', 0);
    const fresh = LETTERS.find((l) => l.ch === 'И')!;
    for (const q of buildQuiz(p, fresh, 3, seeded(7))) expect(q.mode).toBe('same');
  });

  it('у режимі «картинка» серед варіантів немає двох слів на одну букву', () => {
    for (let s = 1; s < 30; s++) {
      for (const q of buildQuiz(open({}, 'М', 0), LETTERS.find((l) => l.ch === 'М')!, 3, seeded(s))) {
        if (q.mode !== 'same') expect(new Set(q.options.map((o) => o.word[0])).size).toBe(q.options.length);
      }
    }
  });
});
