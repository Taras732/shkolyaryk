import type { GameDefinition, LevelSpec, Task } from '../types';
import type { AgeGroupId } from '../../constants/ageGroups';
import {
  Renderer,
  type MeasuresAnswer,
  type MeasuresPayload,
  type MeasuresMode,
  type MeasuresCompareTask,
  type MeasuresConvertTask,
  type MeasuresUnitTask,
} from './Renderer';
import { OBJECTS, UNITS, unitByKey, type MeasureCategory, type UnitInfo } from './data';

const TASKS_PER_LEVEL = 5;

interface LevelConfig {
  mode: MeasuresMode;
  allowedUnitKeys: string[];
  timeLimitSec?: number;
  /** grade1/grade2: keep compare within the same unit, no ×1000 conversions */
  sameUnitCompare?: boolean;
}

function allowedUnitsFor(group: AgeGroupId): string[] {
  if (group === 'grade1') return ['cm', 'm', 'kg'];
  if (group === 'grade2') return ['cm', 'dm', 'm', 'g', 'kg', 'l'];
  if (group === 'grade3') return ['mm', 'cm', 'dm', 'm', 'km', 'g', 'kg', 'ml', 'l'];
  return ['mm', 'cm', 'dm', 'm', 'km', 'g', 'kg', 't', 'ml', 'l'];
}

function timerForClass(group: AgeGroupId): number | undefined {
  if (group === 'grade1') return undefined;
  if (group === 'grade2') return 12;
  if (group === 'grade3') return 10;
  return 8;
}

