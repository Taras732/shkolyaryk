import { describe, expect, it } from 'vitest';
import { CONFIG_BY_BAND, paramsForClass, generate, correctFor } from './generate';

describe('clock-time: CONFIG_BY_BAND (D5 шкала L0-L4)', () => {
  it('кількість хвилинних поділок монотонно не спадає від L0 (найлегше) до L4 (найважче)', () => {
    const bands = ['L0', 'L1', 'L2', 'L3', 'L4'] as const;
    for (let i = 1; i < bands.length; i++) {
      expect(CONFIG_BY_BAND[bands[i]].steps.length).toBeGreaterThanOrEqual(CONFIG_BY_BAND[bands[i - 1]].steps.length);
    }
  });

  it('зберігає попередні значення для реально задіяних рівнів (levels: [L3] → L2-L4)', () => {
    expect(CONFIG_BY_BAND.L2.steps).toEqual([0, 30]);
    expect(CONFIG_BY_BAND.L2.modes).toEqual(['read', 'read', 'read', 'read', 'read']);
    expect(CONFIG_BY_BAND.L3.steps).toEqual([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
    expect(CONFIG_BY_BAND.L3.modes).toEqual(['read', 'read', 'read', 'read', 'read']);
    expect(CONFIG_BY_BAND.L4.steps).toEqual(Array.from({ length: 60 }, (_, i) => i));
    expect(CONFIG_BY_BAND.L4.modes).toEqual(['read', 'read', 'read', 'elapsed', 'convert']);
  });

  it('L0/L1 не регресують нижче L2 і не вводять elapsed/convert', () => {
    expect(CONFIG_BY_BAND.L0.steps.length).toBeLessThanOrEqual(CONFIG_BY_BAND.L2.steps.length);
    expect(CONFIG_BY_BAND.L1.steps.length).toBeLessThanOrEqual(CONFIG_BY_BAND.L2.steps.length);
    expect(CONFIG_BY_BAND.L0.modes.every((m) => m === 'read')).toBe(true);
    expect(CONFIG_BY_BAND.L1.modes.every((m) => m === 'read')).toBe(true);
  });
});

describe('clock-time: generate(difficulty, level)', () => {
  it('generate(difficulty, "L3") для 1/2/3 — усі відповіді узгоджені з correctFor, час у межах доби', () => {
    for (const difficulty of [1, 2, 3] as const) {
      for (let i = 0; i < 30; i++) {
        const { rounds } = generate(difficulty, 'L3');
        expect(rounds).toHaveLength(5);
        for (const r of rounds) {
          expect(correctFor(r.payload)).toBe(r.answer);
          if (r.payload.mode === 'read') {
            expect(r.payload.h).toBeGreaterThanOrEqual(1);
            expect(r.payload.h).toBeLessThanOrEqual(12);
            expect(r.payload.m).toBeGreaterThanOrEqual(0);
            expect(r.payload.m).toBeLessThanOrEqual(59);
          }
          if (r.payload.mode === 'elapsed') {
            expect(r.payload.resultH).toBeGreaterThanOrEqual(1);
            expect(r.payload.resultH).toBeLessThanOrEqual(12);
            expect(r.payload.resultM).toBeGreaterThanOrEqual(0);
            expect(r.payload.resultM).toBeLessThanOrEqual(59);
          }
        }
      }
    }
  });

  it('difficulty=1 (band L2) — лише read, крок 0/30', () => {
    for (let i = 0; i < 20; i++) {
      const { rounds } = generate(1, 'L3');
      for (const r of rounds) {
        expect(r.payload.mode).toBe('read');
        if (r.payload.mode === 'read') expect([0, 30]).toContain(r.payload.m);
      }
    }
  });

  it('difficulty=3 (band L4) — модальність містить elapsed/convert раунди', () => {
    let sawElapsed = false;
    let sawConvert = false;
    for (let i = 0; i < 20; i++) {
      const { rounds } = generate(3, 'L3');
      for (const r of rounds) {
        if (r.payload.mode === 'elapsed') sawElapsed = true;
        if (r.payload.mode === 'convert') sawConvert = true;
      }
    }
    expect(sawElapsed).toBe(true);
    expect(sawConvert).toBe(true);
  });

  it('generate(difficulty) без другого аргумента (зворотна сумісність) працює як level="L3"', () => {
    const { rounds } = generate(1);
    expect(rounds).toHaveLength(5);
    for (const r of rounds) expect(r.payload.mode).toBe('read');
  });
});

describe('clock-time: paramsForClass (G2b, клас-вісь)', () => {
  it('точність (кількість хвилинних поділок) монотонно не спадає від grade1 до grade4 на difficulty=3', () => {
    const classes = ['grade1', 'grade2', 'grade3', 'grade4'] as const;
    for (let i = 1; i < classes.length; i++) {
      expect(paramsForClass(3, classes[i]).steps.length).toBeGreaterThanOrEqual(paramsForClass(3, classes[i - 1]).steps.length);
    }
  });

  it('grade1 — лише чверті години (0/15/30/45 на Medium/Hard), 12h (перенесено зі старого paramsFor)', () => {
    // 11.10: d1 — лише цілі години (програма 1 класу), d2 — половини, d3 — чверті
    expect(paramsForClass(1, 'grade1')).toEqual({ steps: [0], use24h: false, hourRange: [1, 12] });
    expect(paramsForClass(2, 'grade1')).toEqual({ steps: [0, 30], use24h: false, hourRange: [1, 12] });
    expect(paramsForClass(3, 'grade1')).toEqual({ steps: [0, 15, 30, 45], use24h: false, hourRange: [1, 12] });
    expect(paramsForClass(3, 'grade1').use24h).toBe(false);
  });

  it('grade2 — крок 5 хв на Medium/Hard', () => {
    const steps5 = Array.from({ length: 12 }, (_, i) => i * 5);
    expect(paramsForClass(2, 'grade2').steps).toEqual(steps5);
    expect(paramsForClass(3, 'grade2').steps).toEqual(steps5);
    expect(paramsForClass(2, 'grade2').use24h).toBe(false);
  });

  it('grade3 — будь-яка хвилина від Medium, 24h лише на Hard', () => {
    const stepsAny = Array.from({ length: 60 }, (_, i) => i);
    expect(paramsForClass(2, 'grade3')).toEqual({ steps: stepsAny, use24h: false, hourRange: [1, 12] });
    expect(paramsForClass(3, 'grade3')).toEqual({ steps: stepsAny, use24h: true, hourRange: [0, 23] });
  });

  it('grade4 — будь-яка хвилина + 24h на всіх difficulty', () => {
    for (const difficulty of [1, 2, 3] as const) {
      const cfg = paramsForClass(difficulty, 'grade4');
      expect(cfg.use24h).toBe(true);
      expect(cfg.hourRange).toEqual([0, 23]);
      expect(cfg.steps).toHaveLength(60);
    }
  });
});

describe('clock-time: generate(difficulty, level, classLevel) — клас-вісь (G2b)', () => {
  it('відповіді узгоджені з correctFor і h/m у межах paramsForClass для всіх класів × difficulty', () => {
    const classes = ['preschool', 'grade1', 'grade2', 'grade3', 'grade4'] as const;
    for (const classLevel of classes) {
      for (const difficulty of [1, 2, 3] as const) {
        const { hourRange, steps } = paramsForClass(difficulty, classLevel);
        for (let i = 0; i < 10; i++) {
          const { rounds } = generate(difficulty, 'L3', classLevel);
          expect(rounds).toHaveLength(5);
          for (const r of rounds) {
            expect(correctFor(r.payload)).toBe(r.answer);
            expect(r.payload.mode).toBe('read');
            if (r.payload.mode === 'read') {
              expect(r.payload.h).toBeGreaterThanOrEqual(hourRange[0]);
              expect(r.payload.h).toBeLessThanOrEqual(hourRange[1]);
              expect(steps).toContain(r.payload.m);
            }
          }
        }
      }
    }
  });

  it('grade3 при difficulty=3 генерує години поза межами 1-12 (24h формат)', () => {
    let sawBeyond12 = false;
    for (let i = 0; i < 30; i++) {
      const { rounds } = generate(3, 'L3', 'grade3');
      for (const r of rounds) {
        if (r.payload.mode === 'read' && (r.payload.h === 0 || r.payload.h > 12)) sawBeyond12 = true;
      }
    }
    expect(sawBeyond12).toBe(true);
  });

  it('grade1 (difficulty=1) генерує лише кроки [0, 30] (перенесено зі старого paramsFor)', () => {
    for (let i = 0; i < 20; i++) {
      const { rounds } = generate(1, 'L3', 'grade1');
      for (const r of rounds) {
        expect(r.payload.mode).toBe('read');
        if (r.payload.mode === 'read') expect([0, 30]).toContain(r.payload.m);
      }
    }
  });
});
