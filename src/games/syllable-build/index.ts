import type { GameDefinition, LevelSpec, Task } from '../types';
import { Renderer, type SyllableAnswer, type SyllablePayload } from './Renderer';

const TASKS_PER_LEVEL = 5;
const OPTIONS_PER_TASK = 4;

const CONSONANTS = ['М', 'Б', 'П', 'Т', 'Д', 'Н', 'К', 'Г', 'Л', 'Р', 'С', 'З', 'В', 'Ф', 'Ш', 'Ж', 'Ч', 'Х'];
const VOWELS = ['А', 'О', 'У', 'И', 'Е', 'І'];

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

function pickOptions(target: string): string[] {
  const distractors = VOWELS.filter((v) => v !== target);
  const picked = shuffle(distractors).slice(0, OPTIONS_PER_TASK - 1);
  return shuffle([target, ...picked]);
}

function generateTask(index: number): Task<SyllableAnswer> {
  const consonant = CONSONANTS[randInt(0, CONSONANTS.length - 1)];
  const targetVowel = VOWELS[randInt(0, VOWELS.length - 1)];
  const options = pickOptions(targetVowel);
  const payload: SyllablePayload = { consonant, targetVowel, options };
  return { id: `t${index}`, payload };
}

function generateLevel(difficulty: number): LevelSpec<SyllableAnswer> {
  const tasks: Task<SyllableAnswer>[] = [];
  for (let i = 0; i < TASKS_PER_LEVEL; i++) {
    tasks.push(generateTask(i));
  }
  return {
    seed: `syllable-build-${Date.now()}`,
    difficulty,
    tasks,
  };
}

const syllableBuild: GameDefinition<LevelSpec<SyllableAnswer>, SyllableAnswer> = {
  id: 'syllable-build',
  islandId: 'letters',
  name: 'game.syllableBuild.name',
  icon: '🧩',
  rulesKey: 'game.syllableBuild.rules',
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as SyllablePayload;
    return { correct: answer === p.targetVowel };
  },
  gradeFit: { kindergarten: true, grade1: true, grade2: true, grade3: true, grade4: true },
  Renderer,
};

export default syllableBuild;