function paramsFor(difficulty: number, ageGroupId: AgeGroupId | undefined): LevelConfig {
  const group = ageGroupId ?? 'grade1';
  const isYoung = group === 'grade1' || group === 'grade2';
  // ×1000 conversions (kg↔g, l↔ml, km↔m) are grade3+ only.
  // Younger kids: convert level becomes intuitive unit-pick; compare stays same-unit.
  let mode: MeasuresMode = difficulty <= 1 ? 'unit' : difficulty === 2 ? 'convert' : 'compare';
  if (isYoung && mode === 'convert') mode = 'unit';
  const allowedUnitKeys = allowedUnitsFor(group);
  const timeLimitSec = difficulty >= 3 ? timerForClass(group) : undefined;
  return { mode, allowedUnitKeys, timeLimitSec, sameUnitCompare: isYoung };
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

function generateUnitTask(index: number, cfg: LevelConfig): Task<MeasuresAnswer> {
  const pool = OBJECTS.filter((o) => cfg.allowedUnitKeys.includes(o.unitKey));
  const obj = pick(pool.length > 0 ? pool : OBJECTS);
  const correctUnit = unitByKey(obj.unitKey);
  const sameCategory = UNITS.filter(
    (u) => u.category === correctUnit.category && u.key !== correctUnit.key && cfg.allowedUnitKeys.includes(u.key),
  );
  const distractors = shuffle(sameCategory).slice(0, 2);
  // Guarantee >=2 distractors (>=3 buttons). If the same physical axis lacks enough
  // allowed units, borrow distractors from other axes — still exactly one correct unit.
  if (distractors.length < 2) {
    const otherAxes = UNITS.filter(
      (u) => u.key !== correctUnit.key && cfg.allowedUnitKeys.includes(u.key) && !distractors.includes(u),
    );
    for (const u of shuffle(otherAxes)) {
      if (distractors.length >= 2) break;
      distractors.push(u);
    }
  }
  const choices = shuffle([correctUnit, ...distractors]).map((u) => u.label);

  const payload: MeasuresUnitTask = {
    mode: 'unit',
    emoji: obj.emoji,
    name: obj.name,
    value: obj.value,
    choices,
    correct: correctUnit.label,
  };
  return { id: `t${index}`, payload, timeLimitSec: cfg.timeLimitSec };
}

function pickCategoryWithTwoUnits(cfg: LevelConfig): MeasureCategory | null {
  const cats: MeasureCategory[] = ['length', 'mass', 'volume'];
  const available = cats.filter((cat) => {
    const units = UNITS.filter((u) => u.category === cat && cfg.allowedUnitKeys.includes(u.key));
    return units.length >= 2;
  });
  if (available.length === 0) return null;
  return pick(available);
}

function generateConvertTask(index: number, cfg: LevelConfig): Task<MeasuresAnswer> {
  const cat = pickCategoryWithTwoUnits(cfg) ?? 'length';
  const catUnits = UNITS.filter((u) => u.category === cat && cfg.allowedUnitKeys.includes(u.key));

  // Pick "from" as a larger unit, "to" as a smaller unit (so integer conversion)
  const sorted = catUnits.slice().sort((a, b) => b.inBase - a.inBase);
  const fromUnit = sorted[randInt(0, Math.max(0, sorted.length - 2))];
  const toCandidates = sorted.filter((u) => u.inBase < fromUnit.inBase);
  const toUnit = toCandidates.length > 0 ? pick(toCandidates) : sorted[sorted.length - 1];

  const fromValue = randInt(1, 5);
  const correctValue = (fromValue * fromUnit.inBase) / toUnit.inBase;

  const choices = new Set<number>([correctValue]);
  const step = Math.max(1, Math.floor(correctValue / 10) || 1);
  const attempts = [
    correctValue + step,
    correctValue - step,
    correctValue + step * 2,
    correctValue / 10,
    correctValue * 10,
  ];
  for (const a of attempts) {
    if (a > 0 && a !== correctValue && Number.isFinite(a) && !choices.has(a)) {
      choices.add(Math.round(a));
      if (choices.size >= 4) break;
    }
  }
  let filler = 1;
  while (choices.size < 4 && filler <= correctValue * 20) {
    if (!choices.has(filler)) choices.add(filler);
    filler++;
  }

  const payload: MeasuresConvertTask = {
    mode: 'convert',
    fromValue,
    fromLabel: fromUnit.label,
    toLabel: toUnit.label,
    choices: shuffle(Array.from(choices).slice(0, 4)),
    correct: correctValue,
  };
  return { id: `t${index}`, payload, timeLimitSec: cfg.timeLimitSec };
}

function generateCompareTask(index: number, cfg: LevelConfig): Task<MeasuresAnswer> {
  const cat = pickCategoryWithTwoUnits(cfg) ?? 'length';
  const catUnits = UNITS.filter((u) => u.category === cat && cfg.allowedUnitKeys.includes(u.key));

  const leftUnit = pick(catUnits);
  // Young grades compare within the SAME unit (e.g. 3 кг vs 7 кг), no ×1000 mental math.
  const rightUnit = cfg.sameUnitCompare ? leftUnit : pick(catUnits);
  const leftValue = randInt(1, 10);
  const rightValue = randInt(1, 10);

  const leftBase = leftValue * leftUnit.inBase;
  const rightBase = rightValue * rightUnit.inBase;

  let correct: '>' | '<' | '=';
  if (leftBase > rightBase) correct = '>';
  else if (leftBase < rightBase) correct = '<';
  else correct = '=';

  const payload: MeasuresCompareTask = {
    mode: 'compare',
    leftValue,
    leftLabel: leftUnit.label,
    rightValue,
    rightLabel: rightUnit.label,
    choices: ['<', '=', '>'],
    correct,
  };
  return { id: `t${index}`, payload, timeLimitSec: cfg.timeLimitSec };
}

function generateTask(index: number, cfg: LevelConfig): Task<MeasuresAnswer> {
  if (cfg.mode === 'unit') return generateUnitTask(index, cfg);
  if (cfg.mode === 'convert') return generateConvertTask(index, cfg);
  return generateCompareTask(index, cfg);
}

function generateLevel(difficulty: number, ageGroupId?: AgeGroupId): LevelSpec<MeasuresAnswer> {
  const cfg = paramsFor(difficulty, ageGroupId);
  const tasks: Task<MeasuresAnswer>[] = [];
  for (let i = 0; i < TASKS_PER_LEVEL; i++) {
    tasks.push(generateTask(i, cfg));
  }
  return {
    seed: `measures-${Date.now()}`,
    difficulty,
    tasks,
  };
}

const measures: GameDefinition<LevelSpec<MeasuresAnswer>, MeasuresAnswer> = {
  id: 'measures',
  islandId: 'math',
  name: 'game.measures.name',
  icon: '📐',
  rulesKey: 'game.measures.rules',
  availableFor: ['grade1', 'grade2', 'grade3', 'grade4'],
  levelLabels: {
    1: { emoji: '🏷', labelKey: 'game.measures.mode.unit' },
    2: { emoji: '🔁', labelKey: 'game.measures.mode.convert' },
    3: { emoji: '⚖', labelKey: 'game.measures.mode.compare' },
  },
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as MeasuresPayload;
    if (p.mode === 'convert') {
      return { correct: Number(answer) === p.correct };
    }
    return { correct: answer === p.correct };
  },
  Renderer,
};

export default measures;
