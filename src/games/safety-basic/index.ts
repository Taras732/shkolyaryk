import type { GameDefinition, LevelSpec, Task } from '../types';
import type { AgeGroupId } from '../../constants/ageGroups';
import { Renderer, type SafetyAnswer, type SafetyPayload } from './Renderer';
import { scenariosFor, type SafetyScenario } from './scenarios';

const TASKS_PER_LEVEL = 3;

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function timeLimitFor(difficulty: number, ageGroupId: AgeGroupId | undefined): number | undefined {
  if (difficulty < 3) return undefined;
  if (ageGroupId === 'preschool' || ageGroupId === 'grade1') return undefined;
  return 25;
}

function pickScenarios(ageGroupId: AgeGroupId | undefined, count: number): SafetyScenario[] {
  const group = ageGroupId ?? 'grade1';
  const pool = scenariosFor(group);
  if (pool.length === 0) return [];
  const picked = shuffle(pool).slice(0, count);
  while (picked.length < count) {
    picked.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return picked.slice(0, count);
}

function generateLevel(difficulty: number, ageGroupId?: AgeGroupId): LevelSpec<SafetyAnswer> {
  const timeLimitSec = timeLimitFor(difficulty, ageGroupId);
  const scenarios = pickScenarios(ageGroupId, TASKS_PER_LEVEL);
  const tasks: Task<SafetyAnswer>[] = scenarios.map((s, i) => {
    const payload: SafetyPayload = {
      situation: s.situation,
      icon: s.icon,
      actions: shuffle(s.actions),
      timeLimitSec,
    };
    return { id: `t${i}-${s.key}`, payload, timeLimitSec };
  });
  return {
    seed: `safety-basic-${Date.now()}`,
    difficulty,
    tasks,
  };
}

const safetyBasic: GameDefinition<LevelSpec<SafetyAnswer>, SafetyAnswer> = {
  id: 'safety-basic',
  islandId: 'emotions',
  name: 'game.safetyBasic.name',
  icon: '🛡️',
  rulesKey: 'game.safetyBasic.rules',
  hasDifficulty: true,
  availableFor: ['preschool', 'grade1', 'grade2', 'grade3', 'grade4'],
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as SafetyPayload;
    const chosen = p.actions.find((a) => a.key === answer);
    return { correct: !!chosen?.isSafe };
  },
  gradeFit: { kindergarten: true, grade1: true, grade2: true, grade3: true, grade4: true },
  Renderer,
};

export default safetyBasic;
