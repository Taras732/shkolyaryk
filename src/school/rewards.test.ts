import { describe, it, expect } from 'vitest';
import { STICKERS, claimGoal, completeDay, emptyRewards, goalProgress, setGoal, streak } from './rewards';

const DAY = 24 * 60 * 60 * 1000;
const T = new Date(2026, 9, 7, 17, 0).getTime();

describe('rewards', () => {
  it('день зараховується раз, наліпка нова', () => {
    const a = completeDay(emptyRewards(), T, () => 0);
    expect(a.sticker).toBe(STICKERS[0]);
    const b = completeDay(a.rewards, T + 1000, () => 0);
    expect(b.sticker).toBeNull();
    const c = completeDay(a.rewards, T + DAY, () => 0);
    expect(c.sticker).not.toBe(STICKERS[0]);
    expect(c.rewards.stickers).toHaveLength(2);
  });

  it('серія: вчорашня серія живе, поки сьогодні ще не зроблено; пропуск рве серію', () => {
    let r = emptyRewards();
    for (const d of [3, 2, 1]) r = completeDay(r, T - d * DAY).rewards;
    expect(streak(r, T)).toBe(3);
    r = completeDay(r, T).rewards;
    expect(streak(r, T)).toBe(4);
    expect(streak(r, T + 2 * DAY)).toBe(0);
  });

  it('ціль рахує дні з постановки, не поспіль; після видачі — знову з нуля', () => {
    let r = setGoal(emptyRewards(), 'кіно', 3, T - 5 * DAY);
    for (const d of [5, 3, 1]) r = completeDay(r, T - d * DAY).rewards;
    expect(goalProgress(r)).toEqual({ done: 3, need: 3, reached: true });
    r = claimGoal(r, T);
    expect(r.claimed).toBe(1);
    expect(goalProgress(r)).toEqual({ done: 0, need: 3, reached: false });
  });

  it('порожній текст — ціль знімається', () => {
    expect(setGoal(setGoal(emptyRewards(), 'кіно', 5, T), '  ', 5, T).goal).toBeNull();
  });
});
