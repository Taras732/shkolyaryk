import { describe, it, expect } from 'vitest';
import { AFTER_SCHOOL_PLAN, buildDayReport, isSameDay } from './after-school';
import { CLASS_LEVELS } from '@/games/types';
import { getGame, gamesForClass } from '@/games/registry';
import { emptyDict, record } from '@/games/english-words/core';
import { recordAnswer } from '@/games/times-tables/core';

const NOW = new Date(2026, 9, 7, 16, 0).getTime();
const YESTERDAY = NOW - 24 * 60 * 60 * 1000;

describe('after-school: план', () => {
  it('кожен крок — існуюча гра, доступна дитині цього класу', () => {
    for (const cl of CLASS_LEVELS) {
      const ids = gamesForClass(cl).map((g) => g.id);
      for (const id of AFTER_SCHOOL_PLAN[cl]) {
        expect(getGame(id), id).toBeDefined();
        expect(ids, `${cl}: ${id}`).toContain(id);
      }
    }
  });
});

describe('after-school: звіт дня', () => {
  it('рахує лише сьогоднішнє', () => {
    let dict = record(emptyDict(), 'cat', true, NOW);
    dict = record(dict, 'dog', true, YESTERDAY);
    let facts = recordAnswer({}, '7x8', false, NOW);
    facts = recordAnswer(facts, '6x7', true, NOW);
    const r = buildDayReport(
      {
        'times-tables': { at: new Date(NOW).toISOString(), difficulty: 1, mistakes: 1 },
        'word-problems': { at: new Date(YESTERDAY).toISOString(), difficulty: 2, mistakes: 0 },
      },
      dict,
      facts,
      NOW,
    );
    expect(r.games.map((g) => g.gameId)).toEqual(['times-tables']);
    expect(r.english).toEqual({ practiced: 1, added: 1, known: 0 });
    expect(r.tables.practiced).toBe(2);
    expect(r.tables.shaky).toEqual(['7×8']);
  });

  it('isSameDay — календарний день, а не 24 години', () => {
    expect(isSameDay(new Date(2026, 9, 7, 0, 5).getTime(), NOW)).toBe(true);
    expect(isSameDay(new Date(2026, 9, 6, 23, 55).getTime(), NOW)).toBe(false);
    expect(isSameDay(undefined, NOW)).toBe(false);
  });
});
