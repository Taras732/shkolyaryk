import type { GameDefinition, LevelSpec, Task } from '../types';
import type { AgeGroupId } from '../../constants/ageGroups';
import {
  Renderer,
  type EmotionAnswer,
  type EmotionId,
  type EmotionPayload,
} from './Renderer';

const TASKS_PER_LEVEL = 5;
const CANDIDATES_PER_TASK = 3;

const EMOTIONS: Record<EmotionId, string> = {
  happy: '😀',
  sad: '😢',
  angry: '😠',
  scared: '😨',
  surprised: '😲',
  sleepy: '😴',
};

const EMOTION_IDS = Object.keys(EMOTIONS) as EmotionId[];

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

function pickCandidates(target: EmotionId): EmotionId[] {
  const distractors = EMOTION_IDS.filter((id) => id !== target);
  const picked = shuffle(distractors).slice(0, CANDIDATES_PER_TASK - 1);
  return shuffle([target, ...picked]);
}

function generateTask(index: number, showEmoji: boolean): Task<EmotionAnswer> {
  const target = EMOTION_IDS[randInt(0, EMOTION_IDS.length - 1)];
  const emoji = EMOTIONS[target];
  const candidates = pickCandidates(target);
  const candidateEmojis = showEmoji
    ? candidates.reduce<Record<string, string>>((acc, id) => {
        acc[id] = EMOTIONS[id];
        return acc;
      }, {})
    : undefined;
  const payload: EmotionPayload = { target, emoji, candidates, candidateEmojis };
  return { id: `t${index}`, payload };
}

function generateLevel(difficulty: number, ageGroupId?: AgeGroupId): LevelSpec<EmotionAnswer> {
  // Pre-readers can't read emotion names — show the face on each choice too.
  // Older groups keep text-only choices so they actually learn the words.
  const showEmoji = ageGroupId === 'preschool';
  const tasks: Task<EmotionAnswer>[] = [];
  for (let i = 0; i < TASKS_PER_LEVEL; i++) {
    tasks.push(generateTask(i, showEmoji));
  }
  return {
    seed: `emotions-recognize-${Date.now()}`,
    difficulty,
    tasks,
  };
}

const emotionsRecognize: GameDefinition<LevelSpec<EmotionAnswer>, EmotionAnswer> = {
  id: 'emotions-recognize',
  islandId: 'emotions',
  name: 'game.emotions.name',
  icon: '💚',
  rulesKey: 'game.emotions.rules',
  hasDifficulty: false,
  availableFor: ['preschool', 'grade1', 'grade2', 'grade3', 'grade4'],
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as EmotionPayload;
    return { correct: answer === p.target };
  },
  Renderer,
};

export default emotionsRecognize;
