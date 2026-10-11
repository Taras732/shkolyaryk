import type { ClassLevel, Difficulty, GradeBand, LevelData, ProfileLevel, Round } from '../types';
import { gradeBandFor } from '../types';
import { randInt } from '../shared/ui';

export interface Payload {
  a: number;
  b: number;
}

const ROUNDS_PER_LEVEL = 5;

interface Limits {
  maxA: number;
  maxB: number;
  maxSum: number;
}

/**
 * Межі доданків/суми за узгодженою шкалою L0-L4 (D5). Гра доступна лише
 * профілю 'L0' (дошкільнята, `levels: ['L0']`), тож реально задіяні лише
 * L0-L2 (Easy/Medium/Hard); L3-L4 — про запас на майбутнє розширення `levels`.
 */
export const LIMITS_BY_BAND: Record<GradeBand, Limits> = {
  L0: { maxA: 3, maxB: 3, maxSum: 6 },
  L1: { maxA: 5, maxB: 4, maxSum: 10 },
  L2: { maxA: 6, maxB: 5, maxSum: 10 },
  L3: { maxA: 8, maxB: 7, maxSum: 15 },
  L4: { maxA: 10, maxB: 9, maxSum: 20 },
};

export function generate(difficulty: Difficulty, level: ProfileLevel, classLevel?: ClassLevel): LevelData<Payload, number> {
  // 11.10: 1 клас — на предметах лише в межах 10 (програма Савченко), не до 15–20, як дав би шкільний трек
  const band = classLevel === 'grade1' ? (['L1', 'L2', 'L2'] as const)[difficulty - 1] : gradeBandFor(level, difficulty);
  const { maxA, maxB, maxSum } = LIMITS_BY_BAND[band];
  const used = new Set<string>();
  const rounds: Round<Payload, number>[] = [];
  for (let i = 0; i < ROUNDS_PER_LEVEL; i++) {
    let a = 1;
    let b = 1;
    let guard = 0;
    do {
      a = randInt(1, maxA);
      b = randInt(1, maxB);
      guard++;
    } while ((a + b > maxSum || used.has(`${a}+${b}`)) && guard < 40);
    used.add(`${a}+${b}`);
    rounds.push({ id: `r${i}`, payload: { a, b }, answer: a + b });
  }
  return { difficulty, rounds };
}
