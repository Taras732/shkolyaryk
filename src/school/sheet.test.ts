import { describe, it, expect } from 'vitest';
import { buildSheet } from './sheet';
import { emptyDict, record } from '@/games/english-words/core';
import { recordAnswer } from '@/games/times-tables/core';

describe('аркуш на завтра', () => {
  it('3 клас: факти, які плутає, ідуть першими, кожен двічі; відповіді правильні', () => {
    const facts = recordAnswer({}, '7x8', false, 1);
    const s = buildSheet({ cl: 'grade3', difficulty: 2, facts, dict: emptyDict(), letters: {} });
    expect(s[0].title).toContain('плутаєш');
    expect(s[0].items).toEqual([
      { task: '7 × 8 = ____', answer: '56' },
      { task: '8 × 7 = ____', answer: '56' },
    ]);
    const ex = s.find((x) => x.title === 'Приклади')!;
    for (const it of ex.items) {
      const [a, op, b] = it.task.split(' ');
      const v = op === '+' ? +a + +b : op === '−' ? +a - +b : op === '×' ? +a * +b : +a / +b;
      expect(String(v)).toBe(it.answer);
    }
  });

  it('англійська — лише слова, які вчить; без них розділу немає', () => {
    expect(buildSheet({ cl: 'grade3', difficulty: 1, facts: {}, dict: emptyDict(), letters: {} }).some((x) => x.title.startsWith('English'))).toBe(false);
    const dict = record(emptyDict(), 'cat', true, 0);
    const en = buildSheet({ cl: 'grade3', difficulty: 1, facts: {}, dict, letters: {} }).find((x) => x.title.startsWith('English'))!;
    expect(en.items).toEqual([{ task: 'cat — ____________', answer: 'кіт' }]);
  });

  it('дошкілля: букви для обведення і лічба, без прикладів', () => {
    const s = buildSheet({ cl: 'preschool', difficulty: 1, facts: {}, dict: emptyDict(), letters: { А: { streak: 3, ok: 3, bad: 0, last: 0 } } });
    expect(s[0].trace).toEqual(['А']);
    expect(s.some((x) => x.title === 'Приклади')).toBe(false);
  });

  it('1 клас: без стовпчика і правопису', () => {
    const titles = buildSheet({ cl: 'grade1', difficulty: 1, facts: {}, dict: emptyDict(), letters: {} }).map((x) => x.title);
    expect(titles).not.toContain('Обчисли стовпчиком');
    expect(titles).not.toContain('Підкресли, як правильно');
  });
});
