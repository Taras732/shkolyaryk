import { describe, it, expect, beforeEach } from 'vitest';
import { MAX_STEPS, defaultPlan, loadPlan, moveStep, savePlan } from './family-plan';
import { localDay, weekSummary, type LogEntry } from './game-log';

const mem = new Map<string, string>();
beforeEach(() => {
  mem.clear();
  (globalThis as any).localStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, v),
  };
});

describe('family-plan', () => {
  it('без налаштування — типовий план класу', () => {
    expect(loadPlan('p1', 'grade3')).toEqual(defaultPlan('grade3'));
  });

  it('збережений план і таблиця читаються назад; зайві кроки обрізаються', () => {
    savePlan('p1', { mode: 'manual', steps: ['times-tables', 'english-words'], ttTable: 7 });
    expect(loadPlan('p1', 'grade3')).toEqual({ mode: 'manual', steps: ['times-tables', 'english-words'], ttTable: 7 });
    savePlan('p2', { mode: 'manual', steps: ['a', 'b', 'c', 'd', 'e', 'f', 'g'], ttTable: null });
    expect(loadPlan('p2', 'grade3').steps).toHaveLength(MAX_STEPS);
  });

  it('без налаштування — розумний режим; старий збережений план без режиму — ручний', () => {
    expect(loadPlan('new', 'grade2').mode).toBe('auto');
    mem.set('shk.plan.v1.old', JSON.stringify({ steps: ['times-tables'], ttTable: null }));
    expect(loadPlan('old', 'grade3').mode).toBe('manual');
  });

  it('биті дані — типовий план, не падіння', () => {
    mem.set('shk.plan.v1.p3', '{oops');
    expect(loadPlan('p3', 'grade2')).toEqual(defaultPlan('grade2'));
  });

  it('переставляння кроків не виходить за межі', () => {
    expect(moveStep(['a', 'b', 'c'], 0, -1)).toEqual(['a', 'b', 'c']);
    expect(moveStep(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
  });
});

describe('game-log: тиждень', () => {
  const NOW = new Date(2026, 9, 7, 18, 0).getTime();
  const DAY = 24 * 60 * 60 * 1000;
  const e = (daysAgo: number, gameId: string, mistakes: number): LogEntry => ({ at: NOW - daysAgo * DAY, gameId, difficulty: 1, mistakes, stars: 2 });

  it('рахує лише останні 7 днів, дні — локальні', () => {
    const w = weekSummary([e(0, 'times-tables', 2), e(0, 'word-problems', 0), e(2, 'times-tables', 3), e(8, 'times-tables', 9)], NOW);
    expect(w.days).toHaveLength(7);
    expect(w.days[6].day).toBe(localDay(NOW));
    expect(w.activeDays).toBe(2);
    expect(w.games).toBe(3);
    expect(w.mistakes).toBe(5);
    expect(w.byGame[0]).toEqual({ gameId: 'times-tables', count: 2, mistakes: 5 });
  });

  it('заняття о 00:30 — того ж дня, а не вчора (UTC зсув)', () => {
    const lateNight = new Date(2026, 9, 7, 0, 30).getTime();
    expect(localDay(lateNight)).toBe('2026-10-07');
  });
});
