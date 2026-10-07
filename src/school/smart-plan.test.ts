import { describe, it, expect, beforeEach } from 'vitest';
import { POOLS, scoreGame, smartPlan, todaySmartPlan, type Signals } from './smart-plan';
import type { LogEntry } from './game-log';
import { gamesForClass } from '@/games/registry';
import { CLASS_LEVELS } from '@/games/types';

const NOW = new Date(2026, 9, 7, 16, 0).getTime();
const DAY = 24 * 60 * 60 * 1000;
const none: Signals = { weakFacts: 0, dueWords: 0, lettersInProgress: 0 };
const all = (cl: (typeof CLASS_LEVELS)[number]) => new Set(gamesForClass(cl).map((g) => g.id));
const e = (gameId: string, daysAgo: number, mistakes: number): LogEntry => ({ at: NOW - daysAgo * DAY, gameId, difficulty: 1, mistakes, stars: 2 });

const mem = new Map<string, string>();
beforeEach(() => {
  mem.clear();
  (globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
});

describe('smart-plan', () => {
  it('усі ігри з пулів існують і доступні своєму класу', () => {
    for (const cl of CLASS_LEVELS) for (const ids of Object.values(POOLS[cl])) for (const id of ids!) expect(all(cl).has(id), `${cl}: ${id}`).toBe(true);
  });

  it('по одному кроку з кожного предмета класу', () => {
    const plan = smartPlan('grade3', all('grade3'), [], none, NOW);
    expect(plan.map((p) => p.subject).sort()).toEqual(['english', 'language', 'math']);
  });

  it('плутає факти множення → у 3 класі математикою стає таблиця, і пояснення про це', () => {
    const plan = smartPlan('grade3', all('grade3'), [], { ...none, weakFacts: 4 }, NOW);
    const math = plan.find((p) => p.subject === 'math')!;
    expect(math.gameId).toBe('times-tables');
    expect(math.reason).toContain('4 факти');
  });

  it('є слова до повтору → англійською стають слова', () => {
    const plan = smartPlan('grade3', all('grade3'), [], { ...none, dueWords: 6 }, NOW);
    expect(plan.find((p) => p.subject === 'english')!.gameId).toBe('english-words');
  });

  it('гра з багатьма помилками випереджає гру без помилок', () => {
    const log = [e('uk-spelling', 1, 4), e('uk-spelling', 2, 5), e('uk-reading', 1, 0), e('grammar-parts', 1, 0)];
    expect(scoreGame('uk-spelling', log, none, NOW).score).toBeGreaterThan(scoreGame('uk-reading', log, none, NOW).score);
    expect(scoreGame('uk-spelling', log, none, NOW).reason).toContain('помилок');
  });

  it('план фіксується на день і перераховується наступного', () => {
    let calls = 0;
    const compute = () => (calls++, [{ gameId: `g${calls}`, subject: 'math' as const, reason: '' }]);
    expect(todaySmartPlan('k', compute, NOW)[0].gameId).toBe('g1');
    expect(todaySmartPlan('k', compute, NOW + 3600_000)[0].gameId).toBe('g1');
    expect(todaySmartPlan('k', compute, NOW + DAY)[0].gameId).toBe('g2');
  });

  it('дошкілля: букви, лічба і гра для розваги', () => {
    const plan = smartPlan('preschool', all('preschool'), [], { ...none, lettersInProgress: 2 }, NOW);
    expect(plan.find((p) => p.subject === 'language')!.gameId).toBe('uk-letters');
    expect(plan.some((p) => p.subject === 'fun')).toBe(true);
  });
});
