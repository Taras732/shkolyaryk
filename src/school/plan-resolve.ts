import { gamesForClass, profileClass } from '@/games/registry';
import type { ChildProfile } from '@/stores/useProfileStore';
import { loadPlan } from './family-plan';
import { readLog } from './game-log';
import { smartPlan, todaySmartPlan, type PlannedStep } from './smart-plan';
import { loadStats } from '@/games/times-tables/storage';
import { weakFacts } from '@/games/times-tables/core';
import { loadDict } from '@/games/english-words/storage';
import { dueWords } from '@/games/english-words/core';
import { LETTERS } from '@/games/uk-letters/letters';
import { isKnown as letterKnown, type LetterProgress } from '@/games/uk-letters/core';

function lettersInProgress(id: string): number {
  try {
    const p = JSON.parse(localStorage.getItem(`shk.ukl.v1.${id}`) ?? '{}') as LetterProgress;
    return LETTERS.filter((l) => p[l.ch] && !letterKnown(p[l.ch])).length;
  } catch {
    return 0;
  }
}

/** Розумний план дитини на сьогодні (без урахування режиму). */
export function smartPlanFor(child: Pick<ChildProfile, 'id' | 'age_group' | 'class_level'>, now = Date.now()): PlannedStep[] {
  const cl = profileClass(child);
  return todaySmartPlan(
    child.id,
    () =>
      smartPlan(
        cl,
        new Set(gamesForClass(cl).map((g) => g.id)),
        readLog(child.id),
        { weakFacts: weakFacts(loadStats(child.id)).length, dueWords: dueWords(loadDict(child.id), now).length, lettersInProgress: lettersInProgress(child.id) },
        now,
      ),
    now,
  );
}

/** Кроки «Після школи» з поясненням: розумні або обрані батьками. */
export function resolvePlan(child: Pick<ChildProfile, 'id' | 'age_group' | 'class_level'>, now = Date.now()): PlannedStep[] {
  const plan = loadPlan(child.id, profileClass(child));
  if (plan.mode === 'auto') return smartPlanFor(child, now);
  return plan.steps.map((gameId) => ({ gameId, subject: 'math', reason: 'обрали батьки' }));
}
