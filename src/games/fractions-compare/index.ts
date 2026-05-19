import type { GameDefinition, LevelSpec, Task } from '../types';
import type { AgeGroupId } from '../../constants/ageGroups';
import {
  Renderer,
  type Fraction,
  type FractionCompareAnswer,
  type FractionComparePayload,
} from './Renderer';

const TASKS_PER_LEVEL = 5;
const FORCE_EQUAL_PROBABILITY = 0.3;

interface LevelConfig {
  denominators: number[];
  unitOnly: boolean; // numerator must be 1
  allowImproper: boolean; // numerator can be >= denominator
  showVisual: boolean;
  timeLimitSec?: number;
}

function paramsFor(difficulty: number, ageGroupId: AgeGroupId | undefined): LevelConfig {
  const group = ageGroupId ?? 'grade2';

  if (group === 'grade2') {
    if (difficulty <= 1)
      return { denominators: [2, 3, 4], unitOnly: true, allowImproper: false, showVisual: true };
    if (difficulty === 2)
      return {
        denominators: [2, 3, 4, 5, 6, 8],
        unitOnly: true,
        allowImproper: false,
        showVisual: true,
      };
    return {
      denominators: [2, 3, 4, 5, 6, 8],
      unitOnly: true,
      allowImproper: false,
      showVisual: true,
      timeLimitSec: 12,
    };
  }

  if (group === 'grade3') {
    if (difficulty <= 1)
      return {
        denominators: [2, 3, 4, 5, 6, 8],
        unitOnly: false,
        allowImproper: false,
        showVisual: true,
      };
    if (difficulty === 2)
      return {
        denominators: [2, 3, 4, 5, 6, 8],
        unitOnly: false,
        allowImproper: false,
        showVisual: true,
      };
    return {
      denominators: [2, 3, 4, 5, 6, 8],
      unitOnly: false,
      allowImproper: false,
      showVisual: true,
      timeLimitSec: 10,
    };
  }

  // grade4
  if (difficulty <= 1)
    return {
      denominators: [2, 3, 4, 5, 6, 8, 10],
      unitOnly: false,
      allowImproper: false,
      showVisual: true,
    };
  if (difficulty === 2)
    return {
      denominators: [2, 3, 4, 5, 6, 8, 10],
      unitOnly: false,
      allowImproper: false,
      showVisual: false,
    };
  return {
    denominators: [2, 3, 4, 5, 6, 8, 10],
    unitOnly: false,
    allowImproper: true,
    showVisual: false,
    timeLimitSec: 8,
  };
}

function randInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function pickFraction(cfg: LevelConfig): Fraction {
  const den = pick(cfg.denominators);
  const num = cfg.unitOnly ? 1 : cfg.allowImproper ? randInt(1, den + 3) : randInt(1, den - 1);
  return { numerator: num, denominator: den };
}

function fractionValue(f: Fraction): number {
  return f.numerator / f.denominator;
}

function fractionsEqual(a: Fraction, b: Fraction): boolean {
  return a.numerator * b.denominator === b.numerator * a.denominator;
}

function compareFractions(a: Fraction, b: Fraction): FractionCompareAnswer {
  if (fractionsEqual(a, b)) return '=';
  return fractionValue(a) > fractionValue(b) ? '>' : '<';
}

function makeEquivalent(f: Fraction, cfg: LevelConfig): Fraction | null {
  for (let mult = 2; mult <= 5; mult++) {
    const candidate: Fraction = { numerator: f.numerator * mult, denominator: f.denominator * mult };
    if (cfg.denominators.includes(candidate.denominator)) {
      return candidate;
    }
  }
  return null;
}

function generateTask(index: number, cfg: LevelConfig, allowEquals: boolean): Task<FractionCompareAnswer> {
  let left = pickFraction(cfg);
  let right = pickFraction(cfg);

  if (allowEquals && Math.random() < FORCE_EQUAL_PROBABILITY) {
    const equiv = makeEquivalent(left, cfg);
    if (equiv) {
      right = equiv;
    }
  }

  // avoid exact identical rendering (same numerator + denominator) unless forced
  let attempts = 0;
  while (
    left.numerator === right.numerator &&
    left.denominator === right.denominator &&
    attempts < 10
  ) {
    right = pickFraction(cfg);
    attempts++;
  }

  const correct = compareFractions(left, right);

  const payload: FractionComparePayload = {
    left,
    right,
    showVisual: cfg.showVisual && !cfg.allowImproper,
    correct,
    allowEquals,
  };
  return { id: `t${index}`, payload, timeLimitSec: cfg.timeLimitSec };
}

function generateLevel(difficulty: number, ageGroupId?: AgeGroupId): LevelSpec<FractionCompareAnswer> {
  const cfg = paramsFor(difficulty, ageGroupId);
  const allowEquals = (ageGroupId ?? 'grade2') !== 'grade2' || difficulty >= 1;
  const tasks: Task<FractionCompareAnswer>[] = [];
  for (let i = 0; i < TASKS_PER_LEVEL; i++) {
    tasks.push(generateTask(i, cfg, allowEquals));
  }
  return {
    seed: `fractions-compare-${Date.now()}`,
    difficulty,
    tasks,
  };
}

const fractionsCompare: GameDefinition<LevelSpec<FractionCompareAnswer>, FractionCompareAnswer> = {
  id: 'fractions-compare',
  islandId: 'math',
  name: 'game.fractionsCompare.name',
  icon: '🍰',
  rulesKey: 'game.fractionsCompare.rules',
  availableFor: ['grade2', 'grade3', 'grade4'],
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as FractionComparePayload;
    return { correct: answer === p.correct };
  },
  gradeFit: { kindergarten: true, grade1: true, grade2: true, grade3: true, grade4: true },
  Renderer,
};

export default fractionsCompare;
