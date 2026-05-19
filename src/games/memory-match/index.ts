import type { GameDefinition, LevelSpec, Task } from '../types';
import type { AgeGroupId } from '../../constants/ageGroups';
import { Renderer, type MemoryAnswer, type MemoryCard, type MemoryPayload } from './Renderer';

const TASKS_PER_LEVEL = 1;

const EMOJI_POOL = [
  '🦁', '🐸', '🐵', '🦊', '🐼', '🐨', '🦉', '🐯',
  '🐧', '🐰', '🐻', '🐷', '🐮', '🦒', '🐺', '🐝',
];

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pairsFor(difficulty: number, ageGroupId: AgeGroupId | undefined): number {
  const group = ageGroupId ?? 'grade1';
  if (group === 'preschool') {
    if (difficulty <= 1) return 4;
    if (difficulty === 2) return 6;
    return 8;
  }
  if (group === 'grade1') {
    if (difficulty <= 1) return 6;
    if (difficulty === 2) return 8;
    return 10;
  }
  if (group === 'grade2') {
    if (difficulty <= 1) return 8;
    if (difficulty === 2) return 10;
    return 12;
  }
  // grade3
  if (difficulty <= 1) return 10;
  return 12;
}

function generateBoard(taskIndex: number, totalPairs: number): Task<MemoryAnswer> {
  const picked = shuffle(EMOJI_POOL).slice(0, totalPairs);
  const cards: MemoryCard[] = [];
  picked.forEach((emoji, pairIdx) => {
    const pairKey = `p${pairIdx}`;
    cards.push({ id: `t${taskIndex}-${pairKey}-a`, emoji, pairKey });
    cards.push({ id: `t${taskIndex}-${pairKey}-b`, emoji, pairKey });
  });
  const shuffled = shuffle(cards);
  const payload: MemoryPayload = { cards: shuffled, totalPairs };
  return { id: `t${taskIndex}`, payload };
}

function generateLevel(difficulty: number, ageGroupId?: AgeGroupId): LevelSpec<MemoryAnswer> {
  const totalPairs = pairsFor(difficulty, ageGroupId);
  const tasks: Task<MemoryAnswer>[] = [];
  for (let i = 0; i < TASKS_PER_LEVEL; i++) {
    tasks.push(generateBoard(i, totalPairs));
  }
  return {
    seed: `memory-match-${Date.now()}`,
    difficulty,
    tasks,
  };
}

const memoryMatch: GameDefinition<LevelSpec<MemoryAnswer>, MemoryAnswer> = {
  id: 'memory-match',
  islandId: 'memory',
  name: 'game.memoryMatch.name',
  icon: '🧠',
  rulesKey: 'game.memoryMatch.rules',
  availableFor: ['preschool', 'grade1', 'grade2', 'grade3'],
  generateLevel,
  validateAnswer() {
    return { correct: true };
  },
  gradeFit: { kindergarten: true, grade1: true, grade2: true, grade3: true, grade4: true },
  Renderer,
};

export default memoryMatch;
