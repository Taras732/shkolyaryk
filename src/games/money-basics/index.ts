import type { GameDefinition, LevelSpec, Task } from '../types';
import type { AgeGroupId } from '../../constants/ageGroups';
import {
  Renderer,
  type MoneyAnswer,
  type MoneyMode,
  type MoneyPayload,
} from './Renderer';
import type { MoneyUnit } from './Money';

const TASKS_PER_LEVEL = 5;
const CHOICES_COUNT = 4;

// All denominations in kopecks
// 10, 50 kop = coin. 100 = 1 грн (coin). 1000 = 10 грн (coin).
// 2000+ = bill.
const KOPECK_COINS = [10, 50];
const HRYVNIA_COINS = [100, 200, 500, 1000]; // 1, 2, 5, 10 грн
const HRYVNIA_BILLS_SMALL = [2000, 5000, 10000]; // 20, 50, 100
const HRYVNIA_BILLS_MED = [20000, 50000]; // 200, 500
const HRYVNIA_BILLS_BIG = [100000]; // 1000

interface LevelConfig {
  mode: MoneyMode;
  maxAmountKop: number;
  denominations: number[];
  pileSize: [number, number]; // min, max items (for count/change context)
  timeLimitSec?: number;
}

function denominationsForClass(ageGroupId: AgeGroupId, includeKopecks: boolean): number[] {
  const withKop = includeKopecks ? KOPECK_COINS : [];
  if (ageGroupId === 'grade1') {
    return [...HRYVNIA_COINS, 2000];
  }
  if (ageGroupId === 'grade2') {
    return [...HRYVNIA_COINS, ...HRYVNIA_BILLS_SMALL];
  }
  if (ageGroupId === 'grade3') {
    return [...withKop, ...HRYVNIA_COINS, ...HRYVNIA_BILLS_SMALL, ...HRYVNIA_BILLS_MED];
  }
  // grade4
  return [
    ...withKop,
    ...HRYVNIA_COINS,
    ...HRYVNIA_BILLS_SMALL,
    ...HRYVNIA_BILLS_MED,
    ...HRYVNIA_BILLS_BIG,
  ];
}

