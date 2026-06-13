import type { GameDefinition, LevelSpec, Task } from '../types';
import type { AgeGroupId } from '../../constants/ageGroups';
import {
  Renderer,
  type FlashAnswer,
  type FlashOp,
  type FlashPayload,
} from './Renderer';

interface LevelConfig {
  tables: number[];
  maxMultiplicand: number;
  allowDivision: boolean;
  taskCount: number;
}

function paramsFor(difficulty: number, ageGroupId: AgeGroupId | undefined): LevelConfig {
  const group = ageGroupId ?? 'grade2';

  let tables: number[];
  let maxMultiplicand: number;
  if (group === 'grade2') {
    tables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    maxMultiplicand = 10;
  } else if (group === 'grade3') {
    tables = [2, 3, 4, 5, 6, 7, 8, 9];
    maxMultiplicand = 9;
  } else {
    tables = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    maxMultiplicand = 12;
  }

  if (difficulty <= 1) return { tables, maxMultiplicand, allowDivision: false, taskCount: 5 };
  if (difficulty === 2) return { tables, maxMultiplicand, allowDivision: true, taskCount: 10 };
  return { tables, maxMultiplicand, allowDivision: true, taskCount: 15 };
}

function randInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function generateMultiplication(cfg: LevelConfig): FlashPayload {
  const a = pick(cfg.tables);
  const b = randInt(1, cfg.maxMultiplicand);
  return { a, b, op: '×', correct: a * b };
}

function generateDivision(cfg: LevelConfig): FlashPayload {
  const nonZero = cfg.tables.filter((t) => t !== 0);
  const divisor = pick(nonZero.length > 0 ? nonZero : [2]);
  const quotient = randInt(1, cfg.maxMultiplicand);
  const dividend = divisor * quotient;
  return { a: dividend, b: divisor, op: '÷', correct: quotient };
}

function generateTask(index: number, cfg: LevelConfig): Task<FlashAnswer> {
  const useDivision = cfg.allowDivision && Math.random() < 0.5;
  const payload = useDivision ? generateDivision(cfg) : generateMultiplication(cfg);
  return { id: `t${index}`, payload };
}

function generateLevel(difficulty: number, ageGroupId?: AgeGroupId): LevelSpec<FlashAnswer> {
  const cfg = paramsFor(difficulty, ageGroupId);
  const tasks: Task<FlashAnswer>[] = [];
  for (let i = 0; i < cfg.taskCount; i++) {
    tasks.push(generateTask(i, cfg));
  }
  return {
    seed: `times-flashcards-${Date.now()}`,
    difficulty,
    tasks,
  };
}

const timesFlashcards: GameDefinition<LevelSpec<FlashAnswer>, FlashAnswer> = {
  id: 'times-flashcards',
  islandId: 'math',
  name: 'game.timesFlashcards.name',
  icon: '🎴',
  rulesKey: 'game.timesFlashcards.rules',
  availableFor: ['grade2', 'grade3', 'grade4'],
  generateLevel,
  validateAnswer(_task, answer) {
    return { correct: answer === 'known' };
  },
  Renderer,
};

export default timesFlashcards;
