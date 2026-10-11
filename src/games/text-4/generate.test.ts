import { describe, it, expect } from 'vitest';
import text4, { generate, COMMAS, LINKS, STORIES, PLAN_AT, PLAN_SEP } from './index';

describe('text-4', () => {
  it('усі рівні: 5 раундів, відповідь серед унікальних варіантів / пунктів, є пояснення', () => {
    for (const d of [1, 2, 3] as const) for (let i = 0; i < 30; i++) {
      const rounds = generate(d).rounds;
      expect(rounds).toHaveLength(5);
      for (const r of rounds) {
        const p = r.payload as { mode: string; options?: string[]; parts?: string[] };
        if (p.mode === 'plan') {
          expect(p.parts!.length).toBe(4);
          expect(new Set(p.parts).size).toBe(4);
          expect([...p.parts!].sort()).toEqual(String(r.answer).split(PLAN_SEP).sort());
        } else {
          expect(p.options).toContain(r.answer);
          expect(new Set(p.options).size).toBe(p.options!.length);
          expect(p.options!.length).toBe(d === 3 ? 3 : 4);
        }
        expect(text4.explain!(r, 'x')!.steps.length).toBeGreaterThan(0);
        expect(text4.skillsFor!(d, 'grade4').length).toBeGreaterThan(0);
      }
    }
  });
  it('коми: правильний варіант за правилом, жоден дистрактор не збігається з ним', () => {
    for (const c of COMMAS) {
      expect(c.right).not.toMatch(/, (і|й|та) /);
      for (const m of c.right.matchAll(/ (а|але) /g)) expect(c.right[(m.index ?? 0) - 1]).toBe(',');
      for (const w of c.wrong) {
        expect(w).not.toBe(c.right);
        // той самий набір слів: відрізняється лише розстановкою ком
        expect(w.replace(/,/g, '')).toBe(c.right.replace(/,/g, ''));
      }
      expect(new Set(c.wrong).size).toBe(3);
    }
  });
  it('повтор: пропуск на початку 2-го речення, відповідь не збігається з дистракторами', () => {
    for (const l of LINKS) {
      expect(l.s2.startsWith('___')).toBe(true);
      expect(l.wrong).not.toContain(l.right);
      expect(new Set(l.wrong).size).toBe(3);
      expect(l.s1 + l.s2).not.toContain('undefined');
    }
  });
  it('тексти: 5–6 речень, план у порядку подій, відповіді різні', () => {
    expect(PLAN_AT.length).toBe(STORIES.length);
    STORIES.forEach((st, k) => {
      expect(st.s.length).toBeGreaterThanOrEqual(5);
      expect(st.s.length).toBeLessThanOrEqual(6);
      expect(st.plan.length).toBe(PLAN_AT[k].length);
      for (let i = 1; i < PLAN_AT[k].length; i++) expect(PLAN_AT[k][i]).toBeGreaterThan(PLAN_AT[k][i - 1]);
      expect(PLAN_AT[k][PLAN_AT[k].length - 1]).toBeLessThan(st.s.length);
      for (const g of [st.idea, st.hero, st.after]) expect(g.wrong).not.toContain(g.right);
    });
  });
});
