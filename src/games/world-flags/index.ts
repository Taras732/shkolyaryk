import type { GameDefinition, LevelSpec, Task } from '../types';
import type { AgeGroupId } from '../../constants/ageGroups';
import { QuizRenderer, type QuizAnswer, type QuizPayload } from '../shared/QuizRenderer';

type Continent = 'europe' | 'asia' | 'africa' | 'north_america' | 'south_america' | 'oceania';

interface Country {
  flag: string;
  name: string;
  continent: Continent;
  /** 1 = very common/neighbor, 2 = common, 3 = less common */
  tier: 1 | 2 | 3;
}

const COUNTRIES: Country[] = [
  // Europe — neighbors/well-known
  { flag: '🇺🇦', name: 'Україна', continent: 'europe', tier: 1 },
  { flag: '🇵🇱', name: 'Польща', continent: 'europe', tier: 1 },
  { flag: '🇩🇪', name: 'Німеччина', continent: 'europe', tier: 1 },
  { flag: '🇫🇷', name: 'Франція', continent: 'europe', tier: 1 },
  { flag: '🇮🇹', name: 'Італія', continent: 'europe', tier: 1 },
  { flag: '🇬🇧', name: 'Велика Британія', continent: 'europe', tier: 1 },
  { flag: '🇪🇸', name: 'Іспанія', continent: 'europe', tier: 2 },
  { flag: '🇬🇷', name: 'Греція', continent: 'europe', tier: 2 },
  { flag: '🇳🇱', name: 'Нідерланди', continent: 'europe', tier: 3 },

  // Asia
  { flag: '🇯🇵', name: 'Японія', continent: 'asia', tier: 1 },
  { flag: '🇨🇳', name: 'Китай', continent: 'asia', tier: 1 },
  { flag: '🇰🇷', name: 'Південна Корея', continent: 'asia', tier: 2 },
  { flag: '🇮🇳', name: 'Індія', continent: 'asia', tier: 1 },
  { flag: '🇹🇷', name: 'Туреччина', continent: 'asia', tier: 1 },
  { flag: '🇹🇭', name: 'Таїланд', continent: 'asia', tier: 3 },

  // Africa
  { flag: '🇪🇬', name: 'Єгипет', continent: 'africa', tier: 1 },
  { flag: '🇿🇦', name: 'ПАР', continent: 'africa', tier: 2 },
  { flag: '🇰🇪', name: 'Кенія', continent: 'africa', tier: 3 },
  { flag: '🇲🇦', name: 'Марокко', continent: 'africa', tier: 3 },

  // North America
  { flag: '🇺🇸', name: 'США', continent: 'north_america', tier: 1 },
  { flag: '🇨🇦', name: 'Канада', continent: 'north_america', tier: 1 },
  { flag: '🇲🇽', name: 'Мексика', continent: 'north_america', tier: 2 },

  // South America
  { flag: '🇧🇷', name: 'Бразилія', continent: 'south_america', tier: 1 },
  { flag: '🇦🇷', name: 'Аргентина', continent: 'south_america', tier: 2 },
  { flag: '🇨🇴', name: 'Колумбія', continent: 'south_america', tier: 3 },

  // Oceania
  { flag: '🇦🇺', name: 'Австралія', continent: 'oceania', tier: 1 },
  { flag: '🇳🇿', name: 'Нова Зеландія', continent: 'oceania', tier: 2 },
];

const CONTINENT_LABELS: Record<Continent, string> = {
  europe: 'Європа',
  asia: 'Азія',
  africa: 'Африка',
  north_america: 'Північна Америка',
  south_america: 'Південна Америка',
  oceania: 'Австралія / Океанія',
};

const TASKS_PER_LEVEL = 5;

interface LevelConfig {
  maxTier: number;
  timeLimitSec?: number;
}

function paramsFor(difficulty: number, ageGroupId: AgeGroupId | undefined): LevelConfig {
  const group = ageGroupId ?? 'grade2';
  if (group === 'grade2') {
    if (difficulty <= 1) return { maxTier: 1 };
    if (difficulty === 2) return { maxTier: 2 };
    return { maxTier: 2 };
  }
  if (group === 'grade3') {
    if (difficulty <= 1) return { maxTier: 2 };
    if (difficulty === 2) return { maxTier: 3 };
    return { maxTier: 3, timeLimitSec: 10 };
  }
  // grade4
  if (difficulty <= 1) return { maxTier: 3 };
  if (difficulty === 2) return { maxTier: 3 };
  return { maxTier: 3, timeLimitSec: 8 };
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
  const pool = COUNTRIES.filter((c) => c.tier <= cfg.maxTier);
  const country = pick(pool);
  const allContinents: Continent[] = [
    'europe',
    'asia',
    'africa',
    'north_america',
    'south_america',
    'oceania',
  ];
  const distractors = shuffle(allContinents.filter((c) => c !== country.continent)).slice(0, 3);
  const choices = shuffle([country.continent, ...distractors]).map((c) => ({
    id: c,
    label: CONTINENT_LABELS[c],
  }));

  const payload: QuizPayload = {
    promptEmoji: country.flag,
    promptText: country.name,
    promptSecondary: 'На якому континенті?',
    choices,
    correctId: country.continent,
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
    seed: `world-flags-${Date.now()}`,
    difficulty,
    tasks,
  };
}

const worldFlags: GameDefinition<LevelSpec<QuizAnswer>, QuizAnswer> = {
  id: 'world-flags',
  islandId: 'geography',
  name: 'game.worldFlags.name',
  icon: '🏳️',
  rulesKey: 'game.worldFlags.rules',
  availableFor: ['grade2', 'grade3', 'grade4'],
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as QuizPayload;
    return { correct: answer === p.correctId };
  },
  gradeFit: { kindergarten: true, grade1: true, grade2: true, grade3: true, grade4: true },
  Renderer: QuizRenderer,
};

export default worldFlags;
