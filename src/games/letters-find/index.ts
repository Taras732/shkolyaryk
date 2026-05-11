import type { GameDefinition, LevelSpec, Task } from '../types';
import { Renderer, type LetterAnswer, type LetterPayload } from './Renderer';

const TASKS_PER_LEVEL = 5;
const CANDIDATES_PER_TASK = 4;

// Full Ukrainian alphabet split by difficulty:
// diff1 — most common, visually distinct letters (good for first exposure)
// diff2 — adds letters with similar shapes or less frequent
// diff3 — full alphabet including rare/tricky ones
const POOL_BY_DIFFICULTY: Record<1 | 2 | 3, string[]> = {
  1: ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'І', 'К', 'Л', 'М', 'Н', 'О', 'П'],
  2: ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'І', 'К', 'Л', 'М', 'Н', 'О', 'П',
      'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Я'],
  3: ['А', 'Б', 'В', 'Г', 'Ґ', 'Д', 'Е', 'Є', 'Ж', 'З', 'И', 'І', 'Ї', 'Й', 'К',
      'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ',
      'Ь', 'Ю', 'Я'],
};

function poolFor(difficulty: number): string[] {
  if (difficulty <= 1) return POOL_BY_DIFFICULTY[1];
  if (difficulty === 2) return POOL_BY_DIFFICULTY[2];
  return POOL_BY_DIFFICULTY[3];
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

function pickCandidates(target: string, pool: string[]): string[] {
  const distractors = pool.filter((l) => l !== target);
  const picked = shuffle(distractors).slice(0, CANDIDATES_PER_TASK - 1);
  return shuffle([target, ...picked]);
}

function generateLevel(difficulty: number): LevelSpec<LetterAnswer> {
  const pool = poolFor(difficulty);
  // Shuffle the full pool and take TASKS_PER_LEVEL unique targets so
  // no letter repeats as the target within a single round.
  const targets = shuffle(pool).slice(0, TASKS_PER_LEVEL);

  const tasks: Task<LetterAnswer>[] = targets.map((target, i) => {
    const candidates = pickCandidates(target, pool);
    const payload: LetterPayload = { target, candidates };
    return { id: `t${i}`, payload };
  });

  return {
    seed: `letters-find-${Date.now()}`,
    difficulty,
    tasks,
  };
}

const lettersFind: GameDefinition<LevelSpec<LetterAnswer>, LetterAnswer> = {
  id: 'letters-find',
  islandId: 'letters',
  name: 'game.letters.name',
  icon: '🔤',
  rulesKey: 'game.letters.rules',
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as LetterPayload;
    return { correct: answer === p.target };
  },
  Renderer,
};

export default lettersFind;
