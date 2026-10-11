import { describe, it, expect } from 'vitest';
import verbs4, { generate, VERBS, REFL, SUBJECTS, ADVERBS } from './index';

describe('verbs-4', () => {
  it('усі рівні: 5 раундів, відповідь серед унікальних варіантів, є пояснення', () => {
    for (const d of [1, 2, 3] as const) for (let i = 0; i < 30; i++) {
      const rounds = generate(d).rounds;
      expect(rounds).toHaveLength(5);
      for (const r of rounds) {
        const p = r.payload as { options: string[] };
        expect(p.options).toContain(r.answer);
        expect(p.options.length).toBe(4);
        expect(new Set(p.options).size).toBe(4);
        expect(verbs4.explain!(r, 'x')!.steps.length).toBeGreaterThan(0);
        expect(verbs4.skillsFor!(d, 'grade4').length).toBeGreaterThan(0);
      }
    }
  });
  it('особа і число: незалежна перевірка за займенником', () => {
    const map: Record<string, string> = { я: '1 особа, однина', ти: '2 особа, однина', він: '3 особа, однина', вона: '3 особа, однина', ми: '1 особа, множина', ви: '2 особа, множина', вони: '3 особа, множина' };
    for (const v of VERBS) {
      expect(map[v.pron]).toBe(v.a);
      expect(v.s).toContain(v.v);
    }
  });
  it('-ться/-шся/-юся: закінчення відповідає особі в реченні', () => {
    for (const x of REFL) {
      const first = x.s.split(' ')[0];
      if (first === 'Ти') expect(x.right).toMatch(/шся$/);
      else if (first === 'Я') expect(x.right).toMatch(/(юся|уся)$/);
      else if (first === 'Ми') expect(x.right).toMatch(/мося$/);
      else expect(x.right).toMatch(/(ться|ються|яться)$/);
      expect(x.wrong).not.toContain(x.right);
    }
  });
  it('займенник: збігається з родом/числом підмета', () => {
    for (const x of SUBJECTS) {
      expect(x.s.startsWith(x.subj)).toBe(true);
      if (x.a === 'вони') expect(x.subj).toMatch(/( і |^Діти$)/);
    }
  });
  it('прислівник: відповідь — слово з речення й серед чотирьох варіантів', () => {
    for (const x of ADVERBS) {
      expect(x.options).toContain(x.a);
      for (const o of x.options) expect(x.s.toLowerCase()).toContain(o);
      expect(new Set(x.options).size).toBe(4);
    }
  });
});
