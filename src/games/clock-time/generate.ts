import type { ClassLevel, Difficulty, GradeBand, LevelData, ProfileLevel, Round } from '../types';
import { gradeBandFor } from '../types';
import { randInt, shuffle } from '../shared/ui';

export type Mode = 'read' | 'elapsed' | 'convert';
export type ConvertKind = 'h2m' | 'm2h';

export interface ReadPayload {
  mode: 'read';
  /** 1-12 (band-вісь, класична 12h) або 0-23 (клас-вісь grade3 Hard/grade4, 24h). */
  h: number;
  m: number; // 0-59
  /** Дозволені хвилини рівня (11.10): відволікачі беруться з них — у 1 класі лише цілі години. */
  steps?: number[];
}

export interface ElapsedPayload {
  mode: 'elapsed';
  h: number; // початкова година 1-12
  m: number; // початкова хвилина 0-59
  deltaMin: number;
  resultH: number;
  resultM: number;
}

export interface ConvertPayload {
  mode: 'convert';
  kind: ConvertKind;
  value: number;
  result: number;
}

export type Payload = ReadPayload | ElapsedPayload | ConvertPayload;

const ROUNDS = 5;

export interface BandConfig {
  /** Дозволені хвилинні поділки циферблата для режиму 'read'. */
  steps: number[];
  /** Пул режимів раунду (5 елементів = ROUNDS); generate() перемішує його заново щоразу. */
  modes: Mode[];
}

/**
 * Хвилинні поділки + набір режимів раунду за узгодженою шкалою L0-L4 (D5).
 * Гра доступна лише профілю 'L3' (школярі, `levels: ['L3']`), тож реально
 * задіяні лише L2-L4 (Easy/Medium/Hard, значення точно як у попередній
 * difficulty-таблиці); L0-L1 — про запас на майбутнє розширення `levels`
 * (менше хвилинних поділок, лише читання циферблата — без elapsed/convert).
 */
export const CONFIG_BY_BAND: Record<GradeBand, BandConfig> = {
  L0: { steps: [0], modes: Array<Mode>(ROUNDS).fill('read') },
  L1: { steps: [0, 30], modes: Array<Mode>(ROUNDS).fill('read') },
  L2: { steps: [0, 30], modes: Array<Mode>(ROUNDS).fill('read') },
  L3: { steps: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55], modes: Array<Mode>(ROUNDS).fill('read') },
  L4: { steps: Array.from({ length: 60 }, (_, i) => i), modes: ['read', 'read', 'read', 'elapsed', 'convert'] },
};

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

export function fmt(h: number, m: number): string {
  return `${h}:${m.toString().padStart(2, '0')}`;
}

/** Додати deltaMin хвилин до h:m (12-годинний циферблат, h у діапазоні 1-12). */
export function addTime(h: number, m: number, deltaMin: number): { h: number; m: number } {
  const totalMin = (((h % 12) * 60 + m + deltaMin) % (12 * 60) + 12 * 60) % (12 * 60);
  let nh = Math.floor(totalMin / 60);
  const nm = totalMin % 60;
  if (nh === 0) nh = 12;
  return { h: nh, m: nm };
}

export function genRead(steps: number[], used: Set<string>, hourRange: [number, number] = [1, 12]): ReadPayload {
  let h = randInt(hourRange[0], hourRange[1]);
  let m = pick(steps);
  let guard = 0;
  while (used.has(`${h}:${m}`) && guard < 20) {
    h = randInt(hourRange[0], hourRange[1]);
    m = pick(steps);
    guard++;
  }
  used.add(`${h}:${m}`);
  return { mode: 'read', h, m, steps };
}

export interface ClassClockConfig {
  steps: number[];
  use24h: boolean;
  hourRange: [number, number];
}

