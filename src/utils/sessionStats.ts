import type { SessionLog } from '../stores/progressStore';

/** Початок доби (00:00 локального часу) для заданого timestamp. */
export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

const DAY_MS = 24 * 60 * 60 * 1000;

function minutes(ms: number): number {
  return Math.round(ms / 60000);
}

/** Сумарний час (хв) за добу, в яку потрапляє dayTs. */
export function dayMinutes(sessions: SessionLog[], dayTs: number = Date.now()): number {
  const from = startOfDay(dayTs);
  const to = from + DAY_MS;
  const ms = sessions
    .filter((s) => s.finishedAt >= from && s.finishedAt < to)
    .reduce((acc, s) => acc + s.durationMs, 0);
  return minutes(ms);
}

export interface DaySummary {
  date: number;
  games: number;
  minutes: number;
  stars: number;
  mistakes: number;
}

/** Підсумок однієї доби — використовується дашбордом і звітами батькам. */
export function daySummary(sessions: SessionLog[], dayTs: number = Date.now()): DaySummary {
  const from = startOfDay(dayTs);
  const to = from + DAY_MS;
  const inDay = sessions.filter((s) => s.finishedAt >= from && s.finishedAt < to);
  return {
    date: from,
    games: inDay.length,
    minutes: minutes(inDay.reduce((acc, s) => acc + s.durationMs, 0)),
    stars: inDay.reduce((acc, s) => acc + s.stars, 0),
    mistakes: inDay.reduce((acc, s) => acc + s.mistakes, 0),
  };
}

/** Понеділок поточного тижня (00:00). */
function startOfWeek(ts: number): number {
  const sod = startOfDay(ts);
  const dow = new Date(sod).getDay(); // 0=нд..6=сб
  const mondayOffset = (dow + 6) % 7; // днів від понеділка
  return sod - mondayOffset * DAY_MS;
}

/** Хвилини активності по днях поточного тижня (Пн..Нд) — 7 чисел. */
export function weekMinutes(sessions: SessionLog[], nowTs: number = Date.now()): number[] {
  const monday = startOfWeek(nowTs);
  return Array.from({ length: 7 }, (_, i) => dayMinutes(sessions, monday + i * DAY_MS));
}

/** Кількість днів поспіль з активністю, включно з сьогодні (0, якщо сьогодні порожньо). */
export function streakDays(sessions: SessionLog[], nowTs: number = Date.now()): number {
  if (sessions.length === 0) return 0;
  const activeDays = new Set(sessions.map((s) => startOfDay(s.finishedAt)));
  let streak = 0;
  let cursor = startOfDay(nowTs);
  while (activeDays.has(cursor)) {
    streak += 1;
    cursor -= DAY_MS;
  }
  return streak;
}

/** Останні n сесій у зворотному хронологічному порядку (найновіші перші). */
export function recentSessions(sessions: SessionLog[], n: number = 8): SessionLog[] {
  return [...sessions].sort((a, b) => b.finishedAt - a.finishedAt).slice(0, n);
}

export interface IslandStat {
  islandId: string;
  games: number;
  minutes: number;
  stars: number;
  mistakes: number;
}

/** Розбивка активності по островах за проміжок [fromTs, toTs). */
export function islandBreakdown(
  sessions: SessionLog[],
  fromTs: number,
  toTs: number,
): IslandStat[] {
  const inRange = sessions.filter((s) => s.finishedAt >= fromTs && s.finishedAt < toTs);
  const byIsland = new Map<string, IslandStat>();
  for (const s of inRange) {
    const cur =
      byIsland.get(s.islandId) ??
      { islandId: s.islandId, games: 0, minutes: 0, stars: 0, mistakes: 0 };
    cur.games += 1;
    cur.minutes += s.durationMs / 60000;
    cur.stars += s.stars;
    cur.mistakes += s.mistakes;
    byIsland.set(s.islandId, cur);
  }
  return Array.from(byIsland.values())
    .map((x) => ({ ...x, minutes: Math.round(x.minutes) }))
    .sort((a, b) => b.games - a.games);
}

/** Розбивка по островах за сьогодні — для денного звіту батькам. */
export function todayIslandBreakdown(
  sessions: SessionLog[],
  nowTs: number = Date.now(),
): IslandStat[] {
  const from = startOfDay(nowTs);
  return islandBreakdown(sessions, from, from + DAY_MS);
}
