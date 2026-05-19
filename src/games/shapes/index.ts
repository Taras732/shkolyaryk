import type { GameDefinition, LevelSpec, Task } from '../types';
import type { AgeGroupId } from '../../constants/ageGroups';
import { Renderer, type ShapeAnswer, type ShapePayload, type ShapeCandidate } from './Renderer';
import type { ShapeId } from './shapes';

const TASKS_PER_LEVEL = 5;
const COLOR_POOL = ['#FF6B35', '#4ECDC4', '#FFD93D', '#845EC2', '#22C55E', '#3B82F6'];

const BASIC_3: ShapeId[] = ['circle', 'square', 'triangle'];
const BASIC_4: ShapeId[] = ['circle', 'square', 'triangle', 'rectangle'];
const BASIC_6: ShapeId[] = ['circle', 'square', 'triangle', 'rectangle', 'oval', 'rhombus'];
const EXTENDED_8: ShapeId[] = [
  'circle',
  'square',
  'triangle',
  'rectangle',
  'oval',
  'rhombus',
  'pentagon',
  'hexagon',
];
const FULL_11: ShapeId[] = [
  'circle',
  'square',
  'triangle',
  'rectangle',
  'oval',
  'rhombus',
  'pentagon',
  'hexagon',
  'cube',
  'cone',
  'cylinder',
];

interface LevelConfig {
  pool: ShapeId[];
  candidates: number;
  timeLimitSec?: number;
}

function paramsFor(difficulty: number, ageGroupId: AgeGroupId | undefined): LevelConfig {
  const group = ageGroupId ?? 'preschool';

  if (group === 'preschool') {
    if (difficulty <= 1) return { pool: BASIC_3, candidates: 3 };
    if (difficulty === 2) return { pool: BASIC_4, candidates: 4 };
    return { pool: BASIC_4, candidates: 4, timeLimitSec: 10 };
  }

  // grade1
  if (difficulty <= 1) return { pool: BASIC_6, candidates: 4 };
  if (difficulty === 2) return { pool: EXTENDED_8, candidates: 4 };
  return { pool: FULL_11, candidates: 4, timeLimitSec: 8 };
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

function pickShapes(target: ShapeId, pool: ShapeId[], count: number): ShapeId[] {
  const distractors = pool.filter((s) => s !== target);
  const picked = shuffle(distractors).slice(0, Math.max(0, count - 1));
  return shuffle([target, ...picked]);
}

function pickColors(count: number): string[] {
  return shuffle(COLOR_POOL).slice(0, count);
}

function generateTask(index: number, cfg: LevelConfig): Task<ShapeAnswer> {
  const target = cfg.pool[randInt(0, cfg.pool.length - 1)];
  const shapeIds = pickShapes(target, cfg.pool, cfg.candidates);
  const palette = pickColors(shapeIds.length);
  const candidates: ShapeCandidate[] = shapeIds.map((id, i) => ({ id, color: palette[i] }));
  const payload: ShapePayload = { target, candidates };
  return { id: `t${index}`, payload, timeLimitSec: cfg.timeLimitSec };
}

function generateLevel(difficulty: number, ageGroupId?: AgeGroupId): LevelSpec<ShapeAnswer> {
  const cfg = paramsFor(difficulty, ageGroupId);
  const tasks: Task<ShapeAnswer>[] = [];
  for (let i = 0; i < TASKS_PER_LEVEL; i++) {
    tasks.push(generateTask(i, cfg));
  }
  return {
    seed: `shapes-${Date.now()}`,
    difficulty,
    tasks,
  };
}

const shapes: GameDefinition<LevelSpec<ShapeAnswer>, ShapeAnswer> = {
  id: 'shapes',
  islandId: 'math',
  name: 'game.shapes.name',
  icon: '🔺',
  rulesKey: 'game.shapes.rules',
  availableFor: ['preschool', 'grade1'],
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as ShapePayload;
    return { correct: answer === p.target };
  },
  gradeFit: { kindergarten: true, grade1: true, grade2: true, grade3: true, grade4: true },
  Renderer,
};

export default shapes;
