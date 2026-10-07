import type { ClassLevel } from '@/games/types';
import type { FactStats } from '@/games/times-tables/core';
import { isKnown } from '@/games/times-tables/core';
import type { Dict } from '@/games/english-words/core';
import { statusOf } from '@/games/english-words/core';

/**
 * «Після школи» — 15 хвилин, одна точка входу для дитини (аудит 07.10).
 *
 * Свідомо локально і без БД: «План дня» залежить від Supabase і засіяного графу
 * навичок, а тут потрібен режим, що працює одразу, для гостя й офлайн. Три кроки
 * під клас, націлені туди, де діти буксують: таблиця множення (3 кл), віднімання
 * стовпчиком (2 кл), текстові задачі з вибором дії, англійські слова.
 */
export const AFTER_SCHOOL_PLAN: Record<ClassLevel, string[]> = {
  // дошкілля: буквар (Марія — букви з нуля) і злиття складів (Дарина), потім лічба
  preschool: ['uk-letters', 'uk-syllables', 'counting'],
  grade1: ['math-examples', 'word-problems', 'english-words'],
  grade2: ['column-arithmetic', 'word-problems', 'english-words'],
  grade3: ['times-tables', 'word-problems', 'english-words'],
  grade4: ['times-tables', 'word-problems', 'english-words'],
};

export function isSameDay(ts: number | string | undefined, now: number): boolean {
  if (ts === undefined) return false;
  const a = new Date(ts);
  const b = new Date(now);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Остання спроба гри (GameShell пише history = { at, difficulty, mistakes } на кожне завершення). */
export interface LastAttempt {
  at?: string;
  difficulty?: number;
  mistakes?: number;
}

export interface DayReport {
  games: { gameId: string; difficulty?: number; mistakes?: number }[];
  english: { practiced: number; added: number; known: number };
  tables: { practiced: number; known: number; shaky: string[] };
}

export function buildDayReport(
  attempts: Record<string, LastAttempt | undefined>,
  dict: Dict,
  facts: FactStats,
  now: number,
): DayReport {
  const games = Object.entries(attempts)
    .filter(([, a]) => a && isSameDay(a.at, now))
    .map(([gameId, a]) => ({ gameId, difficulty: a!.difficulty, mistakes: a!.mistakes }));

  const words = Object.values(dict.words);
  const english = {
    practiced: words.filter((w) => isSameDay(w.last, now)).length,
    added: words.filter((w) => isSameDay(w.added, now)).length,
    known: words.filter((w) => statusOf(w) === 'known').length,
  };

  const today = Object.entries(facts).filter(([, s]) => isSameDay(s.last, now));
  const tables = {
    practiced: today.length,
    known: Object.values(facts).filter((s) => isKnown(s)).length,
    // факти, на яких сьогодні була помилка і серія ще не відновилась — те, що батькам варто знати
    shaky: today.filter(([, s]) => s.streak === 0).map(([k]) => k.replace('x', '×')),
  };

  return { games, english, tables };
}
