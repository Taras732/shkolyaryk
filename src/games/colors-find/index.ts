import type { GameDefinition, LevelSpec, Task } from '../types';
import type { AgeGroupId } from '../../constants/ageGroups';
import {
  Renderer,
  type ColorAnswer,
  type ColorId,
  type ColorPayload,
} from './Renderer';

const TASKS_PER_LEVEL = 5;

const POOL_6: ColorId[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
const POOL_10: ColorId[] = [...POOL_6, 'pink', 'brown', 'black', 'white'];
const POOL_14: ColorId[] = [...POOL_10, 'gray', 'cyan', 'lime', 'navy'];

interface LevelConfig {
  pool: ColorId[];
  candidates: number;
  timeLimitSec?: number;
}

function paramsFor(difficulty: number, ageGroupId: AgeGroupId | undefined): LevelConfig {
  const group = ageGroupId ?? 'preschool';
  if (group === 'preschool') {
    if (difficulty <= 1) return { pool: POOL_6, candidates: 3 };
    if (difficulty === 2) return { pool: POOL_10, candidates: 4 };
    return { pool: POOL_10, candidates: 4, timeLimitSec: 10 };
  }
  // grade1
  if (difficulty <= 1) return { pool: POOL_10, candidates: 4 };
  if (difficulty === 2) return { pool: POOL_14, candidates: 4 };
  return { pool: POOL_14, candidates: 4, timeLimitSec: 8 };
}

function randInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickCandidates(target: ColorId, pool: ColorId[], count: number): ColorId[] {
  const distractors = pool.filter((c) => c !== target);
  const picked = shuffle(distractors).slice(0, Math.max(0, count - 1));
  return shuffle([target, ...picked]);
}

function generateTask(index: number, cfg: LevelConfig): Task<ColorAnswer> {
  const target = cfg.pool[randInt(0, cfg.pool.length - 1)];
  const candidates = pickCandidates(target, cfg.pool, cfg.candidates);
  const payload: ColorPayload = { target, candidates };
  return { id: `t${index}`, payload, timeLimitSec: cfg.timeLimitSec };
}

function generateLevel(difficulty: number, ageGroupId?: AgeGroupId): LevelSpec<ColorAnswer> {
  const cfg = paramsFor(difficulty, ageGroupId);
  const tasks: Task<ColorAnswer>[] = [];
  for (let i = 0; i < TASKS_PER_LEVEL; i++) {
    tasks.push(generateTask(i, cfg));
  }
  return {
    seed: `colors-find-${Date.now()}`,
    difficulty,
    tasks,
  };
}

const colorsFind: GameDefinition<LevelSpec<ColorAnswer>, ColorAnswer> = {
  id: 'colors-find',
  islandId: 'creativity',
  name: 'game.colors.name',
  icon: '🎨',
  rulesKey: 'game.colors.rules',
  availableFor: ['preschool', 'grade1'],
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as ColorPayload;
    return { correct: answer === p.target };
  },
  gradeFit: { kindergarten: true, grade1: true, grade2: true, grade3: true, grade4: true },
  Renderer,
};

export default colorsFind;
