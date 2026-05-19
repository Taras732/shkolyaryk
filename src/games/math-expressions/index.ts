import type { GameDefinition, LevelSpec, Task } from '../types';
import type { AgeGroupId } from '../../constants/ageGroups';
import { Renderer, type ExprAnswer, type ExprPayload, type ExprOp } from './Renderer';

const TASKS_PER_LEVEL = 5;
const CHOICES_COUNT = 4;

function randInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface LevelParams {
  valueMax: number;
  allowSubtraction: boolean;
  timeLimitSec?: number;
}

function paramsFor(difficulty: number, ageGroupId: AgeGroupId | undefined): LevelParams {
  const group = ageGroupId ?? 'grade1';

  let valueMax = 10;
  let timerSec = 10;
  if (group === 'preschool') {
    valueMax = 10;
    timerSec = 12;
  } else if (group === 'grade1') {
    valueMax = 20;
    timerSec = 10;
  } else if (group === 'grade2') {
    valueMax = 100;
    timerSec = 10;
  } else if (group === 'grade3') {
    valueMax = 1000;
    timerSec = 15;
  } else {
    // grade4
    valueMax = 1000;
    timerSec = 12;
  }

  if (difficulty <= 1) return { valueMax, allowSubtraction: false };
  if (difficulty === 2) return { valueMax, allowSubtraction: true };
  return { valueMax, allowSubtraction: true, timeLimitSec: timerSec };
}

function generateAddition(valueMax: number): { a: number; b: number } {
  const a = randInt(0, valueMax);
  const b = randInt(0, valueMax - a);
  return { a, b };
}

function generateSubtraction(valueMax: number): { a: number; b: number } {
  const a = randInt(1, valueMax);
  const b = randInt(0, a);
  return { a, b };
}

function distractorRange(correct: number): number {
  if (correct <= 10) return 3;
  if (correct <= 100) return 8;
  if (correct <= 1000) return 50;
  return 100;
}

function generateChoices(correct: number, valueMax: number): number[] {
  const pool = new Set<number>([correct]);
  const range = distractorRange(correct);
  const min = Math.max(0, correct - range);
  const max = Math.min(valueMax * 2, correct + range);
  let attempts = 0;

  while (pool.size < CHOICES_COUNT && attempts < 80) {
    const candidate = randInt(min, max);
    if (candidate >= 0) pool.add(candidate);
    attempts++;
  }

  let filler = Math.max(0, correct - range * 2);
  while (pool.size < CHOICES_COUNT && filler <= correct + range * 2) {
    if (filler !== correct) pool.add(filler);
    filler++;
  }

  return shuffle(Array.from(pool).slice(0, CHOICES_COUNT));
}

function generateTask(index: number, params: LevelParams): Task<ExprAnswer> {
  const op: ExprOp =
    params.allowSubtraction && Math.random() < 0.5 ? '−' : '+';
  const { a, b } = op === '+'
    ? generateAddition(params.valueMax)
    : generateSubtraction(params.valueMax);
  const correct = op === '+' ? a + b : a - b;
  const payload: ExprPayload = {
    a,
    b,
    op,
    correct,
    choices: generateChoices(correct, params.valueMax),
  };
  return { id: `t${index}`, payload, timeLimitSec: params.timeLimitSec };
}

function generateLevel(difficulty: number, ageGroupId?: AgeGroupId): LevelSpec<ExprAnswer> {
  const params = paramsFor(difficulty, ageGroupId);
  const tasks: Task<ExprAnswer>[] = [];
  for (let i = 0; i < TASKS_PER_LEVEL; i++) {
    tasks.push(generateTask(i, params));
  }
  return {
    seed: `math-expressions-${Date.now()}`,
    difficulty,
    tasks,
  };
}

const mathExpressions: GameDefinition<LevelSpec<ExprAnswer>, ExprAnswer> = {
  id: 'math-expressions',
  islandId: 'math',
  name: 'game.mathExpressions.name',
  icon: '➕',
  rulesKey: 'game.mathExpressions.rules',
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as ExprPayload;
    return { correct: answer === p.correct };
  },
  gradeFit: { kindergarten: true, grade1: true, grade2: true, grade3: true, grade4: true },
  Renderer,
};

export default mathExpressions;
