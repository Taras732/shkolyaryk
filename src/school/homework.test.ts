import { describe, it, expect } from 'vitest';
import { inDictionary, wordStatus } from './homework';
import { addCustom, emptyDict, record } from '@/games/english-words/core';

describe('homework: слова зі сторінки проти словника дитини', () => {
  it('нове / вчу / знаю — без урахування регістру і пробілів', () => {
    let d = record(emptyDict(), 'cat', true, 0);
    for (let i = 0; i < 4; i++) d = record(d, 'dog', true, 0);
    expect(wordStatus(d, ' Cat ')).toBe('learning');
    expect(wordStatus(d, 'dog')).toBe('known');
    expect(wordStatus(d, 'homework')).toBe('new');
  });

  it('додане слово потрапляє в словник і не дублюється', () => {
    let d = addCustom(emptyDict(), { en: 'homework', ua: 'домашнє завдання', emoji: '📝' });
    expect(inDictionary(d, 'Homework')).toBe(true);
    d = addCustom(d, { en: 'homework', ua: 'домашка', emoji: '📝' });
    expect(d.custom).toHaveLength(1);
  });
});
