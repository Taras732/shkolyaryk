import type { GameDefinition, LevelSpec, Task } from '../types';
import type { AgeGroupId } from '../../constants/ageGroups';
import {
  Renderer,
  type SortingAnswer,
  type SortingItem,
  type SortingPayload,
} from './Renderer';

const TASKS_PER_LEVEL = 5;

interface SortableSet {
  key: string;
  attrKey: string;
  // Items listed IN CORRECT ORDER (first → last).
  items: string[];
}

const SETS: SortableSet[] = [
  { key: 'plant', attrKey: 'game.sortingGame.attr.plant', items: ['🌱', '🌿', '🌸', '🍎'] },
  { key: 'butterfly', attrKey: 'game.sortingGame.attr.butterfly', items: ['🥚', '🐛', '🦋'] },
  { key: 'chicken', attrKey: 'game.sortingGame.attr.chicken', items: ['🥚', '🐣', '🐤', '🐓'] },
  { key: 'age', attrKey: 'game.sortingGame.attr.age', items: ['👶', '🧒', '👩', '👵'] },
  { key: 'day', attrKey: 'game.sortingGame.attr.day', items: ['🌅', '☀️', '🌆', '🌙'] },
  { key: 'seasons', attrKey: 'game.sortingGame.attr.seasons', items: ['🌷', '☀️', '🍂', '❄️'] },
  { key: 'moon', attrKey: 'game.sortingGame.attr.moon', items: ['🌑', '🌒', '🌓', '🌔', '🌕'] },
  { key: 'numbersAsc', attrKey: 'game.sortingGame.attr.numbersAsc', items: ['1', '2', '3', '4', '5'] },
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

interface LevelConfig {
  itemCount: number;
  inputTimeLimitSec?: number;
}

function paramsFor(difficulty: number, ageGroupId: AgeGroupId | undefined): LevelConfig {
  const group = ageGroupId ?? 'preschool';
  if (group === 'preschool') {
    if (difficulty <= 1) return { itemCount: 3 };
    if (difficulty === 2) return { itemCount: 3 };
    return { itemCount: 4, inputTimeLimitSec: 10 };
  }
  if (group === 'grade1') {
    if (difficulty <= 1) return { itemCount: 3 };
    if (difficulty === 2) return { itemCount: 4 };
    return { itemCount: 5, inputTimeLimitSec: 10 };
  }
  if (group === 'grade2') {
    if (difficulty <= 1) return { itemCount: 4 };
    if (difficulty === 2) return { itemCount: 5 };
    return { itemCount: 5, inputTimeLimitSec: 8 };
  }
  // grade3, grade4
  if (difficulty <= 1) return { itemCount: 5 };
  if (difficulty === 2) return { itemCount: 5 };
  return { itemCount: 5, inputTimeLimitSec: 6 };
}

// Sets too abstract for younger kids — moon phases (new→full moon cycle)
// require knowing the lunar cycle, which 3-8 y/o rarely do. Older only.
const OLDER_ONLY_SETS = new Set(['moon']);

// Pre-select a shuffled queue of sets for the full round so no set
// repeats within a single play (8 sets ≥ 5 tasks, so always unique).
function buildRoundQueue(minItems: number, ageGroupId: AgeGroupId | undefined): SortableSet[] {
  const group = ageGroupId ?? 'preschool';
  const isOlder = group === 'grade3' || group === 'grade4';
  let eligible = SETS.filter((s) => s.items.length >= minItems);
  if (!isOlder) eligible = eligible.filter((s) => !OLDER_ONLY_SETS.has(s.key));
  const pool = eligible.length > 0 ? eligible : SETS;
  return shuffle(pool);
}

function generateTask(index: number, cfg: LevelConfig, queue: SortableSet[]): Task<SortingAnswer> {
  const set = queue[index % queue.length];
  const count = Math.min(cfg.itemCount, set.items.length);
  const correctItems = set.items.slice(0, count);

  const correctOrder = correctItems.map((_, i) => `${set.key}-${i}`);
  const shuffledItems: SortingItem[] = correctItems.map((display, i) => ({
    id: `${set.key}-${i}`,
    display,
  }));
  const shuffled = shuffle(shuffledItems);

  const payload: SortingPayload = {
    setKey: set.key,
    attrKey: set.attrKey,
    correctOrder,
    shuffledOrder: shuffled,
    inputTimeLimitSec: cfg.inputTimeLimitSec,
  };
  return { id: `t${index}`, payload };
}

function generateLevel(difficulty: number, ageGroupId?: AgeGroupId): LevelSpec<SortingAnswer> {
  const cfg = paramsFor(difficulty, ageGroupId);
  const queue = buildRoundQueue(cfg.itemCount, ageGroupId);
  const tasks: Task<SortingAnswer>[] = [];
  for (let i = 0; i < TASKS_PER_LEVEL; i++) {
    tasks.push(generateTask(i, cfg, queue));
  }
  return {
    seed: `sorting-game-${Date.now()}`,
    difficulty,
    tasks,
  };
}

function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

const sortingGame: GameDefinition<LevelSpec<SortingAnswer>, SortingAnswer> = {
  id: 'sorting-game',
  islandId: 'logic',
  name: 'game.sortingGame.name',
  icon: '🔢',
  rulesKey: 'game.sortingGame.rules',
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as SortingPayload;
    return { correct: arraysEqual(answer, p.correctOrder) };
  },
  Renderer,
};

export default sortingGame;
