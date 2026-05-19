import type { GameDefinition, LevelSpec, Task } from '../types';
import type { AgeGroupId } from '../../constants/ageGroups';
import {
  Renderer,
  type ReverseSequenceAnswer,
  type ReverseSequencePayload,
  type ReverseColor,
} from './Renderer';

const TASKS_PER_LEVEL = 5;
const SHOW_EACH_MS = 900;
const GAP_MS = 300;
const PALETTE: ReverseColor[] = ['red', 'blue', 'green', 'yellow'];

function randInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

interface LevelConfig {
  length: number;
  inputTimeLimitSec?: number;
}

function baseLengthFor(ageGroupId: AgeGroupId | undefined): number {
  switch (ageGroupId) {
    case 'grade1':
      return 2;
    case 'grade2':
      return 3;
    case 'grade3':
      return 4;
    case 'grade4':
      return 5;
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

function generateSequence(length: number): ReverseColor[] {
  const seq: ReverseColor[] = [];
  let prev: ReverseColor | null = null;
  for (let i = 0; i < length; i++) {
    let next = PALETTE[randInt(0, PALETTE.length - 1)];
    if (next === prev) {
      const others = PALETTE.filter((c) => c !== prev);
      next = others[randInt(0, others.length - 1)];
    }
    seq.push(next);
    prev = next;
  }
  return seq;
}

function generateTask(index: number, cfg: LevelConfig): Task<ReverseSequenceAnswer> {
  const payload: ReverseSequencePayload = {
    sequence: generateSequence(cfg.length),
    showEachMs: SHOW_EACH_MS,
    gapMs: GAP_MS,
    inputTimeLimitSec: cfg.inputTimeLimitSec,
  };
  return { id: `t${index}`, payload };
}

function generateLevel(
  difficulty: number,
  ageGroupId?: AgeGroupId,
): LevelSpec<ReverseSequenceAnswer> {
  const cfg = paramsFor(difficulty, ageGroupId);
  const tasks: Task<ReverseSequenceAnswer>[] = [];
  for (let i = 0; i < TASKS_PER_LEVEL; i++) {
    tasks.push(generateTask(i, cfg));
  }
  return {
    seed: `reverse-sequence-${Date.now()}`,
    difficulty,
    tasks,
  };
}

function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

const reverseSequence: GameDefinition<
  LevelSpec<ReverseSequenceAnswer>,
  ReverseSequenceAnswer
> = {
  id: 'reverse-sequence',
  islandId: 'memory',
  name: 'game.reverseSequence.name',
  icon: '↩️',
  rulesKey: 'game.reverseSequence.rules',
  availableFor: ['grade1', 'grade2', 'grade3', 'grade4'],
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as ReverseSequencePayload;
    const expected = p.sequence.slice().reverse();
    return { correct: arraysEqual(answer, expected) };
  },
  gradeFit: { kindergarten: true, grade1: true, grade2: true, grade3: true, grade4: true },
  Renderer,
};

export default reverseSequence;
