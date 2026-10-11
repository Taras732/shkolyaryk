import { describe, it, expect } from 'vitest';
import words4, { generate, WORD_POOLS, NUMERALS, TIMES, DEGREES, PHRASES_UK } from './index';
import { ALPHABET } from '../alpha-hyphen';

const key = (w: string) => [...w].map((c) => String.fromCharCode(65 + ALPHABET.indexOf(c))).join('');

describe('words-4', () => {
  it('усі рівні: 5 раундів, відповідь серед унікальних варіантів, є пояснення', () => {
    for (const d of [1, 2, 3] as const) for (let i = 0; i < 30; i++) {
      const rounds = generate(d).rounds;
      expect(rounds).toHaveLength(5);
      for (const r of rounds) {
        const p = r.payload as { mode: string; options?: string[]; words?: string[] };
        if (p.mode === 'alpha') {
          expect(p.words!.length).toBeGreaterThanOrEqual(10);
          expect(p.words!.length).toBeLessThanOrEqual(12);
          expect(new Set(p.words).size).toBe(p.words!.length);
          expect(new Set(p.words!.map((w) => w[0])).size).toBeLessThan(p.words!.length);
          // незалежна перевірка порядку: ключ з індексів літер, лексикографічно
          const exp = [...p.words!].sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0)).join(' ');
          expect(r.answer).toBe(exp);
        } else {
          expect(p.options).toContain(r.answer);
          expect(new Set(p.options).size).toBe(p.options!.length);
        }
        expect(words4.explain!(r, 'x')!.steps.length).toBeGreaterThan(0);
        expect(words4.skillsFor!(d, 'grade4').length).toBeGreaterThan(0);
      }
    }
  });
  it('алфавіт: усі літери слів є в алфавіті', () => {
    for (const pool of WORD_POOLS) for (const w of pool) for (const c of w) expect(ALPHABET.indexOf(c)).toBeGreaterThanOrEqual(0);
  });
  it('фразеологізми: значення унікальні', () => {
    expect(new Set(PHRASES_UK.map((x) => x.m)).size).toBe(PHRASES_UK.length);
  });
  it('числівники: питання скільки?/котрий? за закінченням', () => {
    for (const n of NUMERALS) {
      const ord = /(ий|ому|ою|е|а)$/.test(n.w) && !/(сім|тринадцять|двадцять|два)$/.test(n.w);
      expect(n.a).toBe(ord ? 'порядковий' : 'кількісний');
      expect(n.s).toContain(n.w);
    }
  });
  it('час: пів на N = N-1:30, за чверть N = N-1:45', () => {
    const num: Record<string, number> = { третю: 3, пʼята: 5, шосту: 6, 'девʼята': 9, десяту: 10 };
    for (const t of TIMES) {
      const word = t.t.split(' ').pop()!;
      const n = num[word];
      expect(n).toBeDefined();
      const exp = t.t.includes('пів на') ? `${n - 1}:30` : `${n - 1}:45`;
      expect(t.a).toBe(exp);
      expect(t.wrong).not.toContain(t.a);
    }
  });
  it('ступені: у рядку з «най-» правильна форма; дистрактори не збігаються', () => {
    for (const d of DEGREES) {
      expect(d.wrong).not.toContain(d.a);
      if (d.s.endsWith('___')) expect(d.a.startsWith('най')).toBe(true);
      if (d.s.includes('(')) expect(d.a.startsWith('най')).toBe(false);
    }
  });
});
