// IO-шар генератора плану дня (B1). Чиста логіка — planner-core.ts.
// Мапінг skill→game будується з реєстру ігор (GAMES[].skillIds за складністю).
// Патерн IO як mastery.ts / placement.ts: тонко, кидає при помилках БД (для UI «Мій день»).

import { fetchMastery, fetchSkills, fetchDailyPlan, createDailyPlan, fetchOfflineTasks } from './db';
import { buildDayPlan } from './planner-core';
import { GAMES } from '@/games/registry';
import { CLASS_LEVELS } from '@/games/types';
import type { DailyPlan, DailyPlanItem } from './types';

/**
 * Зворотний індекс skillId → gameId: перша гра (у порядку реєстру), що тренує навичку
 * на будь-якій складності. Реєстр статичний → будуємо один раз при завантаженні модуля.
 */
function buildGameBySkill(): Map<string, string> {
  const map = new Map<string, string>();
  for (const game of GAMES) {
    const lists: string[][] = Object.values(game.skillIds ?? {}).map((ids) => ids ?? []);
    // навички за класом (skillsFor) — усі класи й складності
    if (game.skillsFor) for (const cl of CLASS_LEVELS) for (const d of [1, 2, 3] as const) lists.push(game.skillsFor(d, cl));
    for (const ids of lists) {
      for (const skillId of ids) {
        if (!map.has(skillId)) map.set(skillId, game.id);
      }
    }
  }
  return map;
}

const gameBySkill = buildGameBySkill();

/**
 * Повернути план дня профілю, створивши його за потреби (ідемпотентно по date).
 * Якщо план на дату вже є — повертаємо як є (кроки й статуси не чіпаємо).
 * Інакше — збираємо вхід (mastery + skill-graph + мапінг ігор), будуємо детермінований
 * план і зберігаємо. Кидає при помилках БД — для UI (B2), не fire-and-forget.
 */
export async function getOrCreateTodayPlan(
  profileId: string,
  date: string,
): Promise<{ plan: DailyPlan; items: DailyPlanItem[] }> {
  const existing = await fetchDailyPlan(profileId, date);
  if (existing) return existing;

  const [mastery, skills, offlineTasks] = await Promise.all([
    fetchMastery(profileId),
    fetchSkills(),
    fetchOfflineTasks(),
  ]);
  const items = buildDayPlan({ skills, mastery, gameBySkill, date, offlineTasks });
  return createDailyPlan(profileId, date, items);
}
