import type { GameDefinition, LevelSpec, Task } from '../types';
import { Renderer, type LetterAnswer, type LetterPayload } from './Renderer';

const TASKS_PER_LEVEL = 5;
const CANDIDATES_PER_TASK = 4;
const LETTER_POOL = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'І', 'К', 'Л', 'М', 'Н', 'О', 'П'];

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

function pickCandidates(target: string): string[] {
  const distractors = LETTER_POOL.filter((l) => l !== target);
  const picked = shuffle(distractors).slice(0, CANDIDATES_PER_TASK - 1);
  return shuffle([target, ...picked]);
}

function generateTask(index: number): Task<LetterAnswer> {
  const target = LETTER_POOL[randInt(0, LETTER_POOL.length - 1)];
  const candidates = pickCandidates(target);
  const payload: LetterPayload = { target, candidates };
  return { id: `t${index}`, payload };
}

function generateLevel(difficulty: number): LevelSpec<LetterAnswer> {
  const tasks: Task<LetterAnswer>[] = [];
  for (let i = 0; i < TASKS_PER_LEVEL; i++) {
    tasks.push(generateTask(i));
  }
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
  gradeFit: { kindergarten: true, grade1: true, grade2: true, grade3: true, grade4: true },
  Renderer,
};

export default lettersFind;