/**
 * Клас × difficulty → хвилинна точність/24-годинний формат/діапазон годин
 * (G2b, перенесено 1:1 зі старого `paramsFor` у main). На відміну від
 * `CONFIG_BY_BAND` (band-вісь, тільки читання циферблата з фіксованим 12h),
 * ця вісь масштабує ТОЧНІСТЬ за НАВЧАЛЬНИМ КЛАСОМ: 1 клас — чверті години,
 * 2 клас — крок 5 хв, 3 клас — будь-яка хвилина (Hard додає 24h), 4 клас —
 * будь-яка хвилина + 24h завжди.
 */
export function paramsForClass(difficulty: Difficulty, classLevel: ClassLevel): ClassClockConfig {
  const steps5 = Array.from({ length: 12 }, (_, i) => i * 5);
  const stepsAny = Array.from({ length: 60 }, (_, i) => i);

  if (classLevel === 'preschool') {
    if (difficulty <= 1) return { steps: [0], use24h: false, hourRange: [1, 12] };
    return { steps: [0, 30], use24h: false, hourRange: [1, 12] };
  }
  // 11.10 програма Савченко: 1 клас — годинник у межах цілих годин; половини й чверті — сходинки вгору
  if (classLevel === 'grade1') {
    if (difficulty <= 1) return { steps: [0], use24h: false, hourRange: [1, 12] };
    if (difficulty === 2) return { steps: [0, 30], use24h: false, hourRange: [1, 12] };
    return { steps: [0, 15, 30, 45], use24h: false, hourRange: [1, 12] };
  }
  if (classLevel === 'grade2') {
    if (difficulty <= 1) return { steps: [0, 15, 30, 45], use24h: false, hourRange: [1, 12] };
    return { steps: steps5, use24h: false, hourRange: [1, 12] };
  }
  if (classLevel === 'grade3') {
    if (difficulty <= 1) return { steps: steps5, use24h: false, hourRange: [1, 12] };
    if (difficulty === 2) return { steps: stepsAny, use24h: false, hourRange: [1, 12] };
    return { steps: stepsAny, use24h: true, hourRange: [0, 23] };
  }
  // grade4
  return { steps: stepsAny, use24h: true, hourRange: [0, 23] };
}

export function genElapsed(): ElapsedPayload {
  const h = randInt(1, 12);
  const m = randInt(0, 59);
  const deltaMin = pick([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
  const { h: resultH, m: resultM } = addTime(h, m, deltaMin);
  return { mode: 'elapsed', h, m, deltaMin, resultH, resultM };
}

export function genConvert(): ConvertPayload {
  const kind: ConvertKind = Math.random() < 0.5 ? 'h2m' : 'm2h';
  if (kind === 'h2m') {
    const value = randInt(1, 6);
    return { mode: 'convert', kind, value, result: value * 60 };
  }
  const hours = randInt(1, 6);
  return { mode: 'convert', kind, value: hours * 60, result: hours };
}

export function correctFor(payload: Payload): string {
  if (payload.mode === 'read') return fmt(payload.h, payload.m);
  if (payload.mode === 'elapsed') return fmt(payload.resultH, payload.resultM);
  return String(payload.result);
}

export function generate(
  difficulty: Difficulty,
  level: ProfileLevel = 'L3',
  classLevel?: ClassLevel,
): LevelData<Payload, string> {
  if (classLevel) {
    const { steps, hourRange } = paramsForClass(difficulty, classLevel);
    const used = new Set<string>();
    const rounds: Round<Payload, string>[] = Array.from({ length: 5 }, (_, i) => {
      const payload = genRead(steps, used, hourRange);
      return { id: `r${i}`, payload, answer: correctFor(payload) };
    });
    return { difficulty, rounds };
  }

  const config = CONFIG_BY_BAND[gradeBandFor(level, difficulty)];
  const modes = shuffle(config.modes);
  const used = new Set<string>();
  const rounds: Round<Payload, string>[] = modes.map((mode, i) => {
    let payload: Payload;
    if (mode === 'elapsed') payload = genElapsed();
    else if (mode === 'convert') payload = genConvert();
    else payload = genRead(config.steps, used);
    return { id: `r${i}`, payload, answer: correctFor(payload) };
  });
  return { difficulty, rounds };
}
