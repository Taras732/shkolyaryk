import { describe, it, expect } from 'vitest';
import { SHAPE_GROUPS, emojiOf, generate, mirrored } from './generate';

const groupOf = (e: string) => SHAPE_GROUPS.find((g) => g.includes(e))!;

describe('find-shadow: схожі форми й дзеркало', () => {
  it('у кожному раунді правильна тінь рівно одна', () => {
    for (const d of [1, 2, 3] as const) {
      for (let k = 0; k < 20; k++) {
        for (const r of generate(d).rounds) {
          expect(r.payload.options.filter((o) => o === r.answer)).toHaveLength(1);
        }
      }
    }
  });

  it('«Легко» — інші варіанти з інших груп форм; «Середньо» — переважно зі своєї', () => {
    for (let k = 0; k < 20; k++) {
      for (const r of generate(1).rounds) {
        const g = groupOf(r.payload.target);
        for (const o of r.payload.options) if (o !== r.answer) expect(g).not.toContain(o);
      }
      for (const r of generate(2).rounds) {
        const g = groupOf(r.payload.target);
        const near = r.payload.options.filter((o) => o !== r.answer && g.includes(o)).length;
        expect(near).toBeGreaterThanOrEqual(Math.min(2, g.length - 1));
      }
    }
  });

  it('«Складно» — є дзеркальна тінь цілі, ціль несиметрична', () => {
    for (let k = 0; k < 20; k++) {
      for (const r of generate(3).rounds) {
        const m = r.payload.options.filter(mirrored);
        expect(m).toHaveLength(1);
        expect(emojiOf(m[0])).toBe(r.payload.target);
        expect(['⭐', '🍄', '🎈', '🍐', '🌵', '🦋', '👓', '🦀', '🐙']).not.toContain(r.payload.target);
      }
    }
  });
});
