import type { GameDefinition, LevelSpec, Task } from '../types';
import type { AgeGroupId } from '../../constants/ageGroups';
import { Renderer, type ColumnAnswer, type ColumnPayload } from './Renderer';

const TASKS_PER_LEVEL = 5;

interface LevelConfig {
  digitCountA: number;
  digitCountB: number;
  maxValue: number;
  withCarry: boolean;
  allowSubtraction: boolean;
}

function paramsFor(difficulty: number, ageGroupId: AgeGroupId | undefined): LevelConfig {
  const group = ageGroupId ?? 'grade1';

  if (group === 'grade1') {
    if (difficulty <= 1)
      return { digitCountA: 2, digitCountB: 1, maxValue: 50, withCarry: false, allowSubtraction: false };
    if (difficulty === 2)
      return { digitCountA: 2, digitCountB: 2, maxValue: 50, withCarry: false, allowSubtraction: false };
    return { digitCountA: 2, digitCountB: 2, maxValue: 50, withCarry: true, allowSubtraction: true };
  }

  if (group === 'grade2') {
    if (difficulty <= 1)
      return { digitCountA: 2, digitCountB: 2, maxValue: 99, withCarry: false, allowSubtraction: true };
    if (difficulty === 2)
      return { digitCountA: 2, digitCountB: 2, maxValue: 99, withCarry: true, allowSubtraction: true };
    return { digitCountA: 2, digitCountB: 2, maxValue: 99, withCarry: true, allowSubtraction: true };
  }

  if (group === 'grade3') {
    if (difficulty <= 1)
      return { digitCountA: 3, digitCountB: 3, maxValue: 999, withCarry: false, allowSubtraction: true };
    if (difficulty === 2)
      return { digitCountA: 3, digitCountB: 3, maxValue: 999, withCarry: true, allowSubtraction: true };
    return { digitCountA: 3, digitCountB: 3, maxValue: 999, withCarry: true, allowSubtraction: true };
  }

  // grade4
  if (difficulty <= 1)
    return { digitCountA: 3, digitCountB: 3, maxValue: 999, withCarry: true, allowSubtraction: true };
  if (difficulty === 2)
    return { digitCountA: 4, digitCountB: 4, maxValue: 9999, withCarry: true, allowSubtraction: true };
  return { digitCountA: 4, digitCountB: 4, maxValue: 9999, withCarry: true, allowSubtraction: true };
}

function randInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function hasCarry(a: number, b: number, op: '+' | '−', digitCount: number): boolean {
  const aStr = String(a).padStart(digitCount, '0');
  const bStr = String(b).padStart(digitCount, '0');
  if (op === '+') {
    let carry = 0;
    for (let i = digitCount - 1; i >= 0; i--) {
      const sum = parseInt(aStr[i], 10) + parseInt(bStr[i], 10) + carry;
      if (sum >= 10) return true;
      carry = 0;
    }
    return false;
  }
  let borrow = 0;
  for (let i = digitCount - 1; i >= 0; i--) {
    const ad = parseInt(aStr[i], 10) - borrow;
    const bd = parseInt(bStr[i], 10);
    if (ad < bd) return true;
    borrow = 0;
  }
  return false;
}

function minForDigits(digitCount: number): number {
  return digitCount === 1 ? 1 : Math.pow(10, digitCount - 1);
}

function generateTask(index: number, cfg: LevelConfig): Task<ColumnAnswer> {
  const op: '+' | '−' = cfg.allowSubtraction && Math.random() < 0.5 ? '−' : '+';
  const minA = minForDigits(cfg.digitCountA);
  const maxA = cfg.maxValue;
  const minB = minForDigits(cfg.digitCountB);
  const maxBUpper = Math.min(cfg.maxValue, Math.pow(10, cfg.digitCountB) - 1);

  let a = 0;
  let b = 0;
  for (let attempt = 0; attempt < 100; attempt++) {
    a = randInt(minA, maxA);
    if (op === '+') {
      b = randInt(minB, maxBUpper);
    } else {
      b = randInt(minB, Math.min(a, maxBUpper));
    }
    const resultWidth = Math.max(
      String(a).length,
      String(b).length,
      op === '+' ? String(a + b).length : String(a - b).length,
    );
    const carryCheck = hasCarry(a, b, op, Math.max(String(a).length, String(b).length));
    if (cfg.withCarry ? carryCheck : !carryCheck) {
      break;
    }
  }

  const correct = op === '+' ? a + b : a - b;
  const digitCount = Math.max(
    String(a).length,
    String(b).length,
    String(correct).length,
  );

  const payload: ColumnPayload = {
    a,
    b,
    op,
    correct,
    digitCount,
  };
  return { id: `t${index}`, payload };
}

function generateLevel(difficulty: number, ageGroupId?: AgeGroupId): LevelSpec<ColumnAnswer> {
  const cfg = paramsFor(difficulty, ageGroupId);
  const tasks: Task<ColumnAnswer>[] = [];
  for (let i = 0; i < TASKS_PER_LEVEL; i++) {
    tasks.push(generateTask(i, cfg));
  }
  return {
    seed: `column-arithmetic-${Date.now()}`,
    difficulty,
    tasks,
  };
}

const columnArithmetic: GameDefinition<LevelSpec<ColumnAnswer>, ColumnAnswer> = {
  id: 'column-arithmetic',
  islandId: 'math',
  name: 'game.columnArithmetic.name',
  icon: '📐',
  rulesKey: 'game.columnArithmetic.rules',
  availableFor: ['grade1', 'grade2', 'grade3', 'grade4'],
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as ColumnPayload;
    return { correct: answer === p.correct };
  },
  gradeFit: { kindergarten: true, grade1: true, grade2: true, grade3: true, grade4: true },
  Renderer,
};

export default columnArithmetic;
