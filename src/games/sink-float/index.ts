import type { GameDefinition, LevelSpec, Task } from '../types';
import type { AgeGroupId } from '../../constants/ageGroups';
import {
  Renderer,
  type BehaviorId,
  type SinkFloatAnswer,
  type SinkFloatPayload,
} from './Renderer';

const TASKS_PER_LEVEL = 5;

interface ItemEntry {
  key: string;
  emoji: string;
  behavior: BehaviorId;
  basic: boolean;
}

const ITEM_POOL: ItemEntry[] = [
  // Sinking — basic
  { key: 'stone', emoji: '🪨', behavior: 'sink', basic: true },
  { key: 'coin', emoji: '🪙', behavior: 'sink', basic: true },
  { key: 'anchor', emoji: '⚓', behavior: 'sink', basic: true },
  // Sinking — extended
  { key: 'brick', emoji: '🧱', behavior: 'sink', basic: false },
  { key: 'scissors', emoji: '✂️', behavior: 'sink', basic: false },
  { key: 'key', emoji: '🔑', behavior: 'sink', basic: false },
  { key: 'spoon', emoji: '🥄', behavior: 'sink', basic: false },
  { key: 'nail', emoji: '🔩', behavior: 'sink', basic: false },
  // Floating — basic
  { key: 'wood', emoji: '🪵', behavior: 'float', basic: true },
  { key: 'apple', emoji: '🍎', behavior: 'float', basic: true },
  { key: 'duck', emoji: '🦆', behavior: 'float', basic: true },
  // Floating — extended
  { key: 'leaf', emoji: '🍂', behavior: 'float', basic: false },
  { key: 'sponge', emoji: '🧽', behavior: 'float', basic: false },
  { key: 'ball', emoji: '⚽', behavior: 'float', basic: false },
  { key: 'bottle', emoji: '🧴', behavior: 'float', basic: false },
  { key: 'boat', emoji: '⛵', behavior: 'float', basic: false },
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

function generateLevel(difficulty: number, ageGroupId?: AgeGroupId): LevelSpec<SinkFloatAnswer> {
  const cfg = paramsFor(difficulty, ageGroupId);
  const pool = cfg.useFullPool ? ITEM_POOL : ITEM_POOL.filter((e) => e.basic);
  const picked = shuffle(pool).slice(0, TASKS_PER_LEVEL);
  const tasks: Task<SinkFloatAnswer>[] = picked.map((entry, index) => {
    const payload: SinkFloatPayload = {
      target: entry.behavior,
      emoji: entry.emoji,
      itemKey: entry.key,
    };
    return { id: `t${index}`, payload, timeLimitSec: cfg.timeLimitSec };
  });
  return {
    seed: `sink-float-${Date.now()}`,
    difficulty,
    tasks,
  };
}

const sinkFloat: GameDefinition<LevelSpec<SinkFloatAnswer>, SinkFloatAnswer> = {
  id: 'sink-float',
  islandId: 'science',
  name: 'game.sinkFloat.name',
  icon: '🌊',
  rulesKey: 'game.sinkFloat.rules',
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as SinkFloatPayload;
    return { correct: answer === p.target };
  },
  Renderer,
};

export default sinkFloat;
