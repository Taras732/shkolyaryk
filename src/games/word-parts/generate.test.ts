import { describe, it, expect } from 'vitest';
import { generate } from './index';
import type { ClassLevel, Difficulty } from '../types';

// незалежна таблиця розборів: слово → частина → роль
const PARSE: Record<string, Record<string, string>> = {
  пришкільний: { при: 'префікс', шкіль: 'корінь', н: 'суфікс', ий: 'закінчення' },
  безхмарний: { без: 'префікс', хмар: 'корінь', н: 'суфікс', ий: 'закінчення' },
  приморський: { при: 'префікс', мор: 'корінь', ськ: 'суфікс', ий: 'закінчення' },
  записка: { за: 'префікс', пис: 'корінь', к: 'суфікс', а: 'закінчення' },
  лісовий: { ліс: 'корінь', ов: 'суфікс', ий: 'закінчення' },
  зелений: { зелен: 'корінь', ий: 'закінчення' },
  гарна: { гарн: 'корінь', а: 'закінчення' },
  книжка: { книж: 'корінь', к: 'суфікс', а: 'закінчення' },
  водний: { вод: 'корінь', н: 'суфікс', ий: 'закінчення' },
  мама: { мам: 'корінь', а: 'закінчення' },
};
const RELATED: Record<string, string> = { ліс: 'лісник', сніг: 'сніжинка', хліб: 'хлібний', школа: 'школяр', море: 'моряк', сад: 'садівник', зима: 'зимовий', квітка: 'квітник' };
const ROOT: Record<string, string> = { лісник: 'ліс', школяр: 'школ', хлібний: 'хліб', зимовий: 'зим', листок: 'лист', дощик: 'дощ' };

describe('word-parts', () => {
  for (const cls of ['grade3', 'grade4'] as ClassLevel[]) for (const d of [1, 2, 3] as Difficulty[]) {
    it(`${cls} d${d}: 5 раундів, відповідь серед унікальних варіантів, зміст вірний`, () => {
      for (let i = 0; i < 30; i++) {
        const rounds = generate(d, 'L3', cls).rounds;
        expect(rounds).toHaveLength(5);
        rounds.forEach((r, k) => expect(r.id).toBe(`r${k}`));
        for (const r of rounds) {
          const p = r.payload;
          expect(p.options).toContain(r.answer);
          expect(new Set(p.options).size).toBe(p.options.length);
          expect(p.options.length).toBeGreaterThanOrEqual(2);
          if (p.mode === 'parts') {
            const word = p.segs!.map((s) => s.t).join('');
            const hi = p.segs!.filter((s) => s.hi);
            expect(hi).toHaveLength(1);
            expect(PARSE[word][hi[0].t]).toBe(r.answer);
          }
          if (p.mode === 'related') {
            const w = Object.keys(RELATED).find((k) => p.q.includes(`«${k}»`))!;
            expect(r.answer).toBe(RELATED[w]);
          }
          if (p.mode === 'root') {
            const w = Object.keys(ROOT).find((k) => p.q.includes(`«${k}»`))!;
            expect(r.answer).toBe(ROOT[w]);
          }
          if (p.mode === 'zs') {
            const rest = p.big!.slice(1);
            expect(r.answer).toBe(/^[кптфх]/.test(rest) ? 'с' : 'з');
          }
          if (p.mode === 'spell') {
            expect(String(r.answer)).toMatch(/^(роз|без)/);
          }
          if (p.mode === 'prepri') {
            expect(r.answer).toBe(p.q.includes('дуже') ? 'е' : 'и');
          }
          if (p.mode === 'suffix') {
            const base = /«(.+?)»/.exec(p.q)![1];
            const a = String(r.answer);
            if (base === 'Прага') expect(a.endsWith('зький')).toBe(true);
            else if (/[кчц]$|ць$/.test(base) && base !== 'Львів') expect(a.endsWith('цький')).toBe(true);
            else expect(a.endsWith('ський')).toBe(true);
          }
        }
      }
    });
  }
  it('grade3 d3 містить і з-/с-, і роз-/без-', () => {
    const modes = new Set(generate(3, 'L3', 'grade3').rounds.map((r) => r.payload.mode));
    expect(modes.has('zs')).toBe(true);
    expect(modes.has('spell')).toBe(true);
  });
});
