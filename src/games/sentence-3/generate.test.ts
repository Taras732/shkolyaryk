import { describe, it, expect } from 'vitest';
import { generate } from './index';
import type { Difficulty } from '../types';

// незалежна таблиця: речення → [підмет, присудок]
const SP: Record<string, [string, string]> = {
  'Діти малюють сонце.': ['Діти', 'малюють'], 'Білка стрибає по гілках.': ['Білка', 'стрибає'], 'Мама пече смачний пиріг.': ['Мама', 'пече'],
  'Хлопчик читає цікаву книжку.': ['Хлопчик', 'читає'], 'Над лісом світить місяць.': ['місяць', 'світить'], 'Ми вирушили в похід.': ['Ми', 'вирушили'],
  'Під деревом спить кіт.': ['кіт', 'спить'], 'Вчителька розповідає казку.': ['Вчителька', 'розповідає'], 'Улітку цвітуть соняшники.': ['соняшники', 'цвітуть'],
  'Собака гавкає на кота.': ['Собака', 'гавкає'],
};
const VOC: Record<string, string> = {
  Мамо: 'Мамо', Оленко: 'Оленко', Іванку: 'Іванку', Друже: 'Друже', Бабусю: 'Бабусю', бабусю: 'бабусю', Ірино: 'Ірино',
};
const MARKERS = /(^|[\s,])(бо|тому|отже)([\s,.]|$)/iu;

describe('sentence-3', () => {
  for (const d of [1, 2, 3] as Difficulty[]) {
    it(`d${d}: 5 раундів, зміст вірний`, () => {
      for (let i = 0; i < 30; i++) {
        const rounds = generate(d).rounds;
        expect(rounds).toHaveLength(5);
        rounds.forEach((r, k) => expect(r.id).toBe(`r${k}`));
        for (const r of rounds) {
          const p = r.payload;
          if (p.mode === 'plan') {
            expect(p.parts).toHaveLength(3);
            expect(new Set(p.parts).size).toBe(3);
            const order = r.answer.split('|');
            expect([...order].sort()).toEqual([...p.parts].sort());
            continue;
          }
          expect(p.options).toContain(r.answer);
          expect(new Set(p.options).size).toBe(p.options.length);
          if (p.mode === 'subject') expect(r.answer).toBe(SP[p.big!][0]);
          if (p.mode === 'predicate') expect(r.answer).toBe(SP[p.big!][1]);
          if (p.mode === 'secondary') {
            const w = p.big!.replace('.', '').split(' ');
            expect(w).toHaveLength(3);
            expect(p.options).toHaveLength(3);
            // другорядний — не перший-присудок/підмет: у таблиці підмети-присудки відомі як дієслово у середині
            expect(r.answer).not.toBe(w[1]);
          }
          if (p.mode === 'comma') {
            const a = String(r.answer);
            expect(a.split(',').length).toBe(2);
            const voc = Object.keys(VOC).find((v) => a.startsWith(`${v},`) || a.includes(`, ${v}`));
            expect(voc).toBeDefined();
            for (const o of p.options) if (o !== a) expect(o).not.toBe(a);
          }
          if (p.mode === 'type') {
            const marked = MARKERS.test(p.text!);
            expect(r.answer === 'міркування').toBe(marked);
          }
        }
      }
    });
  }
  it('d3 має і тексти, і плани', () => {
    const m = generate(3).rounds.map((r) => r.payload.mode);
    expect(m.filter((x) => x === 'plan')).toHaveLength(2);
    expect(m.filter((x) => x === 'type')).toHaveLength(3);
  });
});
