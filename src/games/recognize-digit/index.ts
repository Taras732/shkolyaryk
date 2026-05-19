import type { GameDefinition, LevelSpec, Task } from '../types';
import {
  Renderer,
  type RecognizeDigitAnswer,
  type RecognizeDigitMode,
  type RecognizeDigitPayload,
} from './Renderer';

const TASKS_PER_LEVEL = 5;
const MIN_NUMBER = 1;
const MAX_NUMBER = 10;
const CANDIDATES = 3;

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

function pickCandidates(target: number): number[] {
  const pool: number[] = [];
  for (let n = MIN_NUMBER; n <= MAX_NUMBER; n++) {
    if (n !== target) pool.push(n);
  }
  const distractors = shuffle(pool).slice(0, CANDIDATES - 1);
  return shuffle([target, ...distractors]);
}

function modeForDifficulty(difficulty: number): RecognizeDigitMode | 'mixed' {
  if (difficulty <= 1) return 'digit-to-qty';
  if (difficulty === 2) return 'qty-to-digit';
  return 'mixed';
}

function generateTask(index: number, difficulty: number): Task<RecognizeDigitAnswer> {
  const effectiveMode = modeForDifficulty(difficulty);
  const mode: RecognizeDigitMode =
    effectiveMode === 'mixed'
      ? Math.random() < 0.5
        ? 'digit-to-qty'
        : 'qty-to-digit'
      : effectiveMode;

  const target = randInt(MIN_NUMBER, MAX_NUMBER);
  const payload: RecognizeDigitPayload = {
    mode,
    correctNumber: target,
    candidates: pickCandidates(target),
  };
  return { id: `t${index}`, payload };
}

function generateLevel(difficulty: number): LevelSpec<RecognizeDigitAnswer> {
  const tasks: Task<RecognizeDigitAnswer>[] = [];
  for (let i = 0; i < TASKS_PER_LEVEL; i++) {
    tasks.push(generateTask(i, difficulty));
  }
  return {
    seed: `recognize-digit-${Date.now()}`,
    difficulty,
    tasks,
  };
}

const recognizeDigit: GameDefinition<LevelSpec<RecognizeDigitAnswer>, RecognizeDigitAnswer> = {
  id: 'recognize-digit',
  islandId: 'math',
  name: 'game.recognizeDigit.name',
  icon: '🔢',
  rulesKey: 'game.recognizeDigit.rules',
  availableFor: ['preschool'],
  levelLabels: {
    1: { emoji: '🔢', labelKey: 'game.recognizeDigit.mode.digitToQty' },
    2: { emoji: '🍎', labelKey: 'game.recognizeDigit.mode.qtyToDigit' },
    3: { emoji: '🔀', labelKey: 'game.recognizeDigit.mode.mixed' },
  },
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as RecognizeDigitPayload;
    return { correct: answer === p.correctNumber };
  },
  gradeFit: { kindergarten: true, grade1: true, grade2: true, grade3: true, grade4: true },
  Renderer,
};

export default recognizeDigit;
