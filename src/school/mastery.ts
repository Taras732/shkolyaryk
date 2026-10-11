// Mastery-движок (A4), IO-шар. Чиста логіка — у mastery-core.ts.
// Викликається після завершення гри (GameShell) для профілів, синхронізованих у БД.
//
// Потік recordGameResult:
//   1. на кожен skill гри — записати attempt (сира спроба);
//   2. оновити mastery% цього skill (EMA);
//   3. перерахувати статуси всіх навичок по DAG (frontier-розблокування).
//
// Джерело істини для «засвоєно» — mastery-значення; статуси (locked/frontier/
// mastered) — похідні, авторитетно перераховуються recomputeFrontier.

import {
  fetchMastery,
  insertAttempt,
  upsertMastery,
} from './db';
import { attemptRate, nextMastery } from './mastery-core';
import type { SkillMastery } from './types';

export interface GameResult {
  profileId: string;
  /** Навички, які тренувала гра на зіграній складності (game.skillIds[difficulty]). */
  skillIds: string[];
  gameId: string;
  /** Складність 1|2|3 (пишеться як текст в attempts.difficulty). */
  difficulty: number;
  correct: number;
  total: number;
  durationSec?: number;
}

/**
 * Записати результат гри у навчальне ядро й перерахувати frontier.
 * Кидає при помилках БД — викликати у fire-and-forget з .catch (не блокувати UI/гру).
 */
export async function recordGameResult(r: GameResult): Promise<void> {
  const rate = attemptRate(r.correct, r.total);
  const nowIso = new Date().toISOString();

  // Гра без skill-мапінгу (не-math): пишемо загальний attempt для аналітики
  // кабінету («останні заняття»), без оновлення mastery/frontier.
  if (r.skillIds.length === 0) {
    await insertAttempt({
      profile_id: r.profileId,
      skill_id: null,
      game_id: r.gameId,
      difficulty: String(r.difficulty),
      correct: r.correct,
      total: r.total,
      duration_sec: r.durationSec ?? null,
    });
    return;
  }

  const existing = await fetchMastery(r.profileId);
  const byId = new Map<string, SkillMastery>(existing.map((m) => [m.skill_id, m]));

  for (const skillId of r.skillIds) {
    await insertAttempt({
      profile_id: r.profileId,
      skill_id: skillId,
      game_id: r.gameId,
      difficulty: String(r.difficulty),
      correct: r.correct,
      total: r.total,
      duration_sec: r.durationSec ?? null,
    });

    const prev = byId.get(skillId);
    await upsertMastery({
      profile_id: r.profileId,
      skill_id: skillId,
      mastery: nextMastery(prev?.mastery ?? null, rate),
      // тимчасовий статус (recomputeFrontier нижче виставить авторитетний по DAG)
      status: prev?.status ?? 'frontier',
      last_practiced_at: nowIso,
    });
  }

  await recomputeFrontier(r.profileId);
}

/**
 * Перерахувати статуси всіх навичок профілю по DAG за поточними mastery.
 * Матеріалізує записи лише для frontier/mastered; locked лишає без рядка
 * (відсутність запису = locked за замовчуванням). Оновлює тільки те, що змінилось.
 */
export async function recomputeFrontier(profileId: string): Promise<void> {
  // 11.10: статуси рахуються під час читання (db.ts → mastery-local-core.ts), матеріалізувати нічого.
  // Інакше поточні значення записались би як стартова точка тесту на рівень і «заморозили» засвоєння.
  void profileId;
}
