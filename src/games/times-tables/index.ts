import type { GameDefinition, LevelSpec, Task } from '../types';
import type { AgeGroupId } from '../../constants/ageGroups';
import {
  Renderer,
  type TimesAnswer,
  type TimesOp,
  type TimesPayload,
} from './Renderer';

const TASKS_PER_LEVEL = 5;
const CHOICES_COUNT = 4;

interface LevelConfig {
  tables: number[];
  maxMultiplicand: number;
  allowDivision: boolean;
  timeLimitSec?: number;
}

function paramsFor(difficulty: number, ageGroupId: AgeGroupId | undefined): LevelConfig {
  const group = ageGroupId ?? 'grade2';

  if (group === 'grade2') {
    if (difficulty <= 1)
      return { tables: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], maxMultiplicand: 10, allowDivision: false };
    if (difficulty === 2)
      return { tables: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], maxMultiplicand: 10, allowDivision: true };
    return { tables: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], maxMultiplicand: 10, allowDivision: true };
  }

  if (group === 'grade3') {
    if (difficulty <= 1)
      return { tables: [2, 3, 4, 5, 6, 7, 8, 9], maxMultiplicand: 9, allowDivision: false };
    if (difficulty === 2)
      return { tables: [2, 3, 4, 5, 6, 7, 8, 9], maxMultiplicand: 9, allowDivision: true };
    return {
      tables: [2, 3, 4, 5, 6, 7, 8, 9],
      maxMultiplicand: 9,
      allowDivision: true,
      timeLimitSec: 8,
    };
  }

  // grade4
  if (difficulty <= 1)
    return { tables: [2, 3, 4, 5, 6, 7, 8, 9], maxMultiplicand: 9, allowDivision: true };
  if (difficulty === 2)
    return {
      tables: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      maxMultiplicand: 12,
      allowDivision: true,
    };
  return {
    tables: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    maxMultiplicand: 12,
    allowDivision: true,
    timeLimitSec: 6,
  };
}

function randInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Generated {
  a: number;
  b: number;
  op: TimesOp;
  correct: number;
  hintBase: number;
  hintTargetB: number;
}

function generateMultiplication(cfg: LevelConfig): Generated {
  const a = pick(cfg.tables);
  const b = randInt(1, cfg.maxMultiplicand);
  return {
    a,
    b,
    op: '×',
    correct: a * b,
    hintBase: a,
    hintTargetB: b,
  };
}

function generateDivision(cfg: LevelConfig): Generated {
  const validDivisors = cfg.tables.filter((t) => t !== 0);
  const divisor = pick(validDivisors.length > 0 ? validDivisors : [2]);
  const quotient = randInt(1, cfg.maxMultiplicand);
  const dividend = divisor * quotient;
  return {
    a: dividend,
    b: divisor,
    op: '÷',
    correct: quotient,
    hintBase: divisor,
    hintTargetB: quotient,
  };
}

function generateChoices(correct: number, cfg: LevelConfig): number[] {
  const pool = new Set<number>([correct]);
  const maxResult = Math.max(...cfg.tables) * cfg.maxMultiplicand;
  const candidates = [
    correct + 1,
    correct - 1,
    correct + 2,
    correct - 2,
    correct + Math.max(...cfg.tables),
    correct - Math.max(...cfg.tables),
    correct + 4,
    correct - 4,
  ];

  for (const c of candidates) {
    if (c > 0 && c <= maxResult * 2 && !pool.has(c)) {
      pool.add(c);
      if (pool.size >= CHOICES_COUNT) break;
    }
  }

  let fallback = 1;
  while (pool.size < CHOICES_COUNT && fallback <= maxResult) {
    if (fallback !== correct) pool.add(fallback);
    fallback++;
  }

  return shuffle(Array.from(pool).slice(0, CHOICES_COUNT));
}

function generateTask(index: number, cfg: LevelConfig): Task<TimesAnswer> {
  const useDivision = cfg.allowDivision && Math.random() < 0.5;
  const gen = useDivision ? generateDivision(cfg) : generateMultiplication(cfg);
  const choices = generateChoices(gen.correct, cfg);

  const payload: TimesPayload = {
    a: gen.a,
    b: gen.b,
    op: gen.op,
    correct: gen.correct,
    choices,
    hintBase: gen.hintBase,
    hintRowsUpTo: cfg.maxMultiplicand,
    hintTargetB: gen.hintTargetB,
  };
  return { id: `t${index}`, payload, timeLimitSec: cfg.timeLimitSec };
}

function generateLevel(difficulty: number, ageGroupId?: AgeGroupId): LevelSpec<TimesAnswer> {
  const cfg = paramsFor(difficulty, ageGroupId);
  const tasks: Task<TimesAnswer>[] = [];
  for (let i = 0; i < TASKS_PER_LEVEL; i++) {
    tasks.push(generateTask(i, cfg));
  }
  return {
    seed: `times-tables-${Date.now()}`,
    difficulty,
    tasks,
  };
}

const timesTables: GameDefinition<LevelSpec<TimesAnswer>, TimesAnswer> = {
  id: 'times-tables',
  islandId: 'math',
  name: 'game.timesTables.name',
  icon: '✖️',
  rulesKey: 'game.timesTables.rules',
  availableFor: ['grade2', 'grade3', 'grade4'],
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as TimesPayload;
    return { correct: answer === p.correct };
  },
  gradeFit: { kindergarten: true, grade1: true, grade2: true, grade3: true, grade4: true },
  Renderer,
};

export default timesTables;
