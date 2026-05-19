import type { GameDefinition, LevelSpec, Task } from '../types';
import type { AgeGroupId } from '../../constants/ageGroups';
import { Renderer, type ChangedAnswer, type ChangedPayload } from './Renderer';

const TASKS_PER_LEVEL = 5;

const CATEGORIES: Record<string, string[]> = {
  fruits: ['🍎', '🍌', '🍐', '🍊', '🍇', '🍓', '🍒', '🍑'],
  animals: ['🐶', '🐱', '🐰', '🐻', '🦁', '🐸', '🦊', '🐼'],
  vehicles: ['🚗', '🚌', '🚲', '🚀', '🚂', '🚓', '🚑'],
  shapes: ['⭐', '🔺', '⚪', '🔶', '🔷', '🔸', '🟢'],
  nature: ['🌳', '🌸', '🌞', '🌙', '🌈', '❄️', '🌊'],
};

function emojiCategory(emoji: string): string | null {
  for (const [cat, items] of Object.entries(CATEGORIES)) {
    if (items.includes(emoji)) return cat;
  }
  return null;
}

function flatPool(): string[] {
  return Object.values(CATEGORIES).flat();
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

interface LevelConfig {
  itemCount: number;
  memorizeMs: number;
  subtleReplace: boolean;
  inputTimeLimitSec?: number;
}

function paramsFor(difficulty: number, ageGroupId: AgeGroupId | undefined): LevelConfig {
  const group = ageGroupId ?? 'preschool';
  if (group === 'preschool') {
    if (difficulty <= 1) return { itemCount: 3, memorizeMs: 3000, subtleReplace: false };
    if (difficulty === 2) return { itemCount: 4, memorizeMs: 3000, subtleReplace: false };
    return { itemCount: 4, memorizeMs: 2000, subtleReplace: false, inputTimeLimitSec: 8 };
  }
  if (group === 'grade1') {
    if (difficulty <= 1) return { itemCount: 4, memorizeMs: 3000, subtleReplace: false };
    if (difficulty === 2) return { itemCount: 5, memorizeMs: 2500, subtleReplace: false };
    return { itemCount: 5, memorizeMs: 2000, subtleReplace: false, inputTimeLimitSec: 8 };
  }
  if (group === 'grade2') {
    if (difficulty <= 1) return { itemCount: 5, memorizeMs: 2500, subtleReplace: false };
    if (difficulty === 2) return { itemCount: 6, memorizeMs: 2000, subtleReplace: false };
    return { itemCount: 6, memorizeMs: 2000, subtleReplace: true, inputTimeLimitSec: 6 };
  }
  // grade3
  if (difficulty <= 1) return { itemCount: 6, memorizeMs: 2000, subtleReplace: false };
  if (difficulty === 2) return { itemCount: 8, memorizeMs: 2000, subtleReplace: true };
  return { itemCount: 8, memorizeMs: 1500, subtleReplace: true, inputTimeLimitSec: 6 };
}

function pickReplacement(original: string, used: string[], subtle: boolean): string {
  const pool = subtle
    ? CATEGORIES[emojiCategory(original) ?? 'fruits']
    : flatPool();
  const candidates = pool.filter((e) => e !== original && !used.includes(e));
  if (candidates.length === 0) {
    const fallback = flatPool().filter((e) => e !== original && !used.includes(e));
    return fallback[randInt(0, fallback.length - 1)] ?? original;
  }
  return candidates[randInt(0, candidates.length - 1)];
}

// Build a thematic emoji pool for the entire round from 2-3 categories.
// This gives "Fruits + Animals" rounds instead of a random cross-category
// mix that looks incoherent across 5 tasks.
function buildRoundPool(): string[] {
  const categoryKeys = Object.keys(CATEGORIES);
  const shuffledKeys = shuffle(categoryKeys);
  const selectedKeys = shuffledKeys.slice(0, 2 + Math.floor(Math.random() * 2)); // 2 or 3 cats
  return selectedKeys.flatMap((k) => CATEGORIES[k]);
}

function generateTask(index: number, cfg: LevelConfig, roundPool: string[]): Task<ChangedAnswer> {
  const picked = shuffle(roundPool).slice(0, cfg.itemCount);
  const before = picked.slice();
  const after = picked.slice();
  const changedIndex = randInt(0, picked.length - 1);
  const replacement = pickReplacement(before[changedIndex], picked, cfg.subtleReplace);
  after[changedIndex] = replacement;

  const payload: ChangedPayload = {
    before,
    after,
    changedIndex,
    memorizeMs: cfg.memorizeMs,
    inputTimeLimitSec: cfg.inputTimeLimitSec,
  };
  return { id: `t${index}`, payload };
}

function generateLevel(difficulty: number, ageGroupId?: AgeGroupId): LevelSpec<ChangedAnswer> {
  const cfg = paramsFor(difficulty, ageGroupId);
  const roundPool = buildRoundPool();
  const tasks: Task<ChangedAnswer>[] = [];
  for (let i = 0; i < TASKS_PER_LEVEL; i++) {
    tasks.push(generateTask(i, cfg, roundPool));
  }
  return {
    seed: `whats-changed-${Date.now()}`,
    difficulty,
    tasks,
  };
}

const whatsChanged: GameDefinition<LevelSpec<ChangedAnswer>, ChangedAnswer> = {
  id: 'whats-changed',
  islandId: 'memory',
  name: 'game.whatsChanged.name',
  icon: '👁️',
  rulesKey: 'game.whatsChanged.rules',
  availableFor: ['preschool', 'grade1', 'grade2', 'grade3'],
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as ChangedPayload;
    return { correct: answer === p.changedIndex };
  },
  Renderer,
};

export default whatsChanged;
