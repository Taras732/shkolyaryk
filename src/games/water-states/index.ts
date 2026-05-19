import type { GameDefinition, LevelSpec, Task } from '../types';
import type { AgeGroupId } from '../../constants/ageGroups';
import {
  Renderer,
  type StateId,
  type WaterStateAnswer,
  type WaterStatePayload,
} from './Renderer';

const TASKS_PER_LEVEL = 5;

interface ItemEntry {
  key: string;
  emoji: string;
  state: StateId;
  basic: boolean;
}

const ITEM_POOL: ItemEntry[] = [
  { key: 'ice', emoji: '🧊', state: 'solid', basic: true },
  { key: 'snow', emoji: '❄️', state: 'solid', basic: true },
  { key: 'iceberg', emoji: '🏔️', state: 'solid', basic: false },

  { key: 'water', emoji: '💧', state: 'liquid', basic: true },
  { key: 'sea', emoji: '🌊', state: 'liquid', basic: true },
  { key: 'rain', emoji: '☔', state: 'liquid', basic: false },

  { key: 'cloud', emoji: '☁️', state: 'gas', basic: true },
  { key: 'steam', emoji: '💨', state: 'gas', basic: true },
  { key: 'fog', emoji: '🌫️', state: 'gas', basic: false },
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
  useFullPool: boolean;
  timeLimitSec?: number;
}

function timerFor(group: AgeGroupId): number {
  switch (group) {
    case 'preschool':
      return 12;
    case 'grade1':
      return 10;
    case 'grade2':
      return 10;
    case 'grade3':
      return 8;
    case 'grade4':
      return 6;
    default:
      return 10;
  }
}

function paramsFor(difficulty: number, ageGroupId: AgeGroupId | undefined): LevelConfig {
  const group = ageGroupId ?? 'grade1';
  const startsWithFullPool = group === 'grade3' || group === 'grade4';

  if (difficulty <= 1) {
    return { useFullPool: startsWithFullPool };
  }
  if (difficulty === 2) {
    return { useFullPool: true };
  }
  return { useFullPool: true, timeLimitSec: timerFor(group) };
}

function generateLevel(difficulty: number, ageGroupId?: AgeGroupId): LevelSpec<WaterStateAnswer> {
  const cfg = paramsFor(difficulty, ageGroupId);
  const pool = cfg.useFullPool ? ITEM_POOL : ITEM_POOL.filter((e) => e.basic);
  const picked = shuffle(pool).slice(0, TASKS_PER_LEVEL);
  const tasks: Task<WaterStateAnswer>[] = picked.map((entry, index) => {
    const payload: WaterStatePayload = {
      target: entry.state,
      emoji: entry.emoji,
      itemKey: entry.key,
    };
    return { id: `t${index}`, payload, timeLimitSec: cfg.timeLimitSec };
  });
  return {
    seed: `water-states-${Date.now()}`,
    difficulty,
    tasks,
  };
}

const waterStates: GameDefinition<LevelSpec<WaterStateAnswer>, WaterStateAnswer> = {
  id: 'water-states',
  islandId: 'science',
  name: 'game.waterStates.name',
  icon: '🔬',
  rulesKey: 'game.waterStates.rules',
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as WaterStatePayload;
    return { correct: answer === p.target };
  },
  gradeFit: { kindergarten: true, grade1: true, grade2: true, grade3: true, grade4: true },
  Renderer,
};

export default waterStates;
