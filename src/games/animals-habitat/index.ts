import type { GameDefinition, LevelSpec, Task } from '../types';
import {
  Renderer,
  type AnimalAnswer,
  type AnimalPayload,
  type HabitatId,
} from './Renderer';

const TASKS_PER_LEVEL = 5;

interface AnimalEntry {
  key: string;
  emoji: string;
  habitat: HabitatId;
}

const ANIMAL_POOL: AnimalEntry[] = [
  { key: 'fox', emoji: '🦊', habitat: 'forest' },
  { key: 'bear', emoji: '🐻', habitat: 'forest' },
  { key: 'owl', emoji: '🦉', habitat: 'forest' },
  { key: 'deer', emoji: '🦌', habitat: 'forest' },

  { key: 'dog', emoji: '🐶', habitat: 'home' },
  { key: 'cat', emoji: '🐱', habitat: 'home' },
  { key: 'cow', emoji: '🐄', habitat: 'home' },
  { key: 'horse', emoji: '🐴', habitat: 'home' },

  { key: 'fish', emoji: '🐟', habitat: 'sea' },
  { key: 'octopus', emoji: '🐙', habitat: 'sea' },
  { key: 'crab', emoji: '🦀', habitat: 'sea' },
  { key: 'dolphin', emoji: '🐬', habitat: 'sea' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateTask(index: number, pool: AnimalEntry[]): Task<AnimalAnswer> {
  const entry = pool[index % pool.length];
  const payload: AnimalPayload = {
    target: entry.habitat,
    emoji: entry.emoji,
    animalKey: entry.key,
  };
  return { id: `t${index}`, payload };
}

function generateLevel(difficulty: number): LevelSpec<AnimalAnswer> {
  const pool = shuffle(ANIMAL_POOL).slice(0, TASKS_PER_LEVEL);
  const tasks: Task<AnimalAnswer>[] = [];
  for (let i = 0; i < TASKS_PER_LEVEL; i++) {
    tasks.push(generateTask(i, pool));
  }
  return {
    seed: `animals-habitat-${Date.now()}`,
    difficulty,
    tasks,
  };
}

const animalsHabitat: GameDefinition<LevelSpec<AnimalAnswer>, AnimalAnswer> = {
  id: 'animals-habitat',
  islandId: 'science',
  name: 'game.animals.name',
  icon: '🔬',
  rulesKey: 'game.animals.rules',
  availableFor: ['preschool'],
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as AnimalPayload;
    return { correct: answer === p.target };
  },
  gradeFit: { kindergarten: true, grade1: true, grade2: true, grade3: true, grade4: true },
  Renderer,
};

export default animalsHabitat;
