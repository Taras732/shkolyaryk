import type { Difficulty } from '../types';
import { TEXTS, wordCount, type ReadingText } from './texts';

/**
 * «Читаю і розумію»: один текст за сесію → 3 питання. Окремо міряємо швидкість
 * (слів за хвилину) — батькам видно техніку читання в динаміці, без секундоміра поруч.
 */

export interface ReadResult {
  at: number;
  /** Слів за хвилину; null — дитина натиснула «прочитано» занадто швидко, щоб це було читанням. */
  wpm: number | null;
  correct: number;
  total: number;
}

export type ReadingLog = Record<string, ReadResult[]>;

/** Швидше за це — не читання, а прогортання (≈ 4 слова за секунду для 2–3 класу нереально). */
export const MAX_PLAUSIBLE_WPM = 240;

export function pickText(d: Difficulty, log: ReadingLog, rng: () => number = Math.random): ReadingText {
  const pool = TEXTS.filter((t) => t.level === d);
  const unread = pool.filter((t) => !log[t.id]);
  if (unread.length > 0) return unread[Math.floor(rng() * unread.length)];
  // усі прочитані — найдавніший, щоб повтор був рідким
  return [...pool].sort((a, b) => last(log[a.id]) - last(log[b.id]))[0];
}

const last = (r: ReadResult[] | undefined) => (r && r.length ? r[r.length - 1].at : 0);

export function wpm(text: string, ms: number): number | null {
  if (ms <= 0) return null;
  const v = Math.round(wordCount(text) / (ms / 60000));
  return v > MAX_PLAUSIBLE_WPM ? null : v;
}

export function addResult(log: ReadingLog, id: string, r: ReadResult): ReadingLog {
  return { ...log, [id]: [...(log[id] ?? []), r].slice(-10) };
}

/** Для звіту батькам: скільки текстів за період і середня швидкість (лише чесні виміри). */
export function readingSummary(log: ReadingLog, since: number): { texts: number; avgWpm: number | null; correct: number; total: number } {
  const all = Object.values(log).flat().filter((r) => r.at >= since);
  const speeds = all.map((r) => r.wpm).filter((v): v is number => v !== null);
  return {
    texts: all.length,
    avgWpm: speeds.length ? Math.round(speeds.reduce((s, v) => s + v, 0) / speeds.length) : null,
    correct: all.reduce((s, r) => s + r.correct, 0),
    total: all.reduce((s, r) => s + r.total, 0),
  };
}
