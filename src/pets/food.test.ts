import { describe, expect, it } from 'vitest';
import { earnedToday } from './food';

const at = (h: number, dayShift = 0) => new Date(2026, 9, 10 + dayShift, h).getTime();
const now = at(18);
const e = (gameId: string, ts: number) => ({ at: ts, gameId, difficulty: 1, mistakes: 0, stars: 3 });

describe('pet food', () => {
  it('one per plan step done today, capped at 3', () => {
    const log = [e('a', at(9)), e('a', at(10)), e('b', at(11)), e('c', at(12))];
    expect(earnedToday(log, ['a', 'b', 'c'], now)).toBe(3);
    expect(earnedToday([e('a', at(9)), e('a', at(10))], ['a', 'b', 'c'], now)).toBe(1);
  });
  it('one per two free games, capped at 2', () => {
    const free = ['x', 'y', 'z', 'w', 'v', 'u'].map((g, i) => e(g, at(9 + i)));
    expect(earnedToday(free.slice(0, 3), ['a'], now)).toBe(1);
    expect(earnedToday(free, ['a'], now)).toBe(2);
  });
  it('yesterday does not count', () => {
    expect(earnedToday([e('a', at(9, -1))], ['a'], now)).toBe(0);
  });
});
