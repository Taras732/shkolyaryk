import type { ClassLevel, Difficulty, GradeBand, LevelData, ProfileLevel, Round } from '../types';
import { gradeBandFor } from '../types';
import { randInt } from '../shared/ui';

export interface Payload {
  left: number;
  right: number;
  /** Текст лівої/правої сторони, коли це вираз (G2b, класи 2+): напр. "3×4+2". Відсутнє → показуємо просто число. */
  leftDisplay?: string;
  rightDisplay?: string;
}

export type Sign = '<' | '=' | '>';

const ROUNDS_PER_LEVEL = 5;
/** Шанс, що left і right навмисно зроблять рівними (щоб трапився знак '='). */
const EQUAL_PROBABILITY = 0.28;

/**
 * Гра спільна для профілю 'L0' (дошкільнята) і 'L3' (школярі), тож L0-L4
 * покриває ОБИДВА треки (D5): 'L0'-профіль → GradeBand L0-L2 (межа завжди 10,
 * без масштабування складністю — так само як у попередній версії), 'L3'-профіль
 * → GradeBand L2-L4 (100 → 1000 → 1000, стик на L2=100 як і раніше). Записи
 * поза власним треком гри — про запас на майбутнє розширення `levels`.
 *
 * FALLBACK-шлях (G2b): використовується, коли `classLevel` не передано, а
 * також для `classLevel === 'preschool'` — стара версія не мала дошкільного
 * треку в цій грі, тож дошкілля свідомо лишається на простому "лише числа"
 * шляху (без виразів/порядку дій), як і було.
 */
export const MAX_BY_TRACK: Record<ProfileLevel, Record<GradeBand, number>> = {
  L0: { L0: 10, L1: 10, L2: 10, L3: 20, L4: 50 },
  L3: { L0: 10, L1: 20, L2: 100, L3: 1000, L4: 1000 },
};

export function maxFor(level: ProfileLevel, difficulty: Difficulty): number {
  return MAX_BY_TRACK[level][gradeBandFor(level, difficulty)];
}

function compareSign(left: number, right: number): Sign {
  if (left < right) return '<';
  if (left > right) return '>';
  return '=';
}

// --- G2b: клас-масштаб з виразами (перенесено з `git show
// main:src/games/math-compare/index.ts`, paramsFor/generateSide) ---

type Op = '+' | '−' | '×' | '÷';
type SideKind = 'number' | 'expr';

interface Side {
  display: string;
  value: number;
}

interface ClassCompareCfg {
  opsAllowed: Op[];
  addSubRange: [number, number];
  mulDivRange: [number, number];
  /** grade4: expr-сторона іноді складається як (a op1 b) op2 c — навчає порядку дій. */
  useOrderOfOps: boolean;
}

/**
 * Клас-параметри: grade1 лише "+", 1-10; grade2 усі 4 дії, 1-10/2-5 (4 дії —
 * ключова відмінність grade1→grade2); grade3 ширші діапазони 10-99/2-9;
 * grade4 діапазон 10-100/2-9 + useOrderOfOps (напр. "3×4+2" замість простого
 * числа) — той самий діапазон, що й grade3, але змістовно складніше завдяки
 * порядку дій, а не просто більшим числам.
 */
export const CLASS_COMPARE_CFG: Record<ClassLevel, ClassCompareCfg> = {
  preschool: { opsAllowed: ['+'], addSubRange: [1, 10], mulDivRange: [2, 5], useOrderOfOps: false },
  // 11.10 програма Савченко: 1 клас — сума й різниця в межах 10; 2 клас — числа до 100 (сума ≤ 100), × і ÷ лише на 2 і 3
  grade1: { opsAllowed: ['+', '−'], addSubRange: [1, 10], mulDivRange: [2, 5], useOrderOfOps: false },
  grade2: { opsAllowed: ['+', '−', '×', '÷'], addSubRange: [10, 50], mulDivRange: [2, 3], useOrderOfOps: false },
  grade3: { opsAllowed: ['+', '−', '×', '÷'], addSubRange: [10, 99], mulDivRange: [2, 9], useOrderOfOps: false },
  grade4: { opsAllowed: ['+', '−', '×', '÷'], addSubRange: [10, 100], mulDivRange: [2, 9], useOrderOfOps: true },
};

