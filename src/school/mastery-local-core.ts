// Засвоєння з локального журналу (11.10.2026): Supabase недоступний, тож mastery не зберігається,
// а щоразу рахується з журналу ігор (shk.log.v1, синхронізується між пристроями сімʼї).
// Плюс: коли граф навичок перебудовано, засвоєння перераховується з історії само.
// Чисте ядро — без localStorage і реєстру ігор; IO — у db.ts.
//
// Стійкість (11.10, стратегія «ріст за опануванням»): одна вдала гра відкриває наступні навички
// (frontier рахується за EMA, як і раніше), але позначка «засвоєно» — лише після вдалих повторів
// через 1 і 3 дні (stability ≥ 2). Повтор через 7 днів — stability 3, «стійко». Невдала спроба
// після вивчення — стійкість з нуля. Так само працює буквар «Буква і звук».

import { computeStatuses, nextMastery, attemptRate, type PrereqEdge, type SkillNode } from './mastery-core';
import type { SkillMastery } from './types';

export interface AttemptLite {
  skillId: string;
  correct: number;
  total: number;
  at: number;
}

const DAY = 24 * 60 * 60 * 1000;
/** Інтервали повтору: після першої вдалої — через 1 день, далі 3, далі 7. */
const BOX_DAYS = [1, 3, 7];
/** Вдала спроба — від 80% правильних; невдала — менше 50%. Між ними — не рахуємо ні туди, ні туди. */
const GOOD = 0.8;
const BAD = 0.5;
/** Скільки вчасних повторів потрібно для «засвоєно». */
export const STABLE_FOR_MASTERED = 2;

interface Stab {
  /** 0 — ще не було вдалої; далі — скільки вчасних повторів пройдено (0..3). */
  box: number;
  /** Коли настає наступний повтор (мс); undefined — ще не було вдалої. */
  due?: number;
}

/** Крок стійкості за однією спробою. */
export function nextStability(s: Stab, rate: number, at: number): Stab {
  if (rate < BAD) return { box: 0, due: undefined };
  if (rate < GOOD) return s;
  if (s.due === undefined) return { box: 0, due: at + BOX_DAYS[0] * DAY };
  if (at < s.due) return s; // зарано — повтор того самого дня нічого не доводить
  const box = Math.min(BOX_DAYS.length, s.box + 1);
  return { box, due: box < BOX_DAYS.length ? at + BOX_DAYS[box] * DAY : s.due };
}

export interface SkillMasteryLocal extends SkillMastery {
  /** Скільки вчасних повторів пройдено (0..3): 2 — «засвоєно», 3 — «стійко». */
  stability: number;
}

/**
 * mastery кожної навички = EMA по спробах у хронологічному порядку.
 * `floor` — стартове значення з тесту на рівень (placement): з нього EMA починається, і такі
 * навички вважаються стійкими (дитина вже це вміла до застосунку).
 * Повертає рядки для навичок, що мають mastery>0 або не locked (як матеріалізувала БД).
 */
export function masteryFromAttempts(
  profileId: string,
  attempts: AttemptLite[],
  floor: Record<string, number>,
  skills: SkillNode[],
  prereqs: PrereqEdge[],
): SkillMasteryLocal[] {
  const value = new Map<string, number>(Object.entries(floor));
  const stab = new Map<string, Stab>(Object.keys(floor).map((id) => [id, { box: BOX_DAYS.length }]));
  const last = new Map<string, number>();
  for (const a of [...attempts].sort((x, y) => x.at - y.at)) {
    const rate = attemptRate(a.correct, a.total);
    value.set(a.skillId, nextMastery(value.get(a.skillId) ?? null, rate));
    stab.set(a.skillId, nextStability(stab.get(a.skillId) ?? { box: 0 }, rate, a.at));
    last.set(a.skillId, a.at);
  }
  const statuses = computeStatuses(skills, prereqs, value);
  const out: SkillMasteryLocal[] = [];
  for (const { skillId, status } of statuses) {
    const m = value.get(skillId) ?? 0;
    if (status === 'locked' && m === 0) continue;
    const stability = stab.get(skillId)?.box ?? 0;
    const at = last.get(skillId);
    out.push({
      profile_id: profileId,
      skill_id: skillId,
      mastery: m,
      // відкриття наступних — за EMA (вище); «засвоєно» — лише зі стійкістю
      status: status === 'mastered' && stability < STABLE_FOR_MASTERED ? 'frontier' : status,
      stability,
      last_practiced_at: at ? new Date(at).toISOString() : null,
      updated_at: new Date(at ?? 0).toISOString(),
    });
  }
  return out;
}
