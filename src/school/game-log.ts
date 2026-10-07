/**
 * Журнал завершених ігор — для тижневого звіту батькам. Прогрес у сторі зберігає
 * лише останню спробу гри, а батькам треба бачити тиждень: скільки днів займались,
 * що грали, де помилялись. Локально, обрізаний до останніх MAX записів.
 */
export interface LogEntry {
  at: number;
  gameId: string;
  difficulty: number;
  mistakes: number;
  stars: number;
}

const MAX = 1000;
const keyFor = (profileId: string) => `shk.log.v1.${profileId}`;

export function readLog(profileId: string): LogEntry[] {
  try {
    const arr = JSON.parse(localStorage.getItem(keyFor(profileId)) ?? '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function logGame(profileId: string, entry: LogEntry): void {
  const arr = readLog(profileId);
  arr.push(entry);
  if (arr.length > MAX) arr.splice(0, arr.length - MAX);
  try {
    localStorage.setItem(keyFor(profileId), JSON.stringify(arr));
  } catch {
    // без пам'яті — звіт буде неповним, гра не страждає
  }
}

/** Локальна дата YYYY-MM-DD (не UTC: заняття о 00:30 за Києвом — це сьогодні, а не вчора). */
export function localDay(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export interface WeekSummary {
  /** Дні з заняттями з останніх 7 (включно з сьогодні), від найдавнішого. */
  days: { day: string; games: number }[];
  activeDays: number;
  games: number;
  mistakes: number;
  /** Ігри тижня: скільки разів і скільки помилок, найпроблемніші першими. */
  byGame: { gameId: string; count: number; mistakes: number }[];
}

export function weekSummary(log: LogEntry[], now: number): WeekSummary {
  const days: { day: string; games: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push({ day: localDay(d.getTime()), games: 0 });
  }
  const inWeek = new Set(days.map((d) => d.day));
  const week = log.filter((e) => inWeek.has(localDay(e.at)));
  for (const e of week) days.find((d) => d.day === localDay(e.at))!.games++;

  const by = new Map<string, { gameId: string; count: number; mistakes: number }>();
  for (const e of week) {
    const g = by.get(e.gameId) ?? { gameId: e.gameId, count: 0, mistakes: 0 };
    g.count++;
    g.mistakes += e.mistakes;
    by.set(e.gameId, g);
  }

  return {
    days,
    activeDays: days.filter((d) => d.games > 0).length,
    games: week.length,
    mistakes: week.reduce((s, e) => s + e.mistakes, 0),
    byGame: [...by.values()].sort((a, b) => b.mistakes / b.count - a.mistakes / a.count || b.count - a.count),
  };
}