/** difficulty у межах класу: 1=число/число, 2=вираз/число, 3=вираз/вираз (як у старій версії, незалежно від класу). */
function sideFormatsFor(difficulty: Difficulty): [SideKind, SideKind] {
  if (difficulty === 2) return ['expr', 'number'];
  if (difficulty >= 3) return ['expr', 'expr'];
  return ['number', 'number'];
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function generateSimpleNumber(cfg: ClassCompareCfg): Side {
  const value = randInt(cfg.addSubRange[0], cfg.addSubRange[1]);
  return { display: String(value), value };
}

function generateBasicExpr(cfg: ClassCompareCfg): Side {
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
  const divisor = randInt(cfg.mulDivRange[0], cfg.mulDivRange[1]);
  const quotient = randInt(cfg.mulDivRange[0], cfg.mulDivRange[1]);
  const dividend = divisor * quotient;
  return { display: `${dividend}÷${divisor}`, value: quotient };
}

/** Вираз із двох дій (множення/ділення + додавання/віднімання) — тренує порядок дій. */
function generateOrderOfOpsExpr(cfg: ClassCompareCfg): Side {
  const hasMul = cfg.opsAllowed.includes('×') || cfg.opsAllowed.includes('÷');
  if (!hasMul) return generateBasicExpr(cfg);

  const addSubOp: '+' | '−' = Math.random() < 0.5 ? '+' : '−';
  const mulDivOp: '×' | '÷' = Math.random() < 0.5 ? '×' : '÷';
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

function generateSide(cfg: ClassCompareCfg, kind: SideKind): Side {
  if (kind === 'number') return generateSimpleNumber(cfg);
  if (cfg.useOrderOfOps && Math.random() < 0.6) return generateOrderOfOpsExpr(cfg);
  return generateBasicExpr(cfg);
}

function tryMakeEqual(cfg: ClassCompareCfg, target: number, kind: SideKind): Side | null {
  if (kind === 'number') return { display: String(target), value: target };
  for (let i = 0; i < 12; i++) {
    const candidate = generateSide(cfg, 'expr');
    if (candidate.value === target) return candidate;
  }
  return null;
}

function genClassSides(classLevel: ClassLevel, difficulty: Difficulty): { left: Side; right: Side } {
  const cfg = CLASS_COMPARE_CFG[classLevel];
  const [leftKind, rightKind] = sideFormatsFor(difficulty);
  const left = generateSide(cfg, leftKind);
  let right = generateSide(cfg, rightKind);
  if (Math.random() < EQUAL_PROBABILITY) {
    const equalized = tryMakeEqual(cfg, left.value, rightKind);
    if (equalized) right = equalized;
  }
  return { left, right };
}

export function generate(
  difficulty: Difficulty,
  level: ProfileLevel,
  classLevel?: ClassLevel,
): LevelData<Payload, Sign> {
  const rounds: Round<Payload, Sign>[] = [];
  // preschool не мала цього треку в старій версії — лишаємо на fallback-шляху.
  const useClassPath = !!classLevel && classLevel !== 'preschool';

  for (let i = 0; i < ROUNDS_PER_LEVEL; i++) {
    if (useClassPath) {
      const { left, right } = genClassSides(classLevel as ClassLevel, difficulty);
      rounds.push({
        id: `r${i}`,
        payload: { left: left.value, right: right.value, leftDisplay: left.display, rightDisplay: right.display },
        answer: compareSign(left.value, right.value),
      });
    } else {
      const max = maxFor(level, difficulty);
      const left = randInt(1, max);
      const right = Math.random() < EQUAL_PROBABILITY ? left : randInt(1, max);
      rounds.push({ id: `r${i}`, payload: { left, right }, answer: compareSign(left, right) });
    }
  }
  return { difficulty, rounds };
}
