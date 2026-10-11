import { describe, it, expect } from 'vitest';
import { generate } from './index';
import type { Difficulty } from '../types';

const GENRE_OF_PREFIX: [RegExp, string][] = [
  [/^ОЛЯ\.|^ЛИС\./, 'пʼєса'],
  [/Хто задирає|Хто влітку ліниться/, 'байка'],
  [/Місяць гойдається|Дощик по віконцю/, 'вірш'],
  [/чарівн/, 'казка'],
  [/Максим довго|Софійка забула/, 'оповідання'],
];
const VOW = 'аеиіоуєюяї';

describe('reading-3', () => {
  for (const d of [1, 2, 3] as Difficulty[]) {
    it(`d${d}: 5 раундів, відповідь серед унікальних варіантів, зміст вірний`, () => {
      for (let i = 0; i < 30; i++) {
        const rounds = generate(d).rounds;
        expect(rounds).toHaveLength(5);
        rounds.forEach((r, k) => expect(r.id).toBe(`r${k}`));
        expect(new Set(rounds.map((r) => r.payload.q + (r.payload.text ?? r.payload.big))).size).toBe(5);
        for (const r of rounds) {
          const p = r.payload;
          expect(p.options).toContain(r.answer);
          expect(new Set(p.options).size).toBe(p.options.length);
          expect(p.options.length).toBeGreaterThanOrEqual(3);
          if (p.mode === 'genre') expect(GENRE_OF_PREFIX.find(([re]) => re.test(p.text!))![1]).toBe(r.answer);
          if (p.mode === 'text') {
            expect(p.text).toContain(String(r.answer));
            for (const o of p.options) expect(p.text).toContain(o);
          }
          if (p.mode === 'intonation') {
            const end = p.big!.slice(-1);
            expect(r.answer).toBe(end === '?' ? 'питальна' : end === '!' ? 'оклична' : 'розповідна');
          }
          if (p.mode === 'pause') {
            const s = p.big!;
            const before = s.split(',')[0].split(' ').pop();
            expect(r.answer).toBe(before);
          }
          if (p.mode === 'stress') {
            expect(p.big!).toContain(String(r.answer));
            const w = p.big!;
            const vs = [...w].filter((c) => VOW.includes(c));
            expect(new Set(vs).size).toBe(vs.length);
          }
        }
      }
    });
  }
});
