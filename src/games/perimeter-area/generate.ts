import type { ClassLevel, Difficulty, GradeBand, LevelData, ProfileLevel, Round } from '../types';
import { gradeBandFor } from '../types';
import { randInt, shuffle } from '../shared/ui';

export type Mode = 'perimeter' | 'area';
export type ShapeKind = 'rectangle' | 'lshape';

export interface Payload {
  mode: Mode;
  shapeKind: ShapeKind;
  /** Клітинки фігури як "x,y" (кожна клітинка = 1×1 одиниця). */
  cells: string[];
  /** Розмір габаритного прямокутника (для рендеру сітки). */
  width: number;
  height: number;
  unit: string;
}

const ROUNDS_PER_LEVEL = 5;
const UNIT = 'см';

interface BandConfig {
  /** Пул режимів раунду (5 елементів = ROUNDS); generate() перемішує його заново щоразу. */
  modes: Mode[];
  shapeKind: ShapeKind;
  minDim: number;
  maxDim: number;
}

/**
 * Периметр (L2, 2 клас) → площа (L3, 3 клас) → складені фігури: периметр і
 * площа разом (L4, 4 клас) — узгоджено зі skill-graph (`math.measure.l2.perimeter`,
 * `math.measure.l3.area`, `src/school/skills-math.ts`). Гра доступна лише
 * профілю 'L3' (школярі, `levels: ['L3']`), тож реально задіяні лише L2-L4;
 * L0-L1 — про запас на майбутнє розширення `levels` (дублюють звужений L2).
 */
export const BAND_CONFIG: Record<GradeBand, BandConfig> = {
  L0: { modes: ['perimeter'], shapeKind: 'rectangle', minDim: 2, maxDim: 3 },
  L1: { modes: ['perimeter'], shapeKind: 'rectangle', minDim: 2, maxDim: 4 },
  L2: { modes: ['perimeter'], shapeKind: 'rectangle', minDim: 2, maxDim: 6 },
  L3: { modes: ['area'], shapeKind: 'rectangle', minDim: 3, maxDim: 8 },
  L4: { modes: ['perimeter', 'area'], shapeKind: 'lshape', minDim: 4, maxDim: 8 },
};

function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

/** Клітинки суцільного прямокутника w×h (x,y з нуля). */
export function rectangleCells(w: number, h: number): string[] {
  const cells: string[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) cells.push(cellKey(x, y));
  }
  return cells;
}

/**
 * Прямокутник bw×bh із вирізаним прямокутним "виступом" nw×nh у правому
 * верхньому куті → складена (L-подібна) фігура. Виріз строго менший за обидва
 * виміри (nw<bw, nh<bh), тож результат завжди одна зв'язна фігура.
 */
export function lShapeCells(bw: number, bh: number, nw: number, nh: number): string[] {
  const cut = new Set<string>();
  for (let y = 0; y < nh; y++) {
    for (let x = bw - nw; x < bw; x++) cut.add(cellKey(x, y));
  }
  return rectangleCells(bw, bh).filter((c) => !cut.has(c));
}

/**
 * Периметр фігури на сітці: для кожної клітинки рахуємо сторони, що межують
 * із "порожнечею" (немає сусідньої клітинки фігури). Загальний алгоритм —
 * коректний для будь-якої фігури з клітинок (прямокутник, L-подібна тощо),
 * без припущення закритої формули.
 */
export function perimeterOf(cells: string[]): number {
  const set = new Set(cells);
  let perimeter = 0;
  for (const key of cells) {
    const [x, y] = key.split(',').map(Number);
    const neighbors: [number, number][] = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];
    for (const [nx, ny] of neighbors) {
      if (!set.has(cellKey(nx, ny))) perimeter++;
    }
  }
  return perimeter;
}

export function areaOf(cells: string[]): number {
  return cells.length;
}

function genRectangle(minDim: number, maxDim: number): { cells: string[]; width: number; height: number } {
  const w = randInt(minDim, maxDim);
  const h = randInt(minDim, maxDim);
  return { cells: rectangleCells(w, h), width: w, height: h };
}

function genLShape(minDim: number, maxDim: number): { cells: string[]; width: number; height: number } {
  const bw = randInt(Math.max(minDim, 3), maxDim);
  const bh = randInt(Math.max(minDim, 3), maxDim);
  const nw = randInt(1, bw - 1);
  const nh = randInt(1, bh - 1);
  return { cells: lShapeCells(bw, bh, nw, nh), width: bw, height: bh };
}

function genFigure(shapeKind: ShapeKind, minDim: number, maxDim: number) {
  return shapeKind === 'lshape' ? genLShape(minDim, maxDim) : genRectangle(minDim, maxDim);
}

export function correctFor(payload: Payload): number {
  return payload.mode === 'perimeter' ? perimeterOf(payload.cells) : areaOf(payload.cells);
}

function buildModeSequence(pool: Mode[]): Mode[] {
  if (pool.length === 1) return Array(ROUNDS_PER_LEVEL).fill(pool[0]);
  const seq: Mode[] = Array.from({ length: ROUNDS_PER_LEVEL }, () => pool[randInt(0, pool.length - 1)]);
  if (new Set(seq).size === 1) {
    const alt = pool.find((m) => m !== seq[0])!;
    seq[randInt(0, seq.length - 1)] = alt;
  }
  return shuffle(seq);
}

/**
 * Клас × складність (аудит 07.10): без класу другокласниця на «Середньо»
 * отримувала площу, хоча за власним коментарем вище це тема 3 класу.
 * 2 клас — лише периметр прямокутника; 3 — периметр → площа → обидва;
 * 4 — складені фігури.
 */
export const CLASS_CONFIG: Partial<Record<ClassLevel, Record<Difficulty, BandConfig>>> = {
  grade2: {
    1: { modes: ['perimeter'], shapeKind: 'rectangle', minDim: 2, maxDim: 5 },
    2: { modes: ['perimeter'], shapeKind: 'rectangle', minDim: 2, maxDim: 7 },
    3: { modes: ['perimeter'], shapeKind: 'rectangle', minDim: 3, maxDim: 9 },
  },
  grade3: {
    1: { modes: ['perimeter'], shapeKind: 'rectangle', minDim: 2, maxDim: 8 },
    2: { modes: ['area'], shapeKind: 'rectangle', minDim: 3, maxDim: 8 },
    3: { modes: ['perimeter', 'area'], shapeKind: 'rectangle', minDim: 3, maxDim: 9 },
  },
  grade4: {
    1: { modes: ['perimeter', 'area'], shapeKind: 'rectangle', minDim: 3, maxDim: 9 },
    2: { modes: ['perimeter', 'area'], shapeKind: 'lshape', minDim: 4, maxDim: 8 },
    3: { modes: ['perimeter', 'area'], shapeKind: 'lshape', minDim: 5, maxDim: 10 },
  },
};

export function generate(difficulty: Difficulty, level: ProfileLevel = 'L3', classLevel?: ClassLevel): LevelData<Payload, number> {
  const { modes, shapeKind, minDim, maxDim } =
    (classLevel && CLASS_CONFIG[classLevel]?.[difficulty]) || BAND_CONFIG[gradeBandFor(level, difficulty)];
  const sequence = buildModeSequence(modes);
  const rounds: Round<Payload, number>[] = sequence.map((mode, i) => {
    const { cells, width, height } = genFigure(shapeKind, minDim, maxDim);
    const payload: Payload = { mode, shapeKind, cells, width, height, unit: UNIT };
    return { id: `r${i}`, payload, answer: correctFor(payload) };
  });
  return { difficulty, rounds };
}
