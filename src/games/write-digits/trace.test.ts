import { describe, it, expect } from 'vitest';
import { STROKES, advance, checkpoints } from './index';

// 11.10.2026: обведення по самому контуру зараховується; каракуля чи рух задом наперед — ні
const trace = (cps: [number, number][], path: [number, number][]) => path.reduce((n, p) => advance(cps, n, p), 0);

describe('write-digits', () => {
  it('рух по контуру (з тремтінням руки ±4) проходить кожен штрих кожної цифри', () => {
    for (const d of Object.keys(STROKES).map(Number)) for (const s of STROKES[d]) {
      const cps = checkpoints(s);
      const shaky = cps.map(([x, y], i) => [x + (i % 2 ? 4 : -4), y + (i % 3 ? 3 : -3)] as [number, number]);
      expect(trace(cps, shaky)).toBe(cps.length);
    }
  });
  it('рух задом наперед не зараховується', () => {
    const cps = checkpoints(STROKES[7][0]);
    expect(trace(cps, [...cps].reverse())).toBeLessThan(cps.length / 2);
  });
  it('каракуля в куті не зараховується', () => {
    const cps = checkpoints(STROKES[2][0]);
    const scribble = Array.from({ length: 40 }, (_, i) => [90 + (i % 5), 135 - (i % 7)] as [number, number]);
    expect(trace(cps, scribble)).toBeLessThan(3);
  });
});
