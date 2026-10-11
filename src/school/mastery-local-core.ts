// Засвоєння з локального журналу (11.10.2026): Supabase недоступний, тож mastery не зберігається,
// а щоразу рахується з журналу ігор (shk.log.v1, синхронізується між пристроями сімʼї).
// Плюс: коли граф навичок перебудовано, засвоєння перераховується з історії само.
// Чисте ядро — без localStorage і реєстру ігор; IO — у db.ts.

import { computeStatuses, nextMastery, attemptRate, type PrereqEdge, type SkillNode } from './mastery-core';
import type { SkillMastery } from './types';

export interface AttemptLite {
  skillId: string;
  correct: number;
  total: number;
  at: number;
}

/**
 * mastery кожної навички = EMA по спробах у хронологічному порядку.
 * `floor` — стартове значення з тесту на рівень (placement): з нього EMA починається.
 * Повертає рядки для навичок, що мають mastery>0 або не locked (як матеріалізувала БД).
 */
export function masteryFromAttempts(
  profileId: string,
  attempts: AttemptLite[],
  floor: Record<string, number>,
  skills: SkillNode[],
  prereqs: PrereqEdge[],
): SkillMastery[] {
  const value = new Map<string, number>(Object.entries(floor));
  const last = new Map<string, number>();
  for (const a of [...attempts].sort((x, y) => x.at - y.at)) {
    value.set(a.skillId, nextMastery(value.get(a.skillId) ?? null, attemptRate(a.correct, a.total)));
    last.set(a.skillId, a.at);
  }
  const statuses = computeStatuses(skills, prereqs, value);
  const out: SkillMastery[] = [];
  for (const { skillId, status } of statuses) {
    const m = value.get(skillId) ?? 0;
    if (status === 'locked' && m === 0) continue;
    const at = last.get(skillId);
    out.push({
      profile_id: profileId,
      skill_id: skillId,
      mastery: m,
      status,
      last_practiced_at: at ? new Date(at).toISOString() : null,
      updated_at: new Date(at ?? 0).toISOString(),
    });
  }
  return out;
}
