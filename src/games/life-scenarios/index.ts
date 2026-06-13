import type { GameDefinition, LevelSpec, Task } from '../types';
import type { AgeGroupId } from '../../constants/ageGroups';
import {
  Renderer,
  type LifeScenarioAnswer,
  type LifeScenarioPayload,
} from './Renderer';
import { scenariosFor, type EmotionTag, type Scenario } from './scenarios';

const TASKS_PER_LEVEL = 3;

const AVAILABLE_EMOTIONS: EmotionTag[] = [
  'happy',
  'sad',
  'angry',
  'scared',
  'surprised',
  'embarrassed',
  'proud',
  'guilty',
  'jealous',
];

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface LevelConfig {
  showEmotions: boolean;
  showConsequence: boolean;
  inputTimeLimitSec?: number;
}

function paramsFor(difficulty: number, _ageGroupId: AgeGroupId | undefined): LevelConfig {
  if (difficulty <= 1) return { showEmotions: false, showConsequence: false };
  if (difficulty === 2) return { showEmotions: true, showConsequence: true };
  return { showEmotions: true, showConsequence: true, inputTimeLimitSec: 20 };
}

function pickScenarios(ageGroupId: AgeGroupId | undefined, count: number): Scenario[] {
  const group = ageGroupId ?? 'grade1';
  const pool = scenariosFor(group);
  if (pool.length === 0) return [];
  const picked = shuffle(pool).slice(0, count);
  // if pool too small, repeat
  while (picked.length < count) {
    picked.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return picked.slice(0, count);
}

function generateTask(index: number, scenario: Scenario, cfg: LevelConfig): Task<LifeScenarioAnswer> {
  const payload: LifeScenarioPayload = {
    scenarioKey: scenario.key,
    situation: scenario.situation,
    icon: scenario.icon,
    actions: shuffle(scenario.actions),
    showEmotions: cfg.showEmotions,
    showConsequence: cfg.showConsequence,
    availableEmotions: AVAILABLE_EMOTIONS,
    inputTimeLimitSec: cfg.inputTimeLimitSec,
  };
  return { id: `t${index}-${scenario.key}`, payload };
}

function generateLevel(difficulty: number, ageGroupId?: AgeGroupId): LevelSpec<LifeScenarioAnswer> {
  const cfg = paramsFor(difficulty, ageGroupId);
  const scenarios = pickScenarios(ageGroupId, TASKS_PER_LEVEL);
  const tasks: Task<LifeScenarioAnswer>[] = scenarios.map((s, i) => generateTask(i, s, cfg));
  return {
    seed: `life-scenarios-${Date.now()}`,
    difficulty,
    tasks,
  };
}

const lifeScenarios: GameDefinition<LevelSpec<LifeScenarioAnswer>, LifeScenarioAnswer> = {
  id: 'life-scenarios',
  islandId: 'emotions',
  name: 'game.lifeScenarios.name',
  icon: '🙋',
  rulesKey: 'game.lifeScenarios.rules',
  // Heavy reading (situation + actions + consequences) — confident readers only.
  availableFor: ['grade2', 'grade3', 'grade4'],
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as LifeScenarioPayload;
    const chosen = p.actions.find((a) => a.key === answer.actionKey);
    return { correct: !!chosen?.isBest };
  },
  Renderer,
};

export default lifeScenarios;
