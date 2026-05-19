import type { GameDefinition, LevelSpec, Task } from '../types';
import type { AgeGroupId } from '../../constants/ageGroups';
import { QuizRenderer, type QuizAnswer, type QuizPayload } from '../shared/QuizRenderer';

interface Symbol {
  key: string;
  emoji: string;
  name: string;
  description: string;
}

const SYMBOLS: Symbol[] = [
  { key: 'flag', emoji: '🇺🇦', name: 'Прапор України', description: 'Синьо-жовтий прапор — символ неба й пшениці' },
  { key: 'trident', emoji: '⚜️', name: 'Тризуб', description: 'Герб України — тризубець' },
  { key: 'sunflower', emoji: '🌻', name: 'Соняшник', description: 'Національна квітка України' },
  { key: 'viburnum', emoji: '🍒', name: 'Калина', description: 'Червона калина — символ краси України' },
  { key: 'stork', emoji: '🦢', name: 'Лелека', description: 'Птах, що приносить щастя' },
  { key: 'vyshyvanka', emoji: '👕', name: 'Вишиванка', description: 'Традиційна сорочка з вишивкою' },
  { key: 'pysanka', emoji: '🥚', name: 'Писанка', description: 'Розписане великоднє яйце' },
  { key: 'kyiv', emoji: '🏛️', name: 'Золоті ворота Києва', description: 'Стара пам\'ятка в столиці' },
  { key: 'map', emoji: '🗺️', name: 'Карта України', description: 'Обриси нашої країни' },
];

const TASKS_PER_LEVEL = 5;

interface LevelConfig {
  poolSize: number;
  choicesCount: number;
  mode: 'emoji-to-name' | 'name-to-emoji' | 'mixed';
}

function paramsFor(difficulty: number, ageGroupId: AgeGroupId | undefined): LevelConfig {
  const group = ageGroupId ?? 'grade1';
  const poolSize = group === 'grade1' ? 6 : group === 'grade2' ? 7 : 9;
  if (difficulty <= 1) return { poolSize, choicesCount: 3, mode: 'emoji-to-name' };
  if (difficulty === 2) return { poolSize, choicesCount: 3, mode: 'name-to-emoji' };
  return { poolSize, choicesCount: 4, mode: 'mixed' };
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

function generateTask(index: number, cfg: LevelConfig): Task<QuizAnswer> {
  const pool = shuffle(SYMBOLS).slice(0, cfg.poolSize);
  const target = pool[randInt(0, pool.length - 1)];
  const distractors = shuffle(pool.filter((s) => s.key !== target.key)).slice(0, cfg.choicesCount - 1);

  const effectiveMode =
    cfg.mode === 'mixed' ? (Math.random() < 0.5 ? 'emoji-to-name' : 'name-to-emoji') : cfg.mode;

  let payload: QuizPayload;
  if (effectiveMode === 'emoji-to-name') {
    payload = {
      promptEmoji: target.emoji,
      promptText: 'Як називається цей символ?',
      choices: shuffle([target, ...distractors]).map((s) => ({ id: s.key, label: s.name })),
      correctId: target.key,
      gridLayout: false,
    };
  } else {
    payload = {
      promptText: target.name,
      promptSecondary: 'Обери символ',
      choices: shuffle([target, ...distractors]).map((s) => ({
        id: s.key,
        label: s.name,
        emoji: s.emoji,
      })),
      correctId: target.key,
      gridLayout: true,
    };
  }
  return { id: `t${index}`, payload };
}

function generateLevel(difficulty: number, ageGroupId?: AgeGroupId): LevelSpec<QuizAnswer> {
  const cfg = paramsFor(difficulty, ageGroupId);
  const tasks: Task<QuizAnswer>[] = [];
  for (let i = 0; i < TASKS_PER_LEVEL; i++) {
    tasks.push(generateTask(i, cfg));
  }
  return {
    seed: `ua-symbols-${Date.now()}`,
    difficulty,
    tasks,
  };
}

const uaSymbols: GameDefinition<LevelSpec<QuizAnswer>, QuizAnswer> = {
  id: 'ua-symbols',
  islandId: 'geography',
  name: 'game.uaSymbols.name',
  icon: '🇺🇦',
  rulesKey: 'game.uaSymbols.rules',
  availableFor: ['grade1', 'grade2', 'grade3', 'grade4'],
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as QuizPayload;
    return { correct: answer === p.correctId };
  },
  gradeFit: { kindergarten: true, grade1: true, grade2: true, grade3: true, grade4: true },
  Renderer: QuizRenderer,
};

export default uaSymbols;
