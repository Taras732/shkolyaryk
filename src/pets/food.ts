import { localDay, type LogEntry } from '@/school/game-log';

/**
 * Їжа друга (рішення 10.10.2026): за кожен крок «на сьогодні», пройдений сьогодні, — одна (до 3),
 * за кожні 2 вільні гри — ще одна (до 2). Окремої «валюти» немає: зароблене виводиться з журналу ігор,
 * зберігаємо лише, скільки друг уже з'їв сьогодні. Наступного дня — з нуля, нічого не «згорає з докором».
 */
export const PLAN_FOOD_MAX = 3;
export const FREE_FOOD_MAX = 2;
export const FREE_GAMES_PER_FOOD = 2;

export function earnedToday(log: LogEntry[], planIds: string[], now = Date.now()): number {
  const day = localDay(now);
  const today = log.filter((e) => localDay(e.at) === day);
  const plan = new Set(planIds);
  const planDone = new Set(today.filter((e) => plan.has(e.gameId)).map((e) => e.gameId)).size;
  const free = today.filter((e) => !plan.has(e.gameId)).length;
  return Math.min(PLAN_FOOD_MAX, planDone) + Math.min(FREE_FOOD_MAX, Math.floor(free / FREE_GAMES_PER_FOOD));
}

const key = (profileId: string) => `shk.pet.v1.${profileId}`;

export function eatenToday(profileId: string, now = Date.now()): number {
  try {
    const v = JSON.parse(localStorage.getItem(key(profileId)) ?? 'null');
    return v && v.day === localDay(now) ? Number(v.eaten) || 0 : 0;
  } catch {
    return 0;
  }
}

export function markEaten(profileId: string, now = Date.now()): number {
  const eaten = eatenToday(profileId, now) + 1;
  try {
    localStorage.setItem(key(profileId), JSON.stringify({ day: localDay(now), eaten }));
  } catch {
    // без пам'яті друг просто поїсть ще раз — не біда
  }
  return eaten;
}
