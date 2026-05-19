import type { GameDefinition, LevelSpec, Task } from '../types';
import type { AgeGroupId } from '../../constants/ageGroups';
import { Renderer, type NumberPatternsAnswer, type NumberPatternsPayload } from './Renderer';

const TASKS_PER_LEVEL = 5;
const VISIBLE_LENGTH = 4;
const CHOICES_COUNT = 4;

type PatternKind = 'linear' | 'triangular' | 'doubling';

interface LevelConfig {
  maxValue: number;
  steps: number[];
  allowDescending: boolean;
  nonLinear: boolean;
  timeLimitSec?: number;
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

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function paramsFor(difficulty: number, ageGroupId: AgeGroupId | undefined): LevelConfig {
  const group = ageGroupId ?? 'grade1';

  if (group === 'grade1') {
    if (difficulty <= 1) return { maxValue: 20, steps: [1, 2], allowDescending: false, nonLinear: false };
    if (difficulty === 2) return { maxValue: 30, steps: [2, 3, 5], allowDescending: false, nonLinear: false };
    // diff3: introduce triangular/doubling for variety alongside linear
    return { maxValue: 30, steps: [2, 3, 5], allowDescending: true, nonLinear: true, timeLimitSec: 10 };
  }
  if (group === 'grade2') {
    if (difficulty <= 1) return { maxValue: 100, steps: [2, 5, 10], allowDescending: false, nonLinear: false };
    // diff2+: mix in non-linear patterns to break linear monotony
    if (difficulty === 2) return { maxValue: 100, steps: [3, 5, 10], allowDescending: true, nonLinear: true };
    return { maxValue: 100, steps: [3, 5, 10], allowDescending: true, nonLinear: true, timeLimitSec: 10 };
  }
  if (group === 'grade3') {
    if (difficulty <= 1) return { maxValue: 500, steps: [5, 10, 25], allowDescending: false, nonLinear: false };
    if (difficulty === 2) return { maxValue: 500, steps: [10, 25, 50], allowDescending: true, nonLinear: false };
    return { maxValue: 500, steps: [10, 25, 50], allowDescending: true, nonLinear: true, timeLimitSec: 10 };
  }
  // grade4
  if (difficulty <= 1) return { maxValue: 1000, steps: [10, 25, 50], allowDescending: true, nonLinear: false };
  if (difficulty === 2) return { maxValue: 1000, steps: [25, 50, 100], allowDescending: true, nonLinear: true };
  return { maxValue: 1000, steps: [25, 50, 100], allowDescending: true, nonLinear: true, timeLimitSec: 8 };
}

interface Generated {
  visible: number[];
  correct: number;
}

function generateLinear(cfg: LevelConfig): Generated {
  const step = pick(cfg.steps);
  const descending = cfg.allowDescending && Math.random() < 0.35;
  const signedStep = descending ? -step : step;

  const totalPoints = VISIBLE_LENGTH + 1;
  const neededRange = Math.abs(signedStep) * (totalPoints - 1);

  let start: number;
  if (descending) {
    const minStart = neededRange + 1;
    const maxStart = Math.max(minStart, cfg.maxValue);
    start = randInt(minStart, maxStart);
  } else {
    const maxStart = Math.max(0, cfg.maxValue - neededRange);
    start = randInt(0, maxStart);
  }

  const seq: number[] = [];
  for (let i = 0; i < totalPoints; i++) {
    seq.push(start + signedStep * i);
  }
  return { visible: seq.slice(0, VISIBLE_LENGTH), correct: seq[VISIBLE_LENGTH] };
}

function generateTriangular(cfg: LevelConfig): Generated {
  // 1, 3, 6, 10, 15 — additions +2, +3, +4, +5
  const startStep = randInt(1, 3);
  const startVal = randInt(0, 5);
  const seq: number[] = [startVal];
  let step = startStep;
  for (let i = 0; i < VISIBLE_LENGTH; i++) {
    seq.push(seq[i] + step);
    step += 1;
  }
  if (seq[seq.length - 1] > cfg.maxValue) {
    return generateLinear(cfg);
  }
  return { visible: seq.slice(0, VISIBLE_LENGTH), correct: seq[VISIBLE_LENGTH] };
}

function generateDoubling(cfg: LevelConfig): Generated {
  // 2, 4, 8, 16, 32 — multiply by 2
  const start = pick([1, 2, 3]);
  const seq: number[] = [start];
  for (let i = 0; i < VISIBLE_LENGTH; i++) {
    seq.push(seq[i] * 2);
  }
  if (seq[seq.length - 1] > cfg.maxValue) {
    return generateLinear(cfg);
  }
  return { visible: seq.slice(0, VISIBLE_LENGTH), correct: seq[VISIBLE_LENGTH] };
}

function generateSequence(cfg: LevelConfig): Generated {
  if (!cfg.nonLinear) return generateLinear(cfg);
  const kinds: PatternKind[] = ['linear', 'linear', 'triangular', 'doubling'];
  const kind = pick(kinds);
  if (kind === 'triangular') return generateTriangular(cfg);
  if (kind === 'doubling') return generateDoubling(cfg);
  return generateLinear(cfg);
}

function generateChoices(correct: number, visible: number[]): number[] {
  const pool = new Set<number>([correct]);
  const lastDiff = Math.abs(visible[visible.length - 1] - (visible[visible.length - 2] ?? visible[0]));
  const step = lastDiff || 1;

  const candidates = [
    correct + step,
    correct - step,
    correct + 2 * step,
    correct - 2 * step,
    correct + 1,
    correct - 1,
  ];

  for (const c of candidates) {
    if (c >= 0 && !pool.has(c)) {
      pool.add(c);
      if (pool.size >= CHOICES_COUNT) break;
    }
  }

  let fallback = Math.max(0, correct - 5);
  while (pool.size < CHOICES_COUNT && fallback <= correct + 10) {
    if (fallback !== correct) pool.add(fallback);
    fallback++;
  }

  return shuffle(Array.from(pool).slice(0, CHOICES_COUNT));
}

function generateTask(index: number, cfg: LevelConfig): Task<NumberPatternsAnswer> {
  const { visible, correct } = generateSequence(cfg);
  const choices = generateChoices(correct, visible);
  const payload: NumberPatternsPayload = { visible, correct, choices };
  return { id: `t${index}`, payload, timeLimitSec: cfg.timeLimitSec };
}

function generateLevel(difficulty: number, ageGroupId?: AgeGroupId): LevelSpec<NumberPatternsAnswer> {
  const cfg = paramsFor(difficulty, ageGroupId);
  const tasks: Task<NumberPatternsAnswer>[] = [];
  for (let i = 0; i < TASKS_PER_LEVEL; i++) {
    tasks.push(generateTask(i, cfg));
  }
  return {
    seed: `number-patterns-${Date.now()}`,
    difficulty,
    tasks,
  };
}

const numberPatterns: GameDefinition<LevelSpec<NumberPatternsAnswer>, NumberPatternsAnswer> = {
  id: 'number-patterns',
  islandId: 'logic',
  name: 'game.numberPatterns.name',
  icon: '🔢',
  rulesKey: 'game.numberPatterns.rules',
  availableFor: ['grade1', 'grade2', 'grade3', 'grade4'],
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as NumberPatternsPayload;
    return { correct: answer === p.correct };
  },
  Renderer,
};

export default numberPatterns;
