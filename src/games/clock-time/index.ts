import type { GameDefinition, LevelSpec, Task } from '../types';
import type { AgeGroupId } from '../../constants/ageGroups';
import {
  Renderer,
  type ClockMode,
  type ClockTime,
  type ClockTimeAnswer,
  type ClockTimePayload,
} from './Renderer';

const TASKS_PER_LEVEL = 5;
const CHOICES_COUNT = 4;

interface LevelConfig {
  minuteSteps: number[]; // which minute values are allowed
  use24h: boolean;
  hourRange: [number, number]; // inclusive
  timeLimitSec?: number;
}

function paramsFor(difficulty: number, ageGroupId: AgeGroupId | undefined): LevelConfig {
  const group = ageGroupId ?? 'grade1';

  if (group === 'preschool') {
    if (difficulty <= 1) return { minuteSteps: [0], use24h: false, hourRange: [1, 12] };
    return { minuteSteps: [0, 30], use24h: false, hourRange: [1, 12] };
  }

  if (group === 'grade1') {
    if (difficulty <= 1) return { minuteSteps: [0, 30], use24h: false, hourRange: [1, 12] };
    if (difficulty === 2) return { minuteSteps: [0, 15, 30, 45], use24h: false, hourRange: [1, 12] };
    return { minuteSteps: [0, 15, 30, 45], use24h: false, hourRange: [1, 12], timeLimitSec: 12 };
  }

  if (group === 'grade2') {
    if (difficulty <= 1) return { minuteSteps: [0, 15, 30, 45], use24h: false, hourRange: [1, 12] };
    if (difficulty === 2) {
      const steps: number[] = [];
      for (let m = 0; m < 60; m += 5) steps.push(m);
      return { minuteSteps: steps, use24h: false, hourRange: [1, 12] };
    }
    const steps: number[] = [];
    for (let m = 0; m < 60; m += 5) steps.push(m);
    return { minuteSteps: steps, use24h: false, hourRange: [1, 12], timeLimitSec: 10 };
  }

  if (group === 'grade3') {
    const steps5: number[] = [];
    for (let m = 0; m < 60; m += 5) steps5.push(m);
    const stepsAny: number[] = [];
    for (let m = 0; m < 60; m++) stepsAny.push(m);

    if (difficulty <= 1) return { minuteSteps: steps5, use24h: false, hourRange: [1, 12] };
    if (difficulty === 2) return { minuteSteps: stepsAny, use24h: false, hourRange: [1, 12] };
    return { minuteSteps: stepsAny, use24h: true, hourRange: [0, 23], timeLimitSec: 8 };
  }

  // grade4
  const stepsAny: number[] = [];
  for (let m = 0; m < 60; m++) stepsAny.push(m);
  if (difficulty <= 1) return { minuteSteps: stepsAny, use24h: true, hourRange: [0, 23] };
  if (difficulty === 2) return { minuteSteps: stepsAny, use24h: true, hourRange: [0, 23] };
  return { minuteSteps: stepsAny, use24h: true, hourRange: [0, 23], timeLimitSec: 6 };
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

function pickTime(cfg: LevelConfig): ClockTime {
  const hour = randInt(cfg.hourRange[0], cfg.hourRange[1]);
  const minute = pick(cfg.minuteSteps);
  return { hour, minute };
}

function timesEqualForDisplay(a: ClockTime, b: ClockTime, use24h: boolean): boolean {
  if (use24h) return a.hour === b.hour && a.minute === b.minute;
  // 12h: treat 12 and 0 as same; otherwise hour mod 12
  const ah = a.hour % 12;
  const bh = b.hour % 12;
  return ah === bh && a.minute === b.minute;
}

function generateDistractors(correct: ClockTime, cfg: LevelConfig, count: number): ClockTime[] {
  const distractors: ClockTime[] = [];
  let attempts = 0;
  while (distractors.length < count && attempts < 100) {
    const candidate = pickTime(cfg);
    const dupOfCorrect = timesEqualForDisplay(candidate, correct, cfg.use24h);
    const dupInList = distractors.some((d) => timesEqualForDisplay(d, candidate, cfg.use24h));
    if (!dupOfCorrect && !dupInList) {
      distractors.push(candidate);
    }
    attempts++;
  }
  // fallback: if couldn't find enough, generate deterministically by shifting minutes
  let shift = 5;
  while (distractors.length < count) {
    const shifted: ClockTime = {
      hour: correct.hour,
      minute: (correct.minute + shift) % 60,
    };
    if (!distractors.some((d) => timesEqualForDisplay(d, shifted, cfg.use24h))) {
      distractors.push(shifted);
    }
    shift += 5;
    if (shift > 55) break;
  }
  return distractors;
}

function generateTask(index: number, cfg: LevelConfig): Task<ClockTimeAnswer> {
  const mode: ClockMode = Math.random() < 0.5 ? 'clock-to-digital' : 'digital-to-clock';
  const target = pickTime(cfg);
  const distractors = generateDistractors(target, cfg, CHOICES_COUNT - 1);
  const choices = shuffle([target, ...distractors]);

  const payload: ClockTimePayload = {
    mode,
    target,
    choices,
    use24h: cfg.use24h,
  };
  return { id: `t${index}`, payload, timeLimitSec: cfg.timeLimitSec };
}

function generateLevel(difficulty: number, ageGroupId?: AgeGroupId): LevelSpec<ClockTimeAnswer> {
  const cfg = paramsFor(difficulty, ageGroupId);
  const tasks: Task<ClockTimeAnswer>[] = [];
  for (let i = 0; i < TASKS_PER_LEVEL; i++) {
    tasks.push(generateTask(i, cfg));
  }
  return {
    seed: `clock-time-${Date.now()}`,
    difficulty,
    tasks,
  };
}

const clockTime: GameDefinition<LevelSpec<ClockTimeAnswer>, ClockTimeAnswer> = {
  id: 'clock-time',
  islandId: 'math',
  name: 'game.clockTime.name',
  icon: '🕐',
  rulesKey: 'game.clockTime.rules',
  // Clock reading is too abstract for 3-5 y/o pre-readers — starts at grade1.
  availableFor: ['grade1', 'grade2', 'grade3', 'grade4'],
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as ClockTimePayload;
    return { correct: answer === `${p.target.hour}:${p.target.minute}` };
  },
  Renderer,
};

export default clockTime;
