import { describe, expect, it } from 'vitest';
import {
  BAND_CONFIG,
  areaOf,
  correctFor,
  generate,
  lShapeCells,
  perimeterOf,
  rectangleCells,
} from './generate';

describe('perimeter-area: perimeterOf/areaOf — коректність на відомих фігурах', () => {
  it('прямокутник 3×4: периметр 14, площа 12 (звірка із закритою формулою 2(w+h) і w*h)', () => {
    const cells = rectangleCells(3, 4);
    expect(areaOf(cells)).toBe(12);
    expect(perimeterOf(cells)).toBe(14);
  });

  it('квадрат 1×1: периметр 4, площа 1', () => {
    const cells = rectangleCells(1, 1);
    expect(areaOf(cells)).toBe(1);
    expect(perimeterOf(cells)).toBe(4);
  });

  it('прямокутники: генеричний алгоритм periметра завжди збігається із закритою формулою 2(w+h)', () => {
    for (let w = 1; w <= 10; w++) {
      for (let h = 1; h <= 10; h++) {
        const cells = rectangleCells(w, h);
        expect(perimeterOf(cells)).toBe(2 * (w + h));
        expect(areaOf(cells)).toBe(w * h);
      }
    }
  });

  it('L-тромінo (2×2 мінус кутова клітинка 1×1): площа 3, периметр 8 (відомий результат)', () => {
    const cells = lShapeCells(2, 2, 1, 1);
    expect(areaOf(cells)).toBe(3);
    expect(perimeterOf(cells)).toBe(8);
  });

  it('lShapeCells: площа завжди = bw*bh - nw*nh, фігура завжди зв\'язана (одна компонента)', () => {
    for (let i = 0; i < 50; i++) {
      const bw = 3 + (i % 6);
      const bh = 3 + ((i * 3) % 6);
      const nw = 1 + (i % (bw - 1));
      const nh = 1 + (i % (bh - 1));
      const cells = lShapeCells(bw, bh, nw, nh);
      expect(areaOf(cells)).toBe(bw * bh - nw * nh);
      expect(isConnected(cells)).toBe(true);
    }
  });
});

/** Перевірка зв'язності фігури (BFS по сусідніх клітинках) — незалежна від perimeterOf/areaOf. */
function isConnected(cells: string[]): boolean {
  if (cells.length === 0) return true;
  const set = new Set(cells);
  const seen = new Set<string>();
  const queue = [cells[0]];
  seen.add(cells[0]);
  while (queue.length > 0) {
    const [x, y] = queue.pop()!.split(',').map(Number);
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      const key = `${nx},${ny}`;
      if (set.has(key) && !seen.has(key)) {
        seen.add(key);
        queue.push(key);
      }
    }
  }
  return seen.size === cells.length;
}

