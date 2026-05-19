import type { GameDefinition, LevelSpec, Task } from '../types';
import type { AgeGroupId } from '../../constants/ageGroups';
import {
  Renderer,
  type MemoryAnswer,
  type MemoryCard,
  type MemoryPayload,
} from '../memory-match/Renderer';

const TASKS_PER_LEVEL = 1;

interface SemanticPair {
  key: string;
  a: string;
  b: string;
}

const SEMANTIC_PAIRS: SemanticPair[] = [
  { key: 'cow-milk', a: '🐄', b: '🥛' },
  { key: 'bee-honey', a: '🐝', b: '🍯' },
  { key: 'hen-egg', a: '🐔', b: '🥚' },
  { key: 'rabbit-carrot', a: '🐰', b: '🥕' },
  { key: 'bird-nest', a: '🐦', b: '🪺' },
  { key: 'key-lock', a: '🔑', b: '🔒' },
  { key: 'rain-umbrella', a: '🌧️', b: '☂️' },
  { key: 'sun-sunglasses', a: '☀️', b: '🕶️' },
  { key: 'fish-rod', a: '🐟', b: '🎣' },
  { key: 'thread-needle', a: '🧵', b: '🪡' },
  { key: 'tooth-brush', a: '🦷', b: '🪥' },
  { key: 'snow-sled', a: '❄️', b: '🛷' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pairsFor(difficulty: number): number {
  if (difficulty <= 1) return 4;
  if (difficulty === 2) return 5;
  return 6;
}

function generateBoard(taskIndex: number, totalPairs: number): Task<MemoryAnswer> {
  const picked = shuffle(SEMANTIC_PAIRS).slice(0, totalPairs);
  const cards: MemoryCard[] = [];
  picked.forEach((pair) => {
    cards.push({ id: `t${taskIndex}-${pair.key}-a`, emoji: pair.a, pairKey: pair.key });
    cards.push({ id: `t${taskIndex}-${pair.key}-b`, emoji: pair.b, pairKey: pair.key });
  });
  const shuffled = shuffle(cards);
  const payload: MemoryPayload = { cards: shuffled, totalPairs };
  return { id: `t${taskIndex}`, payload };
}

function generateLevel(difficulty: number, _ageGroupId?: AgeGroupId): LevelSpec<MemoryAnswer> {
  const totalPairs = pairsFor(difficulty);
  const tasks: Task<MemoryAnswer>[] = [];
  for (let i = 0; i < TASKS_PER_LEVEL; i++) {
    tasks.push(generateBoard(i, totalPairs));
  }
  return {
    seed: `memory-associations-${Date.now()}`,
    difficulty,
    tasks,
  };
}

const memoryAssociations: GameDefinition<LevelSpec<MemoryAnswer>, MemoryAnswer> = {
  id: 'memory-associations',
  islandId: 'memory',
  name: 'game.memoryAssociations.name',
  icon: '🧩',
  rulesKey: 'game.memoryAssociations.rules',
  availableFor: ['preschool'],
  generateLevel,
  validateAnswer() {
    return { correct: true };
  },
  gradeFit: { kindergarten: true, grade1: true, grade2: true, grade3: true, grade4: true },
  Renderer,
};

export default memoryAssociations;
