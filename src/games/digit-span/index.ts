import type { GameDefinition, LevelSpec, Task } from '../types';
import type { AgeGroupId } from '../../constants/ageGroups';
import {
  Renderer,
  type DigitSpanAnswer,
  type DigitSpanPayload,
} from './Renderer';

const TASKS_PER_LEVEL = 5;
const SHOW_EACH_MS = 900;
const GAP_MS = 300;

function randInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

interface LevelConfig {
  length: number;
  inputTimeLimitSec?: number;
}

function baseLengthFor(ageGroupId: AgeGroupId | undefined): number {
  switch (ageGroupId) {
    case 'preschool':
      return 2;
    case 'grade1':
      return 3;
    case 'grade2':
      return 4;
    case 'grade3':
      return 5;
    case 'grade4':
      return 6;
    default:
      return 3;
  }
}

function paramsFor(difficulty: number, ageGroupId: AgeGroupId | undefined): LevelConfig {
  const base = baseLengthFor(ageGroupId);
  if (difficulty <= 1) return { length: base };
  if (difficulty === 2) return { length: base + 1 };
  return { length: base + 1, inputTimeLimitSec: 10 };
}

function generateSequence(length: number): number[] {
  const seq: number[] = [];
  let prev = -1;
  for (let i = 0; i < length; i++) {
    let next = randInt(0, 9);
    if (next === prev) next = (next + 1) % 10;
    seq.push(next);
    prev = next;
  }
  return seq;
}

function generateTask(index: number, cfg: LevelConfig): Task<DigitSpanAnswer> {
  const payload: DigitSpanPayload = {
    sequence: generateSequence(cfg.length),
    showEachMs: SHOW_EACH_MS,
    gapMs: GAP_MS,
    inputTimeLimitSec: cfg.inputTimeLimitSec,
  };
  return { id: `t${index}`, payload };
}

function generateLevel(difficulty: number, ageGroupId?: AgeGroupId): LevelSpec<DigitSpanAnswer> {
  const cfg = paramsFor(difficulty, ageGroupId);
  const tasks: Task<DigitSpanAnswer>[] = [];
  for (let i = 0; i < TASKS_PER_LEVEL; i++) {
    tasks.push(generateTask(i, cfg));
  }
  return {
    seed: `digit-span-${Date.now()}`,
    difficulty,
    tasks,
  };
}

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

const digitSpan: GameDefinition<LevelSpec<DigitSpanAnswer>, DigitSpanAnswer> = {
  id: 'digit-span',
  islandId: 'memory',
  name: 'game.digitSpan.name',
  icon: '🔢',
  rulesKey: 'game.digitSpan.rules',
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as DigitSpanPayload;
    return { correct: arraysEqual(answer, p.sequence) };
  },
  gradeFit: { kindergarten: true, grade1: true, grade2: true, grade3: true, grade4: true },
  Renderer,
};

export default digitSpan;
