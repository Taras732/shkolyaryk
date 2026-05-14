import type { GameDefinition, LevelSpec, Task } from '../types';
import type { AgeGroupId } from '../../constants/ageGroups';
import type { EmotionId } from '../emotions-recognize/Renderer';
import {
  Renderer,
  type HeroEmotionAnswer,
  type HeroEmotionPayload,
  type HeroSituationId,
} from './Renderer';

const TASKS_PER_LEVEL = 5;
const CANDIDATES_PER_TASK = 3;

interface Situation {
  id: HeroSituationId;
  sceneEmoji: string;
  target: EmotionId;
}

const SITUATIONS: Situation[] = [
  { id: 'birthday',    sceneEmoji: '🎂', target: 'happy' },
  { id: 'rainStuck',   sceneEmoji: '🌧️', target: 'sad' },
  { id: 'puppy',       sceneEmoji: '🐶', target: 'happy' },
  { id: 'bigAnimal',   sceneEmoji: '🦁', target: 'scared' },
  { id: 'toyBroke',    sceneEmoji: '🧸', target: 'sad' },
  { id: 'gift',        sceneEmoji: '🎁', target: 'surprised' },
  { id: 'toySnatched', sceneEmoji: '😤', target: 'angry' },
  { id: 'wonGame',     sceneEmoji: '🏆', target: 'happy' },
  { id: 'fire',        sceneEmoji: '🔥', target: 'scared' },
  { id: 'lostToy',     sceneEmoji: '❓', target: 'sad' },
];

const ALL_EMOTION_IDS: EmotionId[] = ['happy', 'sad', 'angry', 'scared', 'surprised', 'sleepy'];

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickCandidates(target: EmotionId): EmotionId[] {
  const distractors = ALL_EMOTION_IDS.filter((id) => id !== target);
  const picked = shuffle(distractors).slice(0, CANDIDATES_PER_TASK - 1);
  return shuffle([target, ...picked]);
}

function timerFor(group: AgeGroupId): number {
  switch (group) {
    case 'preschool': return 16;
    case 'grade1':    return 14;
    case 'grade2':    return 12;
    case 'grade3':    return 10;
    case 'grade4':    return 8;
    default:          return 12;
  }
}

function generateTask(situation: Situation, index: number, timeLimitSec?: number): Task<HeroEmotionAnswer> {
  const candidates = pickCandidates(situation.target);
  const payload: HeroEmotionPayload = {
    situationId: situation.id,
    sceneEmoji: situation.sceneEmoji,
    target: situation.target,
    candidates,
  };
  return { id: `t${index}-${situation.id}`, payload, timeLimitSec };
}

function generateLevel(difficulty: number, ageGroupId?: AgeGroupId): LevelSpec<HeroEmotionAnswer> {
  const group = ageGroupId ?? 'grade1';
  const hasTimer = difficulty >= 3;
  const timeLimitSec = hasTimer ? timerFor(group) : undefined;

  const pool = shuffle(SITUATIONS).slice(0, TASKS_PER_LEVEL);
  const tasks: Task<HeroEmotionAnswer>[] = pool.map((s, i) => generateTask(s, i, timeLimitSec));

  return { seed: `hero-emotion-${Date.now()}`, difficulty, tasks };
}

const heroEmotion: GameDefinition<LevelSpec<HeroEmotionAnswer>, HeroEmotionAnswer> = {
  id: 'hero-emotion',
  islandId: 'emotions',
  name: 'game.heroEmotion.name',
  icon: '🎭',
  rulesKey: 'game.heroEmotion.rules',
  hasDifficulty: true,
  availableFor: ['preschool', 'grade1', 'grade2', 'grade3', 'grade4'],
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as HeroEmotionPayload;
    return { correct: answer === p.target };
  },
  Renderer,
};

export default heroEmotion;
