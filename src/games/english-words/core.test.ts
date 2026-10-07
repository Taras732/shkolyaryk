import { describe, it, expect } from 'vitest';
import { DAY, KNOWN_BOX, NEW_PER_LESSON, addCustom, buildQuiz, counts, distractors, dueWords, emptyDict, newWords, record, statusOf } from './core';
import { WORDS } from './words';

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

describe('english-words: словник', () => {
  it('стартові слова унікальні, у кожного є переклад і картинка', () => {
    expect(new Set(WORDS.map((w) => w.en)).size).toBe(WORDS.length);
    for (const w of WORDS) expect(w.ua && w.emoji).toBeTruthy();
  });

  it('прогалини з діагностики є в словнику (water, house, happy, sun, run)', () => {
    for (const en of ['water', 'house', 'happy', 'sun', 'run']) expect(WORDS.some((w) => w.en === en)).toBe(true);
  });

  it('новий урок — 5 слів однієї теми, ще не бачених', () => {
    const lesson = newWords(emptyDict(), 'animals');
    expect(lesson).toHaveLength(NEW_PER_LESSON);
    expect(lesson.every((w) => w.topic === 'animals')).toBe(true);
    let d = emptyDict();
    for (const w of lesson) d = record(d, w.en, true, 0);
    expect(newWords(d, 'animals').some((w) => lesson.includes(w))).toBe(false);
  });
});

describe('english-words: інтервальний повтор', () => {
  it('правильно → завтра, потім +3, +7; після тижня слово «знаю»', () => {
    let d = emptyDict();
    const t0 = 1_000_000;
    d = record(d, 'cat', true, t0);
    expect(d.words.cat.due).toBe(t0 + DAY);
    d = record(d, 'cat', true, t0 + DAY);
    expect(d.words.cat.due).toBe(t0 + DAY + 3 * DAY);
    d = record(d, 'cat', true, t0);
    d = record(d, 'cat', true, t0);
    expect(d.words.cat.box).toBe(KNOWN_BOX);
    expect(statusOf(d.words.cat)).toBe('known');
  });

  it('помилка → повтор сьогодні, слово знову «вчу»', () => {
    let d = record(record(emptyDict(), 'dog', true, 0), 'dog', false, 5 * DAY);
    expect(d.words.dog.box).toBe(0);
    expect(dueWords(d, 5 * DAY).map((w) => w.en)).toContain('dog');
    expect(counts(d).learning).toBe(1);
  });

  it('до терміну слово в повтор не потрапляє', () => {
    const d = record(emptyDict(), 'sun', true, 0);
    expect(dueWords(d, DAY - 1)).toHaveLength(0);
    expect(dueWords(d, DAY)).toHaveLength(1);
  });
});

describe('english-words: питання', () => {
  it('відволікачі з тієї ж теми, без збігу картинки чи перекладу', () => {
    const red = WORDS.find((w) => w.en === 'red')!;
    const ds = distractors(red, WORDS, seeded(1));
    expect(ds).toHaveLength(3);
    for (const x of ds) {
      expect(x.topic).toBe('colors');
      expect(x.emoji).not.toBe(red.emoji);
    }
  });

  it('у кожному питанні правильне слово серед 4 варіантів; «Легко» — лише на слух', () => {
    const words = newWords(emptyDict(), 'food');
    for (const q of buildQuiz(words, 1, emptyDict(), seeded(2))) {
      expect(q.options).toHaveLength(4);
      expect(q.options.some((o) => o.en === q.word.en)).toBe(true);
      expect(q.mode).toBe('listen');
    }
  });

  it('власні слова потрапляють у словник і не дублюються', () => {
    let d = addCustom(emptyDict(), { en: 'homework', ua: 'домашнє завдання', emoji: '📝' });
    d = addCustom(d, { en: 'homework', ua: 'домашка', emoji: '📝' });
    d = addCustom(d, { en: 'cat', ua: 'кіт', emoji: '🐱' });
    expect(d.custom).toHaveLength(1);
    expect(counts(d).new).toBe(WORDS.length + 1);
  });
});
