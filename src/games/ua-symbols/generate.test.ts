import { describe, it, expect } from 'vitest';
import uaSymbols from './index';
import type { Difficulty, ProfileLevel } from '../types';

const LEVELS: ProfileLevel[] = ['L0', 'L3'];
const DIFFS: Difficulty[] = [1, 2, 3];

describe('ua-symbols — Q23: жодного хибного емодзі', () => {
  it('емодзі трапляються лише для символів, які вони справді зображають', () => {
    // 👕 як «Вишиванка», 🥚 як «Писанка», 🍒 як «Калина», 🐦 як «Соловей»,
    // 🎵 як «Гімн», 🔱 як герб — прибрані; дитина не могла їх упізнати.
    const ALLOWED: Record<string, string> = { '🌻': 'Соняшник', '🇺🇦': 'Прапор України' };
    for (const level of LEVELS) {
      for (const d of DIFFS) {
        for (let i = 0; i < 40; i++) {
          for (const r of uaSymbols.generate(d, level).rounds) {
            const emoji = r.payload.emoji;
            if (!emoji) continue;
            expect(Object.keys(ALLOWED), `невідомий емодзі ${emoji}`).toContain(emoji);
            expect(r.answer, `${emoji} підписано як «${r.answer}»`).toBe(ALLOWED[emoji]);
          }
        }
      }
    }
  });
});

describe('ua-symbols — раунди не повторюються в межах спроби', () => {
  it('питання/символ у спробі унікальні', () => {
    for (const level of LEVELS) {
      for (const d of DIFFS) {
        for (let i = 0; i < 40; i++) {
          const { rounds } = uaSymbols.generate(d, level);
          // дошкільні раунди («Знайди…») несуть ціль у target
          const keys = rounds.map((r) => `${r.payload.question}|${r.payload.emoji ?? ''}|${(r.payload as { target?: string }).target ?? ''}`);
          expect(new Set(keys).size, `повтор у ${level}/d${d}: ${keys}`).toBe(keys.length);
        }
      }
    }
  });

  it('варіанти в раунді унікальні, правильна відповідь серед них', () => {
    for (const level of LEVELS) {
      for (const d of DIFFS) {
        for (let i = 0; i < 40; i++) {
          for (const r of uaSymbols.generate(d, level).rounds) {
            // дошкільна хатинка-подарунки — дошка без варіантів (10.10)
            if ((r.payload as { gifts?: boolean }).gifts) continue;
            const opts = r.payload.options;
            expect(new Set(opts).size, `дублі варіантів: ${opts}`).toBe(opts.length);
            expect(opts).toContain(r.answer);
          }
        }
      }
    }
  });

  it('раунди генеруються (гра не порожня) на всіх рівнях', () => {
    for (const level of LEVELS) {
      for (const d of DIFFS) {
        expect(uaSymbols.generate(d, level).rounds.length).toBeGreaterThan(0);
      }
    }
  });
});
