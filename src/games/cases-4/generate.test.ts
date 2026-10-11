import { describe, it, expect } from 'vitest';
import cases4, { generate, NOUNS, INSTR, ALT, ADJS } from './index';

describe('cases-4', () => {
  it('усі рівні: 5 раундів, відповідь серед унікальних варіантів, є пояснення', () => {
    for (const d of [1, 2, 3] as const) for (let i = 0; i < 30; i++) {
      const rounds = generate(d).rounds;
      expect(rounds).toHaveLength(5);
      for (const r of rounds) {
        const p = r.payload as { options: string[]; s: string };
        expect(p.options).toContain(r.answer);
        expect(p.options.length).toBe(4);
        expect(new Set(p.options).size).toBe(4);
        expect(p.s).toContain('___');
        expect(cases4.explain!(r, 'x')!.steps.length).toBeGreaterThan(0);
        expect(cases4.skillsFor!(d, 'grade4').length).toBeGreaterThan(0);
      }
    }
  });
  it('дані: правильна форма не збігається з жодним дистрактором', () => {
    for (const it of [...NOUNS, ...INSTR, ...ALT, ...ADJS]) expect(it.wrong).not.toContain(it.right);
  });
  it('орудний відмінок: закінчення -ою/-ею/-ом/-ем/-ям', () => {
    for (const it of INSTR) expect(it.right).toMatch(/(ою|ею|ям|ом|ем|єм)$/);
  });
  it('чергування: у формі стоїть з/ц/с перед -і, а в слові був г/к/х', () => {
    const map: Record<string, string> = { г: 'з', к: 'ц', х: 'с' };
    for (const it of ALT) {
      const stem = it.w.slice(0, -1);
      const last = stem[stem.length - 1];
      expect(it.right).toBe(stem.slice(0, -1) + map[last] + 'і');
    }
  });
  it('прикметник d3: закінчення відповідає роду/відмінку іменника в реченні', () => {
    const ends: Record<string, RegExp> = {
      'бачу що?': /е$/, 'у чому?': /ому$/, 'читаю що?': /у$/, 'пʼю що?': /у$/, 'з ким?': /(им|ою)$/,
      'кому?': /ій$/, 'біля чого?': /ого$/, 'на чому?': /ій$/,
    };
    for (const it of ADJS) expect(it.right).toMatch(ends[it.nounQ!]);
  });
});
