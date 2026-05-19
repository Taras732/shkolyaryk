import type { GameDefinition, LevelSpec, Task } from '../types';
import type { AgeGroupId } from '../../constants/ageGroups';
import { Renderer, type CountAnswer, type CountPayload } from './Renderer';

const TASKS_PER_LEVEL = 5;
const MIN_DIST_FRAC = 0.14;
const SPRITE_MARGIN = 0.08;

function randInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randFloat(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function generatePositions(count: number): { xFrac: number; yFrac: number }[] {
  const positions: { xFrac: number; yFrac: number }[] = [];
  const maxAttempts = count * 50;
  let attempts = 0;

  while (positions.length < count && attempts < maxAttempts) {
    const x = randFloat(SPRITE_MARGIN, 1 - SPRITE_MARGIN);
    const y = randFloat(SPRITE_MARGIN, 1 - SPRITE_MARGIN);
    const tooClose = positions.some(
      (p) => Math.hypot(p.xFrac - x, p.yFrac - y) < MIN_DIST_FRAC
    );
    if (!tooClose) positions.push({ xFrac: x, yFrac: y });
    attempts++;
  }

  if (positions.length < count) {
    positions.length = 0;
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    const stepX = (1 - SPRITE_MARGIN * 2) / Math.max(cols - 1, 1);
    const stepY = (1 - SPRITE_MARGIN * 2) / Math.max(rows - 1, 1);
    for (let i = 0; i < count; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      positions.push({
        xFrac: SPRITE_MARGIN + c * stepX,
        yFrac: SPRITE_MARGIN + r * stepY,
      });
    }
  }

  return positions;
}

interface LevelParams {
  maxCount: number;
  timeLimitSec?: number;
}

function paramsFor(difficulty: number, ageGroupId: AgeGroupId | undefined): LevelParams {
  const group = ageGroupId ?? 'grade1';
  if (group === 'preschool') {
    if (difficulty <= 1) return { maxCount: 5 };
    if (difficulty === 2) return { maxCount: 10 };
    return { maxCount: 10, timeLimitSec: 15 };
  }
  if (group === 'grade1') {
    if (difficulty <= 1) return { maxCount: 10 };
    if (difficulty === 2) return { maxCount: 15 };
    return { maxCount: 15, timeLimitSec: 12 };
  }
  // grade2 (mirror of grade1 but with tighter timer on L3)
  if (difficulty <= 1) return { maxCount: 10 };
  if (difficulty === 2) return { maxCount: 15 };
  return { maxCount: 15, timeLimitSec: 10 };
}

function generateLevel(difficulty: number, ageGroupId?: AgeGroupId): LevelSpec<CountAnswer> {
  const { maxCount, timeLimitSec } = paramsFor(difficulty, ageGroupId);
  const tasks: Task<CountAnswer>[] = [];
  for (let i = 0; i < TASKS_PER_LEVEL; i++) {
    const correctCount = randInt(1, maxCount);
    const payload: CountPayload = {
      itemKey: 'apple',
      correctCount,
      positions: generatePositions(correctCount),
    };
    tasks.push({ id: `t${i}`, payload, timeLimitSec });
  }
  return {
    seed: `count-objects-${Date.now()}`,
    difficulty,
    tasks,
  };
}

const countObjects: GameDefinition<LevelSpec<CountAnswer>, CountAnswer> = {
  id: 'count-objects',
  islandId: 'math',
  name: 'game.countObjects.name',
  icon: '🍎',
  rulesKey: 'game.countObjects.rules',
  availableFor: ['preschool', 'grade1', 'grade2'],
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as CountPayload;
    return { correct: answer === p.correctCount };
  },
  gradeFit: { kindergarten: true, grade1: true, grade2: true, grade3: true, grade4: true },
  Renderer,
};

export default countObjects;