function paramsFor(difficulty: number, ageGroupId: AgeGroupId | undefined): LevelConfig {
  const group = ageGroupId ?? 'grade1';
  const mode: MoneyMode = difficulty <= 1 ? 'count' : difficulty === 2 ? 'pay' : 'change';
  const includeKop = group === 'grade3' || group === 'grade4';
  const denominations = denominationsForClass(group, includeKop);

  let maxAmountKop = 5000;
  let pileSize: [number, number] = [2, 4];
  let timeLimitSec: number | undefined;

  if (group === 'grade1') {
    maxAmountKop = 5000; // 50 грн
    pileSize = [2, 4];
  } else if (group === 'grade2') {
    maxAmountKop = 10000; // 100 грн
    pileSize = [3, 5];
  } else if (group === 'grade3') {
    maxAmountKop = 100000; // 1000 грн
    pileSize = [3, 6];
    // change mode here deals with amounts in the thousands of kopecks — no timer,
    // 7-8 y.o. can't compute change that large mentally under pressure.
    timeLimitSec = undefined;
  } else {
    // grade4: keep a timer on change, but gentler than before (was 10s).
    maxAmountKop = 1000000; // 10000 грн
    pileSize = [4, 7];
    if (difficulty >= 3) timeLimitSec = 16;
  }

  return { mode, maxAmountKop, denominations, pileSize, timeLimitSec };
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

function generatePile(cfg: LevelConfig): { pile: MoneyUnit[]; totalKop: number } {
  const count = randInt(cfg.pileSize[0], cfg.pileSize[1]);
  const pile: MoneyUnit[] = [];
  let total = 0;
  for (let i = 0; i < count; i++) {
    const candidates = cfg.denominations.filter((d) => total + d <= cfg.maxAmountKop);
    if (candidates.length === 0) break;
    const val = pick(candidates);
    pile.push({ valueKop: val });
    total += val;
  }
  return { pile, totalKop: total };
}

function generateChoices(correct: number, cfg: LevelConfig): number[] {
  const pool = new Set<number>([correct]);
  const minDenom = Math.min(...cfg.denominations);
  const step = Math.max(minDenom, Math.round(correct * 0.1) || minDenom);
  const candidates = [
    correct + step,
    correct - step,
    correct + step * 2,
    correct - step * 2,
    correct + Math.min(...cfg.denominations),
    correct - Math.min(...cfg.denominations),
  ];
  for (const c of candidates) {
    if (c > 0 && !pool.has(c)) {
      pool.add(c);
      if (pool.size >= CHOICES_COUNT) break;
    }
  }
  let fallback = step;
  while (pool.size < CHOICES_COUNT && fallback <= correct + step * 10) {
    const cand = correct + fallback;
    if (cand > 0 && !pool.has(cand)) pool.add(cand);
    fallback += step;
  }
  while (pool.size < CHOICES_COUNT) {
    const cand = correct - Math.random() * step;
    const rounded = Math.max(minDenom, Math.round(cand / minDenom) * minDenom);
    if (!pool.has(rounded)) pool.add(rounded);
  }
  return shuffle(Array.from(pool).slice(0, CHOICES_COUNT));
}

function roundToDenomination(kop: number, denominations: number[]): number {
  // Prefer rounding to the smallest denomination available
  const minDenom = Math.min(...denominations);
  return Math.max(minDenom, Math.round(kop / minDenom) * minDenom);
}

function generateCountTask(index: number, cfg: LevelConfig): Task<MoneyAnswer> {
  const { pile, totalKop } = generatePile(cfg);
  const choices = generateChoices(totalKop, cfg);
  const payload: MoneyPayload = {
    mode: 'count',
    pile,
    choicesKop: choices,
    correctKop: totalKop,
  };
  return { id: `t${index}`, payload, timeLimitSec: cfg.timeLimitSec };
}

function generatePayTask(index: number, cfg: LevelConfig): Task<MoneyAnswer> {
  // Pick a target amount that can be composed from denominations
  let target = 0;
  for (let attempt = 0; attempt < 50; attempt++) {
    const sample = generatePile(cfg);
    if (sample.totalKop > 0 && sample.totalKop <= cfg.maxAmountKop) {
      target = sample.totalKop;
      break;
    }
  }
  if (target === 0) target = cfg.denominations[0];

  const payload: MoneyPayload = {
    mode: 'pay',
    targetKop: target,
    availableDenominations: cfg.denominations,
    correctKop: target,
  };
  return { id: `t${index}`, payload, timeLimitSec: cfg.timeLimitSec };
}

function generateChangeTask(index: number, cfg: LevelConfig): Task<MoneyAnswer> {
  // Price: random amount < maxAmountKop
  const { totalKop: price } = generatePile(cfg);

  // Paid: choose paid amount that's >= price + some change, also valid denomination
  const minDenom = Math.min(...cfg.denominations);
  const desiredChange = roundToDenomination(randInt(minDenom, Math.max(minDenom * 4, price)), cfg.denominations);
  let paid = price + desiredChange;
  // Round paid to clean amount
  paid = roundToDenomination(paid, cfg.denominations);
  if (paid <= price) paid = price + minDenom;

  const change = paid - price;
  const choices = generateChoices(change, cfg);

  const payload: MoneyPayload = {
    mode: 'change',
    priceKop: price,
    paidKop: paid,
    choicesKop: choices,
    correctKop: change,
  };
  return { id: `t${index}`, payload, timeLimitSec: cfg.timeLimitSec };
}

function generateTask(index: number, cfg: LevelConfig): Task<MoneyAnswer> {
  if (cfg.mode === 'count') return generateCountTask(index, cfg);
  if (cfg.mode === 'pay') return generatePayTask(index, cfg);
  return generateChangeTask(index, cfg);
}

function generateLevel(difficulty: number, ageGroupId?: AgeGroupId): LevelSpec<MoneyAnswer> {
  const cfg = paramsFor(difficulty, ageGroupId);
  const tasks: Task<MoneyAnswer>[] = [];
  for (let i = 0; i < TASKS_PER_LEVEL; i++) {
    tasks.push(generateTask(i, cfg));
  }
  return {
    seed: `money-basics-${Date.now()}`,
    difficulty,
    tasks,
  };
}

const moneyBasics: GameDefinition<LevelSpec<MoneyAnswer>, MoneyAnswer> = {
  id: 'money-basics',
  islandId: 'math',
  name: 'game.moneyBasics.name',
  icon: '💰',
  rulesKey: 'game.moneyBasics.rules',
  availableFor: ['grade1', 'grade2', 'grade3', 'grade4'],
  levelLabels: {
    1: { emoji: '🪙', labelKey: 'game.moneyBasics.mode.count' },
    2: { emoji: '💳', labelKey: 'game.moneyBasics.mode.pay' },
    3: { emoji: '💵', labelKey: 'game.moneyBasics.mode.change' },
  },
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as MoneyPayload;
    return { correct: answer === p.correctKop };
  },
  Renderer,
};

export default moneyBasics;
