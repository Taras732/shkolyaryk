import { describe, it, expect } from 'vitest';
import geo2, { generate } from './index';

describe('geo-2', () => {
  it('d1/d2: відповідь серед різних варіантів', () => {
    for (const d of [1, 2] as const) for (let i = 0; i < 50; i++) for (const r of generate(d).rounds) {
      const p = r.payload as { options: (string | number)[] };
      expect(p.options).toContain(r.answer);
      expect(new Set(p.options).size).toBe(p.options.length);
    }
  });
  it('d2: довжина ламаної = сума ланок', () => {
    for (let i = 0; i < 50; i++) for (const r of generate(2).rounds) {
      const p = r.payload as { lens: number[] };
      expect(r.answer).toBe(p.lens.reduce((a, b) => a + b, 0));
    }
  });
  it('d3: прямокутник зараховується в обох орієнтаціях, інший розмір — ні', () => {
    const r = generate(3).rounds[0];
    const p = r.payload as { w: number; h: number };
    expect(geo2.isCorrect!(r, `${p.w}x${p.h}`)).toBe(true);
    expect(geo2.isCorrect!(r, `${p.h}x${p.w}`)).toBe(true);
    expect(geo2.isCorrect!(r, `${p.w + 1}x${p.h}`)).toBe(false);
  });
});
