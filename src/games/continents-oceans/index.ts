import type { GameDefinition, LevelSpec, Task } from '../types';
import type { AgeGroupId } from '../../constants/ageGroups';
import { QuizRenderer, type QuizAnswer, type QuizPayload } from '../shared/QuizRenderer';

type Region =
  | 'europe'
  | 'asia'
  | 'africa'
  | 'north_america'
  | 'south_america'
  | 'oceania'
  | 'antarctica'
  | 'pacific'
  | 'atlantic'
  | 'indian'
  | 'arctic'
  | 'southern';

const REGION_LABELS: Record<Region, { label: string; emoji: string }> = {
  europe: { label: 'Європа', emoji: '🏰' },
  asia: { label: 'Азія', emoji: '🐼' },
  africa: { label: 'Африка', emoji: '🦁' },
  north_america: { label: 'Північна Америка', emoji: '🗽' },
  south_america: { label: 'Південна Америка', emoji: '🦥' },
  oceania: { label: 'Австралія / Океанія', emoji: '🦘' },
  antarctica: { label: 'Антарктида', emoji: '🐧' },
  pacific: { label: 'Тихий океан', emoji: '🌊' },
  atlantic: { label: 'Атлантичний океан', emoji: '⚓' },
  indian: { label: 'Індійський океан', emoji: '🐚' },
  arctic: { label: 'Північний Льодовитий океан', emoji: '🧊' },
  southern: { label: 'Південний океан', emoji: '❄️' },
};

const CONTINENTS: Region[] = [
  'europe',
  'asia',
  'africa',
  'north_america',
  'south_america',
  'oceania',
  'antarctica',
];

const OCEANS: Region[] = ['pacific', 'atlantic', 'indian', 'arctic', 'southern'];

interface FactQuiz {
  prompt: string;
  correct: Region;
  topic: 'continent' | 'ocean';
  tier: 1 | 2 | 3;
}

const FACTS: FactQuiz[] = [
  // Easy continent facts
  { prompt: 'На якому материку живуть кенгуру?', correct: 'oceania', topic: 'continent', tier: 1 },
  { prompt: 'Де знаходиться пустеля Сахара?', correct: 'africa', topic: 'continent', tier: 1 },
  { prompt: 'На якому материку живуть пінгвіни?', correct: 'antarctica', topic: 'continent', tier: 1 },
  { prompt: 'На якому материку розташована Україна?', correct: 'europe', topic: 'continent', tier: 1 },
  { prompt: 'Де живуть панди?', correct: 'asia', topic: 'continent', tier: 1 },
  { prompt: 'Де знаходиться Амазонка?', correct: 'south_america', topic: 'continent', tier: 2 },
  { prompt: 'На якому материку США і Канада?', correct: 'north_america', topic: 'continent', tier: 1 },
  { prompt: 'Де знаходиться найдовша річка Ніл?', correct: 'africa', topic: 'continent', tier: 2 },
  { prompt: 'Де Гімалаї і найвища гора Еверест?', correct: 'asia', topic: 'continent', tier: 2 },
  { prompt: 'Біля якого материка Великий бар\'єрний риф?', correct: 'oceania', topic: 'continent', tier: 3 },
  { prompt: 'Де знаходиться Великий каньйон?', correct: 'north_america', topic: 'continent', tier: 3 },

  // Ocean facts
  { prompt: 'Який океан найбільший?', correct: 'pacific', topic: 'ocean', tier: 1 },
  { prompt: 'Який океан оточує Північний полюс?', correct: 'arctic', topic: 'ocean', tier: 1 },
  { prompt: 'Який океан між Європою та Америкою?', correct: 'atlantic', topic: 'ocean', tier: 1 },
  { prompt: 'Який океан між Африкою та Австралією?', correct: 'indian', topic: 'ocean', tier: 2 },
  { prompt: 'Який океан оточує Антарктиду?', correct: 'southern', topic: 'ocean', tier: 3 },
  { prompt: 'Який океан найменший?', correct: 'arctic', topic: 'ocean', tier: 2 },
  { prompt: 'Який океан найхолодніший?', correct: 'arctic', topic: 'ocean', tier: 2 },
];

const TASKS_PER_LEVEL = 5;

interface LevelConfig {
  maxTier: number;
  topics: Array<'continent' | 'ocean'>;
  timeLimitSec?: number;
}

function paramsFor(difficulty: number, ageGroupId: AgeGroupId | undefined): LevelConfig {
  const group = ageGroupId ?? 'grade3';
  if (group === 'grade3') {
    if (difficulty <= 1) return { maxTier: 1, topics: ['continent'] };
    if (difficulty === 2) return { maxTier: 2, topics: ['continent', 'ocean'] };
    return { maxTier: 3, topics: ['continent', 'ocean'], timeLimitSec: 12 };
  }
  // grade4
  if (difficulty <= 1) return { maxTier: 2, topics: ['continent', 'ocean'] };
  if (difficulty === 2) return { maxTier: 3, topics: ['continent', 'ocean'] };
  return { maxTier: 3, topics: ['continent', 'ocean'], timeLimitSec: 10 };
}

function randInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
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
  const pool = FACTS.filter((f) => f.tier <= cfg.maxTier && cfg.topics.includes(f.topic));
  const fact = pick(pool.length > 0 ? pool : FACTS);
  const sameKindPool = fact.topic === 'continent' ? CONTINENTS : OCEANS;
  const distractors = shuffle(sameKindPool.filter((r) => r !== fact.correct)).slice(0, 3);
  const choices = shuffle([fact.correct, ...distractors]).map((r) => ({
    id: r,
    label: REGION_LABELS[r].label,
  }));

  const payload: QuizPayload = {
    promptEmoji: fact.topic === 'continent' ? '🌍' : '🌊',
    promptText: fact.prompt,
    choices,
    correctId: fact.correct,
    gridLayout: false,
  };
  return { id: `t${index}`, payload, timeLimitSec: cfg.timeLimitSec };
}

function generateLevel(difficulty: number, ageGroupId?: AgeGroupId): LevelSpec<QuizAnswer> {
  const cfg = paramsFor(difficulty, ageGroupId);
  const tasks: Task<QuizAnswer>[] = [];
  for (let i = 0; i < TASKS_PER_LEVEL; i++) {
    tasks.push(generateTask(i, cfg));
  }
  return {
    seed: `continents-oceans-${Date.now()}`,
    difficulty,
    tasks,
  };
}

const continentsOceans: GameDefinition<LevelSpec<QuizAnswer>, QuizAnswer> = {
  id: 'continents-oceans',
  islandId: 'geography',
  name: 'game.continentsOceans.name',
  icon: '🌍',
  rulesKey: 'game.continentsOceans.rules',
  availableFor: ['grade3', 'grade4'],
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as QuizPayload;
    return { correct: answer === p.correctId };
  },
  Renderer: QuizRenderer,
};

export default continentsOceans;
