import type { GameDefinition, LevelSpec, Task } from '../types';
import type { AgeGroupId } from '../../constants/ageGroups';
import { Renderer, type CompareAnswer, type ComparePayload } from './Renderer';

const TASKS_PER_LEVEL = 5;
const FORCE_EQUAL_PROBABILITY = 0.3;

type Op = '+' | '−' | '×' | '÷';

function randInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

interface LevelConfig {
  opsAllowed: Op[];
  addSubRange: [number, number];
  mulDivRange: [number, number];
  sideFormats: ['number' | 'expr', 'number' | 'expr'];
  useOrderOfOps: boolean;
  allowEquals: boolean;
  timeLimitSec?: number;
}

function paramsFor(difficulty: number, ageGroupId: AgeGroupId | undefined): LevelConfig {
  const group = ageGroupId ?? 'grade1';
  let opsAllowed: Op[] = ['+'];
  let addSubRange: [number, number] = [1, 10];
  let mulDivRange: [number, number] = [2, 5];
  let useOrderOfOps = false;
  let timerL3: number = 10;

  if (group === 'grade1') {
    opsAllowed = ['+'];
    addSubRange = [1, 10];
    timerL3 = 12;
  } else if (group === 'grade2') {
    opsAllowed = ['+', '−', '×', '÷'];
    addSubRange = [1, 10];
    mulDivRange = [2, 5];
    timerL3 = 10;
  } else if (group === 'grade3') {
    opsAllowed = ['+', '−', '×', '÷'];
    addSubRange = [10, 99];
    mulDivRange = [2, 9];
    timerL3 = 10;
  } else if (group === 'grade4') {
    opsAllowed = ['+', '−', '×', '÷'];
    addSubRange = [10, 100];
    mulDivRange = [2, 9];
    useOrderOfOps = true;
    timerL3 = 8;
  }

  let sideFormats: LevelConfig['sideFormats'] = ['number', 'number'];
  if (difficulty === 2) sideFormats = ['expr', 'number'];
  if (difficulty >= 3) sideFormats = ['expr', 'expr'];

  const allowEquals = difficulty >= 2;
  const timeLimitSec = difficulty >= 3 ? timerL3 : undefined;

  return {
    opsAllowed,
    addSubRange,
    mulDivRange,
    sideFormats,
    useOrderOfOps,
    allowEquals,
    timeLimitSec,
  };
}

interface Side {
  display: string;
  value: number;
}

function generateSimpleNumber(cfg: LevelConfig): Side {
  const value = randInt(cfg.addSubRange[0], cfg.addSubRange[1]);
  return { display: String(value), value };
}

function generateBasicExpr(cfg: LevelConfig): Side {
  const op = pick(cfg.opsAllowed);
  if (op === '+') {
    const a = randInt(cfg.addSubRange[0], cfg.addSubRange[1]);
    const b = randInt(cfg.addSubRange[0], cfg.addSubRange[1]);
    return { display: `${a}+${b}`, value: a + b };
  }
  if (op === '−') {
    const a = randInt(cfg.addSubRange[0], cfg.addSubRange[1]);
    const b = randInt(cfg.addSubRange[0], a);
    return { display: `${a}−${b}`, value: a - b };
  }
  if (op === '×') {
    const a = randInt(cfg.mulDivRange[0], cfg.mulDivRange[1]);
    const b = randInt(cfg.mulDivRange[0], cfg.mulDivRange[1]);
    return { display: `${a}×${b}`, value: a * b };
  }
  // ÷
  const divisor = randInt(cfg.mulDivRange[0], cfg.mulDivRange[1]);
  const quotient = randInt(cfg.mulDivRange[0], cfg.mulDivRange[1]);
  const dividend = divisor * quotient;
  return { display: `${dividend}÷${divisor}`, value: quotient };
}

