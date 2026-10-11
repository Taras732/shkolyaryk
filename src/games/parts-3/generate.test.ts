import { describe, it, expect } from 'vitest';
import { generate } from './index';
import type { Difficulty } from '../types';

// незалежні таблиці
const G: Record<string, string> = {
  стілець: 'чоловічий', зошит: 'чоловічий', кіт: 'чоловічий', дощ: 'чоловічий', учень: 'чоловічий', тато: 'чоловічий',
  книжка: 'жіночий', школа: 'жіночий', лампа: 'жіночий', мама: 'жіночий', ніч: 'жіночий',
  вікно: 'середній', море: 'середній', яблуко: 'середній', сонце: 'середній', місто: 'середній',
};
const PLURAL = new Set(['діти', 'друзі', 'квіти', 'зошити', 'олівці', 'мʼячі']);
const LIVING = new Set(['кіт', 'дівчинка', 'птах', 'хлопчик', 'риба', 'комаха']);
const CAPITAL = /^[А-ЯІЇЄҐ]/;
const NOUN_GN: Record<string, string> = {
  трава: '-а', книжка: '-а', хата: '-а', гора: '-а', вишня: '-а',
  лист: '-ий', день: '-ий', будинок: '-ий', стіл: '-ий', пиріг: '-ий',
  вікно: '-е', море: '-е', дерево: '-е', місто: '-е', сонце: '-е',
  діти: '-і', ліси: '-і', олівці: '-і', квіти: '-і', друзі: '-і',
};
const PRON: Record<string, string> = { Оля: 'вона', Максим: 'він', Діти: 'вони', Кошеня: 'воно', Мама: 'вона', Тато: 'він', Книжки: 'вони', Озеро: 'воно', Учителька: 'вона' };

describe('parts-3', () => {
  for (const d of [1, 2, 3] as Difficulty[]) {
    it(`d${d}: 5 раундів, відповідь серед унікальних варіантів, зміст вірний`, () => {
      for (let i = 0; i < 30; i++) {
        const rounds = generate(d).rounds;
        expect(rounds).toHaveLength(5);
        rounds.forEach((r, k) => expect(r.id).toBe(`r${k}`));
        for (const r of rounds) {
          const p = r.payload;
          expect(p.options).toContain(r.answer);
          expect(new Set(p.options).size).toBe(p.options.length);
          if (p.mode === 'gender') expect(r.answer).toBe(G[p.big!]);
          if (p.mode === 'number') expect(r.answer).toBe(PLURAL.has(p.big!) ? 'множина' : 'однина');
          if (p.mode === 'animate') expect(String(r.answer).startsWith(LIVING.has(p.big!) ? 'хто' : 'що')).toBe(true);
          if (p.mode === 'proper') expect(r.answer).toBe(CAPITAL.test(p.big!) ? 'власна' : 'загальна');
          if (p.mode === 'adj') {
            const noun = p.big!.split(' ')[1];
            expect(r.answer).toBe(NOUN_GN[noun]);
          }
          if (p.mode === 'pron') expect(r.answer).toBe(PRON[p.big!.split(' ')[0]]);
          if (p.mode === 'ne') expect(String(r.answer)).toMatch(/^не /);
          if (p.mode === 'tense') {
            const s = p.big!;
            const fut = /(буд|піду|поїдемо|читатиме)/.test(s);
            const past = !fut && /(читала|ходили|спав|ішов)/.test(s);
            expect(r.answer).toBe(fut ? 'майбутній' : past ? 'минулий' : 'теперішній');
          }
        }
      }
    });
  }
  it('d2: усі чотири закінчення трапляються в кожному наборі', () => {
    for (let i = 0; i < 30; i++) expect(new Set(generate(2).rounds.map((r) => r.answer)).size).toBe(4);
  });
});
