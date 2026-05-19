import type { GameDefinition, LevelSpec, Task } from '../types';
import { Renderer, type WordAnswer, type WordPicturePayload } from './Renderer';

const TASKS_PER_LEVEL = 5;
const OPTIONS_COUNT = 3;

interface VocabEntry {
  picture: string;
  word: string;
}

const VOCAB: VocabEntry[] = [
  { picture: '🐱', word: 'cat' },
  { picture: '🐶', word: 'dog' },
  { picture: '🐄', word: 'cow' },
  { picture: '🐴', word: 'horse' },
  { picture: '🐷', word: 'pig' },
  { picture: '🦁', word: 'lion' },
  { picture: '🐼', word: 'panda' },
  { picture: '🐸', word: 'frog' },
  { picture: '🍎', word: 'apple' },
  { picture: '🍌', word: 'banana' },
  { picture: '🥛', word: 'milk' },
  { picture: '🍞', word: 'bread' },
  { picture: '⚽', word: 'ball' },
  { picture: '🚗', word: 'car' },
  { picture: '🏠', word: 'house' },
  { picture: '📚', word: 'book' },
  { picture: '☀️', word: 'sun' },
  { picture: '🌙', word: 'moon' },
  { picture: '🌳', word: 'tree' },
  { picture: '🌸', word: 'flower' },
];

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

function generateTask(index: number): Task<WordAnswer> {
  const target = VOCAB[randInt(0, VOCAB.length - 1)];
  const distractors = shuffle(VOCAB.filter((v) => v.word !== target.word))
    .slice(0, OPTIONS_COUNT - 1)
    .map((v) => v.word);
  const options = shuffle([target.word, ...distractors]);
  const payload: WordPicturePayload = {
    picture: target.picture,
    word: target.word,
    options,
  };
  return { id: `t${index}`, payload };
}

function generateLevel(difficulty: number): LevelSpec<WordAnswer> {
  const tasks: Task<WordAnswer>[] = [];
  for (let i = 0; i < TASKS_PER_LEVEL; i++) {
    tasks.push(generateTask(i));
  }
  return {
    seed: `english-word-picture-${Date.now()}`,
    difficulty,
    tasks,
  };
}

const englishWordPicture: GameDefinition<LevelSpec<WordAnswer>, WordAnswer> = {
  id: 'english-word-picture',
  islandId: 'english',
  name: 'game.englishWord.name',
  icon: '🔤',
  rulesKey: 'game.englishWord.rules',
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as WordPicturePayload;
    return { correct: answer === p.word };
  },
  gradeFit: { kindergarten: true, grade1: true, grade2: true, grade3: true, grade4: true },
  Renderer,
};

export default englishWordPicture;
