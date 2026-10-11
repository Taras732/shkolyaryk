import { describe, it, expect } from 'vitest';
import { generate } from './index';
import type { Difficulty } from '../types';

const ALPHABET = 'абвгґдеєжзиіїйклмнопрстуфхцчшщьюя';
const MONTHS = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
// незалежний переклад дня в слова (окремо від ORD у грі)
const UNITS = ['', 'першого', 'другого', 'третього', 'четвертого', 'пʼятого', 'шостого', 'сьомого', 'восьмого', 'девʼятого'];
const TEENS: Record<number, string> = { 10: 'десятого', 11: 'одинадцятого', 12: 'дванадцятого', 13: 'тринадцятого', 14: 'чотирнадцятого', 15: 'пʼятнадцятого', 16: 'шістнадцятого', 17: 'сімнадцятого', 18: 'вісімнадцятого', 19: 'девʼятнадцятого' };
const dayWords = (n: number) => (n < 10 ? UNITS[n] : n < 20 ? TEENS[n] : n === 20 ? 'двадцятого' : n === 30 ? 'тридцятого' : `${n < 30 ? 'двадцять' : 'тридцять'} ${UNITS[n % 10]}`);
const SOUNDS_RE = (w: string) => w.replace(/дж|дз/g, 'Ж').replace(/[ь]/g, '').length;
const LETTERS = (w: string) => w.length;

describe('words-3', () => {
  for (const d of [1, 2, 3] as Difficulty[]) {
    it(`d${d}: 5 раундів, зміст вірний`, () => {
      for (let i = 0; i < 30; i++) {
        const rounds = generate(d).rounds;
        expect(rounds).toHaveLength(5);
        rounds.forEach((r, k) => expect(r.id).toBe(`r${k}`));
        for (const r of rounds) {
          const p = r.payload;
          if (p.mode === 'alpha') {
            expect(p.words.length).toBeGreaterThanOrEqual(7);
            expect(p.words.length).toBeLessThanOrEqual(9);
            expect(new Set(p.words.map((w) => w[0])).size).toBe(p.words.length);
            const byFirst = [...p.words].sort((a, b) => ALPHABET.indexOf(a[0]) - ALPHABET.indexOf(b[0]));
            expect(r.answer).toBe(byFirst.join(','));
            continue;
          }
          expect(p.options).toContain(r.answer);
          expect(new Set(p.options).size).toBe(p.options.length);
          if (p.mode === 'g') {
            const rest = p.big!.slice(1);
            expect(['ґудзик', 'ґанок', 'ґава', 'ґрунт', 'гора', 'голова', 'гриб', 'груша', 'герой', 'гілка'].includes(`${r.answer}${rest}`)).toBe(true);
          }
          if (p.mode === 'sounds') {
            const w = /«(.+?)»/.exec(p.q)![1];
            expect(r.answer).toBe(String(SOUNDS_RE(w)));
            expect(p.options).toContain(String(LETTERS(w)));
          }
          if (p.mode === 'date-num') {
            const m = /«(\S+(?: \S+)?) (\S+)»/.exec(p.q)!;
            const day = Number(String(r.answer).split(' ')[0]);
            expect(dayWords(day)).toBe(m[1]);
            expect(MONTHS).toContain(m[2]);
            expect(String(r.answer).endsWith(m[2])).toBe(true);
          }
          if (p.mode === 'date-word') {
            const m = /: (\d+) (\S+)\?/.exec(p.q)!;
            expect(r.answer).toBe(`${dayWords(Number(m[1]))} ${m[2]}`);
          }
        }
      }
    });
  }
  it('d3: 2 букви г/ґ, 1 звуки, 2 дати', () => {
    const m = generate(3).rounds.map((r) => r.payload.mode);
    expect(m.filter((x) => x === 'g')).toHaveLength(2);
    expect(m.filter((x) => x === 'sounds')).toHaveLength(1);
    expect(m.filter((x) => x.startsWith('date'))).toHaveLength(2);
  });
});