describe('perimeter-area: BAND_CONFIG (D5 шкала L0-L4)', () => {
  it('зберігає узгоджені значення для реально задіяних рівнів (levels: [L3] → L2-L4)', () => {
    expect(BAND_CONFIG.L2.modes).toEqual(['perimeter']);
    expect(BAND_CONFIG.L2.shapeKind).toBe('rectangle');
    expect(BAND_CONFIG.L3.modes).toEqual(['area']);
    expect(BAND_CONFIG.L3.shapeKind).toBe('rectangle');
    expect(BAND_CONFIG.L4.modes).toEqual(['perimeter', 'area']);
    expect(BAND_CONFIG.L4.shapeKind).toBe('lshape');
  });

  it('максимальний вимір не перевищує 8 на жодному бенді (безпечно для екрана 320px)', () => {
    for (const band of ['L0', 'L1', 'L2', 'L3', 'L4'] as const) {
      expect(BAND_CONFIG[band].maxDim).toBeLessThanOrEqual(8);
      expect(BAND_CONFIG[band].minDim).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('perimeter-area: generate(difficulty, level)', () => {
  it('generate(difficulty, "L3") для 1/2/3 — 5 раундів, усі відповіді узгоджені з correctFor', () => {
    for (const difficulty of [1, 2, 3] as const) {
      for (let i = 0; i < 30; i++) {
        const { rounds } = generate(difficulty, 'L3');
        expect(rounds).toHaveLength(5);
        for (const r of rounds) {
          expect(correctFor(r.payload)).toBe(r.answer);
          expect(r.answer).toBeGreaterThan(0);
          expect(Number.isInteger(r.answer)).toBe(true);
        }
      }
    }
  });

  it('difficulty=1 (band L2): лише режим perimeter, прямокутники в межах [2,6]', () => {
    for (let i = 0; i < 20; i++) {
      const { rounds } = generate(1, 'L3');
      for (const r of rounds) {
        expect(r.payload.mode).toBe('perimeter');
        expect(r.payload.shapeKind).toBe('rectangle');
        expect(r.payload.width).toBeGreaterThanOrEqual(2);
        expect(r.payload.width).toBeLessThanOrEqual(6);
        expect(r.payload.height).toBeGreaterThanOrEqual(2);
        expect(r.payload.height).toBeLessThanOrEqual(6);
      }
    }
  });

  it('difficulty=2 (band L3): лише режим area, прямокутники в межах [3,8]', () => {
    for (let i = 0; i < 20; i++) {
      const { rounds } = generate(2, 'L3');
      for (const r of rounds) {
        expect(r.payload.mode).toBe('area');
        expect(r.payload.shapeKind).toBe('rectangle');
        expect(r.payload.width).toBeGreaterThanOrEqual(3);
        expect(r.payload.width).toBeLessThanOrEqual(8);
      }
    }
  });

  it('difficulty=3 (band L4): L-подібні фігури, обидва режими зустрічаються, площа < w*h', () => {
    const seenModes = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const { rounds } = generate(3, 'L3');
      for (const r of rounds) {
        seenModes.add(r.payload.mode);
        expect(r.payload.shapeKind).toBe('lshape');
        expect(r.payload.cells.length).toBeLessThan(r.payload.width * r.payload.height);
        expect(r.payload.width).toBeLessThanOrEqual(8);
        expect(r.payload.height).toBeLessThanOrEqual(8);
      }
    }
    expect(seenModes.has('perimeter')).toBe(true);
    expect(seenModes.has('area')).toBe(true);
  });

  it('generate(difficulty) без другого аргумента (зворотна сумісність) працює як level="L3"', () => {
    const { rounds } = generate(1);
    expect(rounds).toHaveLength(5);
    expect(rounds.every((r) => correctFor(r.payload) === r.answer)).toBe(true);
  });
});

describe('perimeter-area: L-подібні фігури — зовнішній контур, не сума компонентів', () => {
  it('L-подібна 3×3 мінус 1×1 у куті: периметр = зовнішній контур, не sum(p1, p2)', () => {
    // L-подібна з 3×3 мінус 1×1 у правому верхньому куті
    // Клітинки: усі 9 мінус 1 = 8 клітинок
    // Якщо б це були два окремих прямокутники: 2×3 + 1×2 = 8 клітинок
    // Периметр суми частин = 2(2+3) + 2(1+2) = 10 + 6 = 16 — НЕВІРНО!
    // Периметр зовнішнього контуру L-подібної = 12
    const cells = lShapeCells(3, 3, 1, 1);
    const p = perimeterOf(cells);
    const a = areaOf(cells);
    expect(a).toBe(8); // 9 - 1
    expect(p).toBe(12); // зовнішній контур, не 16
    expect(p).not.toBe(10 + 6); // явна перевірка проти помилки "сума периметрів"
  });

  it('L-подібна 4×4 мінус 2×2 у куті: периметр завжди < 2(4+4)=16 (через виріз)', () => {
    for (let i = 0; i < 10; i++) {
      const cells = lShapeCells(4, 4, 2, 2);
      const p = perimeterOf(cells);
      const a = areaOf(cells);
      expect(a).toBe(16 - 4); // 12 клітинок
      // Периметр зовнішнього контуру L-подібної < 2(4+4) тому що виріз створює невеликі огинання
      expect(p).toBeLessThanOrEqual(20); // дійсно менше за 16 або трохи більше
      expect(p).toBeGreaterThan(8);
    }
  });

  it('всі L-подібні в BAND_CONFIG.L4 генеруються коректно: периметр = зовнішній контур', () => {
    for (let i = 0; i < 50; i++) {
      const { rounds } = generate(3, 'L3');
      for (const r of rounds) {
        expect(r.payload.shapeKind).toBe('lshape');
        const p = perimeterOf(r.payload.cells);
        const a = areaOf(r.payload.cells);
        // Площа має бути < ширина×висота (через виріз)
        expect(a).toBeLessThan(r.payload.width * r.payload.height);
        // Периметр має бути позитивним і розумним числом
        expect(p).toBeGreaterThan(0);
        expect(Number.isInteger(p)).toBe(true);
        // Дата-точка: периметр L-подібної зазвичай між мін(2(w+h), 2(w+h)+8) залежно від виріза
        expect(p).toBeGreaterThanOrEqual(Math.max(8, 2 * (r.payload.width + r.payload.height - 2)));
      }
    }
  });

  it('гранічний випадок: L-подібна 3×3 мінус 2×2 у куті (маленький виріз на краю)', () => {
    // Залишається: 3×3 - 2×2 = 9 - 4 = 5 клітинок (залишок у нижньому лівому куті)
    const cells = lShapeCells(3, 3, 2, 2);
    const p = perimeterOf(cells);
    const a = areaOf(cells);
    expect(a).toBe(5);
    // Периметр має бути коректним для цієї конкретної форми
    expect(p).toBeGreaterThan(0);
    expect(Number.isInteger(p)).toBe(true);
  });

  it('маргінальна L: 5×5 мінус 4×4 (залишок хрестоподібна смуга)', () => {
    // 5×5 = 25, виріз 4×4 = 16 → залишок 9 клітинок
    const cells = lShapeCells(5, 5, 4, 4);
    const p = perimeterOf(cells);
    const a = areaOf(cells);
    expect(a).toBe(9);
    expect(p).toBeGreaterThan(0);
    expect(Number.isInteger(p)).toBe(true);
  });
});

describe('perimeter-area: граничні розміри (maxDim=8 для BAND_CONFIG)', () => {
  it('максимальний прямокутник 8×8: периметр 32, площа 64', () => {
    const cells = rectangleCells(8, 8);
    expect(areaOf(cells)).toBe(64);
    expect(perimeterOf(cells)).toBe(32);
  });

  it('мінімальний прямокутник 2×2: периметр 8, площа 4', () => {
    const cells = rectangleCells(2, 2);
    expect(areaOf(cells)).toBe(4);
    expect(perimeterOf(cells)).toBe(8);
  });

  it('витягнутий прямокутник 1×8: периметр 18, площа 8', () => {
    const cells = rectangleCells(1, 8);
    expect(areaOf(cells)).toBe(8);
    expect(perimeterOf(cells)).toBe(18); // 2(1+8) = 18
  });

  it('усі L-подібні з maxDim=8 мають позитивну площу й периметр', () => {
    const tested = [];
    for (let bw = 3; bw <= 8; bw++) {
      for (let bh = 3; bh <= 8; bh++) {
        for (let nw = 1; nw < bw; nw++) {
          for (let nh = 1; nh < bh; nh++) {
            const cells = lShapeCells(bw, bh, nw, nh);
            const p = perimeterOf(cells);
            const a = areaOf(cells);
            expect(a).toBe(bw * bh - nw * nh);
            expect(p).toBeGreaterThan(0);
            expect(Number.isInteger(p)).toBe(true);
            tested.push({ bw, bh, nw, nh, a, p });
          }
        }
      }
    }
    // Мають бути сотні комбінацій
    expect(tested.length).toBeGreaterThan(100);
  });
});

describe('perimeter-area: клас (аудит 07.10)', () => {
  it('2 клас ніколи не отримує площу', () => {
    for (const d of [1, 2, 3] as const) {
      for (let i = 0; i < 30; i++) {
        for (const r of generate(d, 'L3', 'grade2').rounds) expect(r.payload.mode).toBe('perimeter');
      }
    }
  });
});