function generateOrderOfOpsExpr(cfg: LevelConfig): Side {
  const hasMul = cfg.opsAllowed.includes('×') || cfg.opsAllowed.includes('÷');
  if (!hasMul) return generateBasicExpr(cfg);

  const addSubOp: Op = Math.random() < 0.5 ? '+' : '−';
  const mulDivOp: Op = Math.random() < 0.5 ? '×' : '÷';
  const mulFirst = Math.random() < 0.5;

  let mulDisplay: string;
  let mulValue: number;
  if (mulDivOp === '×') {
    const a = randInt(cfg.mulDivRange[0], cfg.mulDivRange[1]);
    const b = randInt(cfg.mulDivRange[0], cfg.mulDivRange[1]);
    mulDisplay = `${a}×${b}`;
    mulValue = a * b;
  } else {
    const divisor = randInt(cfg.mulDivRange[0], cfg.mulDivRange[1]);
    const quotient = randInt(cfg.mulDivRange[0], cfg.mulDivRange[1]);
    const dividend = divisor * quotient;
    mulDisplay = `${dividend}÷${divisor}`;
    mulValue = quotient;
  }

  for (let attempt = 0; attempt < 8; attempt++) {
    const a = randInt(cfg.addSubRange[0], cfg.addSubRange[1]);
    let value: number;
    let display: string;
    if (mulFirst) {
      value = addSubOp === '+' ? mulValue + a : mulValue - a;
      display = `${mulDisplay}${addSubOp}${a}`;
    } else {
      value = addSubOp === '+' ? a + mulValue : a - mulValue;
      display = `${a}${addSubOp}${mulDisplay}`;
    }
    if (value >= 0) return { display, value };
  }
  return generateBasicExpr(cfg);
}

function generateSide(cfg: LevelConfig, kind: 'number' | 'expr'): Side {
  if (kind === 'number') return generateSimpleNumber(cfg);
  if (cfg.useOrderOfOps && Math.random() < 0.6) return generateOrderOfOpsExpr(cfg);
  return generateBasicExpr(cfg);
}

function tryMakeEqual(cfg: LevelConfig, target: number, kind: 'number' | 'expr'): Side | null {
  if (kind === 'number') return { display: String(target), value: target };
  for (let i = 0; i < 12; i++) {
    const candidate = generateSide(cfg, 'expr');
    if (candidate.value === target) return candidate;
  }
  return null;
}

function compareSymbol(a: number, b: number): CompareAnswer {
  if (a > b) return '>';
  if (a < b) return '<';
  return '=';
}

function generateTask(index: number, cfg: LevelConfig): Task<CompareAnswer> {
  const [leftKind, rightKind] = cfg.sideFormats;
  const left = generateSide(cfg, leftKind);
  let right = generateSide(cfg, rightKind);

  if (cfg.allowEquals && Math.random() < FORCE_EQUAL_PROBABILITY) {
    const equalized = tryMakeEqual(cfg, left.value, rightKind);
    if (equalized) right = equalized;
  }

  const payload: ComparePayload = {
    leftDisplay: left.display,
    leftValue: left.value,
    rightDisplay: right.display,
    rightValue: right.value,
    correct: compareSymbol(left.value, right.value),
    allowEquals: cfg.allowEquals,
  };
  return { id: `t${index}`, payload, timeLimitSec: cfg.timeLimitSec };
}

function generateLevel(difficulty: number, ageGroupId?: AgeGroupId): LevelSpec<CompareAnswer> {
  const cfg = paramsFor(difficulty, ageGroupId);
  const tasks: Task<CompareAnswer>[] = [];
  for (let i = 0; i < TASKS_PER_LEVEL; i++) {
    tasks.push(generateTask(i, cfg));
  }
  return {
    seed: `math-compare-${Date.now()}`,
    difficulty,
    tasks,
  };
}

const mathCompare: GameDefinition<LevelSpec<CompareAnswer>, CompareAnswer> = {
  id: 'math-compare',
  islandId: 'math',
  name: 'game.mathCompare.name',
  icon: '⚖️',
  rulesKey: 'game.mathCompare.rules',
  availableFor: ['grade1', 'grade2', 'grade3', 'grade4'],
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as ComparePayload;
    return { correct: answer === p.correct };
  },
  gradeFit: { kindergarten: true, grade1: true, grade2: true, grade3: true, grade4: true },
  Renderer,
};

export default mathCompare;
