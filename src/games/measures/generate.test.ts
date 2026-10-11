import { describe, expect, it } from 'vitest';
import type { ProfileLevel } from '../types';
import { OBJECTS, UNITS, unitByKey, type MeasureCategory } from './data';
import { CONFIG_BY_BAND, CLASS_UNIT_KEYS, generate, correctFor, genUnit } from './generate';

function categoryOfLabel(label: string): MeasureCategory {
  const u = UNITS.find((x) => x.label === label);
  if (!u) throw new Error(`Unknown unit label: ${label}`);
  return u.category;
}

describe('measures: CONFIG_BY_BAND (D5 шкала L0-L4)', () => {
  it('кількість дозволених одиниць монотонно не спадає від L0 (найлегше) до L4 (найважче)', () => {
    const bands = ['L0', 'L1', 'L2', 'L3', 'L4'] as const;
    for (let i = 1; i < bands.length; i++) {
      expect(CONFIG_BY_BAND[bands[i]].unitKeys.length).toBeGreaterThanOrEqual(CONFIG_BY_BAND[bands[i - 1]].unitKeys.length);
    }
  });

  it('кількість категорій монотонно не спадає від L0 до L4', () => {
    const bands = ['L0', 'L1', 'L2', 'L3', 'L4'] as const;
    for (let i = 1; i < bands.length; i++) {
      expect(CONFIG_BY_BAND[bands[i]].categories.length).toBeGreaterThanOrEqual(CONFIG_BY_BAND[bands[i - 1]].categories.length);
    }
  });

  it('зберігає попередні значення для реально задіяних рівнів (levels: [L3] → L2-L4)', () => {
    expect(CONFIG_BY_BAND.L2.unitKeys).toEqual(['cm', 'm', 'g', 'kg', 'ml', 'l']);
    expect(CONFIG_BY_BAND.L2.categories).toEqual(['length', 'mass', 'volume']);
    expect(CONFIG_BY_BAND.L2.allowReverseConvert).toBe(false);
    expect(CONFIG_BY_BAND.L2.modes).toEqual(['unit', 'unit', 'unit', 'compare', 'compare']);

    expect(CONFIG_BY_BAND.L3.unitKeys).toEqual(['mm', 'cm', 'm', 'g', 'kg', 'ml', 'l']);
    expect(CONFIG_BY_BAND.L3.categories).toEqual(['length', 'mass', 'volume']);
    expect(CONFIG_BY_BAND.L3.allowReverseConvert).toBe(false);
    expect(CONFIG_BY_BAND.L3.modes).toEqual(['unit', 'unit', 'compare', 'convert', 'convert']);

    expect(CONFIG_BY_BAND.L4.categories).toEqual(['length', 'mass', 'volume', 'temp']);
    expect(CONFIG_BY_BAND.L4.allowReverseConvert).toBe(true);
    expect(CONFIG_BY_BAND.L4.modes).toEqual(['unit', 'compare', 'convert', 'multistep', 'multistep']);
  });

  it('L0/L1 не регресують нижче L2 і не вводять convert/multistep/temp', () => {
    expect(CONFIG_BY_BAND.L0.unitKeys.length).toBeLessThanOrEqual(CONFIG_BY_BAND.L2.unitKeys.length);
    expect(CONFIG_BY_BAND.L1.unitKeys.length).toBeLessThanOrEqual(CONFIG_BY_BAND.L2.unitKeys.length);
    expect(CONFIG_BY_BAND.L0.categories.includes('temp')).toBe(false);
    expect(CONFIG_BY_BAND.L1.categories.includes('temp')).toBe(false);
    expect(CONFIG_BY_BAND.L0.modes.some((m) => m === 'convert' || m === 'multistep')).toBe(false);
    expect(CONFIG_BY_BAND.L1.modes.some((m) => m === 'convert' || m === 'multistep')).toBe(false);
  });
});

describe('measures: generate(difficulty, level)', () => {
  it('generate(difficulty, "L3") для 1/2/3 — усі відповіді узгоджені з correctFor', () => {
    for (const difficulty of [1, 2, 3] as const) {
      for (let i = 0; i < 30; i++) {
        const { rounds } = generate(difficulty, 'L3');
        expect(rounds).toHaveLength(5);
        for (const r of rounds) {
          expect(correctFor(r.payload)).toBe(r.answer);
          if (r.payload.mode === 'convert' || r.payload.mode === 'multistep') {
            expect(Number.isInteger(r.payload.result)).toBe(true);
            expect(r.payload.result).toBeGreaterThanOrEqual(1);
          }
          if (r.payload.mode === 'compare' && difficulty < 3) {
            expect(r.payload.left.category).not.toBe('temp');
            expect(r.payload.right.category).not.toBe('temp');
          }
        }
      }
    }
  });

  it('difficulty=1 (band L2) ніколи не генерує convert/multistep', () => {
    for (let i = 0; i < 20; i++) {
      const { rounds } = generate(1, 'L3');
      for (const r of rounds) expect(['unit', 'compare']).toContain(r.payload.mode);
    }
  });

  it('difficulty=3 (band L4) допускає температуру у compare', () => {
    let sawTemp = false;
    for (let i = 0; i < 40; i++) {
      const { rounds } = generate(3, 'L3');
      for (const r of rounds) {
        if (r.payload.mode === 'compare' && (r.payload.left.category === 'temp' || r.payload.right.category === 'temp')) {
          sawTemp = true;
        }
      }
    }
    expect(sawTemp).toBe(true);
  });

  it('generate(difficulty) без другого аргумента (зворотна сумісність) працює як level="L3"', () => {
    const { rounds } = generate(1);
    expect(rounds).toHaveLength(5);
    expect(rounds.every((r) => correctFor(r.payload) === r.answer)).toBe(true);
  });
});

describe('measures: CLASS_UNIT_KEYS (G2b, клас-вісь)', () => {
  it('набір одиниць монотонно не спадає від grade1 до grade4', () => {
    const classes = ['grade1', 'grade2', 'grade3', 'grade4'] as const;
    for (let i = 1; i < classes.length; i++) {
      expect(CLASS_UNIT_KEYS[classes[i]].length).toBeGreaterThanOrEqual(CLASS_UNIT_KEYS[classes[i - 1]].length);
    }
  });

  // 11.10.2026: програма Савченко — у 1 класі см, дм, м, кг, л
  it('grade1 — [cm, dm, m, kg, l]; grade4 — повний набір з т і км', () => {
    expect(CLASS_UNIT_KEYS.grade1).toEqual(['cm', 'dm', 'm', 'kg', 'l']);
    expect(CLASS_UNIT_KEYS.grade4).toEqual(['mm', 'cm', 'dm', 'm', 'km', 'g', 'kg', 't', 'ml', 'l']);
  });
});

describe('measures: generate(difficulty, level, classLevel) — клас-вісь (G2b)', () => {
  it('відповіді узгоджені з correctFor і одиниці належать клас-набору для всіх класів × difficulty', () => {
    const classes = ['grade1', 'grade2', 'grade3', 'grade4'] as const;
    for (const classLevel of classes) {
      for (const difficulty of [1, 2, 3] as const) {
        for (let i = 0; i < 15; i++) {
          const { rounds } = generate(difficulty, 'L3', classLevel);
          expect(rounds).toHaveLength(5);
          for (const r of rounds) {
            expect(correctFor(r.payload)).toBe(r.answer);
            if (r.payload.mode === 'unit') expect(CLASS_UNIT_KEYS[classLevel]).toContain(r.payload.obj.unitKey);
            if (r.payload.mode === 'compare') {
              expect(CLASS_UNIT_KEYS[classLevel]).toContain(r.payload.left.unitKey);
              expect(CLASS_UNIT_KEYS[classLevel]).toContain(r.payload.right.unitKey);
            }
            if (r.payload.mode === 'convert') {
              expect(CLASS_UNIT_KEYS[classLevel]).toContain(r.payload.fromKey);
              expect(CLASS_UNIT_KEYS[classLevel]).toContain(r.payload.toKey);
            }
          }
        }
      }
    }
  });

  it('grade1 при difficulty=1 генерує лише mode="unit" з набору 1 класу', () => {
    for (let i = 0; i < 20; i++) {
      const { rounds } = generate(1, 'L3', 'grade1');
      for (const r of rounds) {
        expect(r.payload.mode).toBe('unit');
        if (r.payload.mode === 'unit') expect(['cm', 'dm', 'm', 'kg', 'l']).toContain(r.payload.obj.unitKey);
      }
    }
  });

  it('grade4 при difficulty=3 генерує лише mode="compare" (без temp — старий код не мав температури)', () => {
    for (let i = 0; i < 20; i++) {
      const { rounds } = generate(3, 'L3', 'grade4');
      for (const r of rounds) {
        expect(r.payload.mode).toBe('compare');
        if (r.payload.mode === 'compare') {
          expect(r.payload.left.category).not.toBe('temp');
          expect(r.payload.right.category).not.toBe('temp');
        }
      }
    }
  });

  it('grade1 при difficulty=2 генерує mode="convert" у межах свого набору', () => {
    for (let i = 0; i < 20; i++) {
      const { rounds } = generate(2, 'L3', 'grade1');
      for (const r of rounds) {
        expect(r.payload.mode).toBe('convert');
        if (r.payload.mode === 'convert') {
          expect(['cm', 'dm', 'm', 'kg', 'l']).toContain(r.payload.fromKey);
          expect(['cm', 'dm', 'm', 'kg', 'l']).toContain(r.payload.toKey);
        }
      }
    }
  });
});

describe('measures: genUnit дистрактори не змішують величини (Q14 fix — «т» більше не варіант для чайної ложки 5 мл)', () => {
  it('усі варіанти unit-раунду належать ТІЙ САМІЙ категорії, що й правильна одиниця — для кожного обʼєкта банку, багато ітерацій', () => {
    for (const obj of OBJECTS) {
      for (let i = 0; i < 20; i++) {
        const payload = genUnit([obj]);
        for (const label of payload.options) {
          expect(categoryOfLabel(label)).toBe(obj.category);
        }
      }
    }
  });

  it('варіанти unit-раунду унікальні (без дублів правильної відповіді чи одне одного)', () => {
    for (const obj of OBJECTS) {
      for (let i = 0; i < 20; i++) {
        const payload = genUnit([obj]);
        expect(new Set(payload.options).size).toBe(payload.options.length);
      }
    }
  });

  it('чайна ложка (5 мл): єдиний можливий дистрактор — «л» (обʼєм має лише 2 одиниці); ніколи т/кг/км/мм/см', () => {
    const teaspoon = OBJECTS.find((o) => o.name === 'Чайна ложка')!;
    for (let i = 0; i < 30; i++) {
      const payload = genUnit([teaspoon]);
      expect(payload.options).toHaveLength(2);
      expect(payload.options).toContain('мл');
      expect(payload.options).toContain('л');
    }
  });

  it('крапля (1 мл): дистрактор — теж лише «л», ніколи одиниця іншої величини', () => {
    const drop = OBJECTS.find((o) => o.name === 'Крапля')!;
    for (let i = 0; i < 30; i++) {
      const payload = genUnit([drop]);
      expect(payload.options.sort()).toEqual(['л', 'мл']);
    }
  });

  it('довжина (5 обʼєктів mm/cm/dm/m/km): дистрактори — 2 НАЙБЛИЖЧІ за порядком величини, завжди тієї самої категорії', () => {
    const pencil = OBJECTS.find((o) => o.name === 'Олівець')!; // 15 см
    for (let i = 0; i < 30; i++) {
      const payload = genUnit([pencil]);
      expect(payload.options).toHaveLength(3);
      expect(payload.options).toContain('см');
      // найближчі до "см" за позицією в UNITS: мм (сусід зліва) і дм (сусід справа);
      // "км" (найдальша величина) ніколи не має зʼявитись як дистрактор для олівця
      expect(payload.options).not.toContain('км');
      for (const label of payload.options) expect(categoryOfLabel(label)).toBe('length');
    }
  });

  it('пул лише з одним temp-обʼєктом (немає з чим утворити дистрактор тієї самої категорії) — деградує безпечно, без крос-категорійних дистракторів', () => {
    const ice = OBJECTS.find((o) => o.name === 'Лід')!;
    const payload = genUnit([ice]);
    expect(payload.options.every((label) => categoryOfLabel(label) === 'temp')).toBe(true);
  });

  it('temp-обʼєкт у мішаному пулі (є з чого обрати іншого обʼєкта) — genUnit ретраїть і теж не змішує величини', () => {
    const ice = OBJECTS.find((o) => o.name === 'Лід')!;
    const mixedPool = [ice, ...OBJECTS.filter((o) => o.category !== 'temp')];
    for (let i = 0; i < 40; i++) {
      const payload = genUnit(mixedPool);
      // усі варіанти в одному раунді повинні належати ОДНІЙ і тій самій категорії
      const categories = new Set(payload.options.map(categoryOfLabel));
      expect(categories.size).toBe(1);
      expect(payload.options).toContain(unitByKey(payload.obj.unitKey).label);
    }
  });
});

describe('measures: generate() integration — unit-раунди ніколи не змішують величини (усі difficulty × ProfileLevel × багато прогонів)', () => {
  it('ProfileLevel L0 та L3, difficulty 1/2/3 — options unit-раунду завжди тієї самої категорії, що й обʼєкт, і унікальні', () => {
    const levels: ProfileLevel[] = ['L0', 'L3'];
    for (const level of levels) {
      for (const difficulty of [1, 2, 3] as const) {
        for (let i = 0; i < 25; i++) {
          const { rounds } = generate(difficulty, level);
          for (const r of rounds) {
            if (r.payload.mode === 'unit') {
              for (const label of r.payload.options) {
                expect(categoryOfLabel(label)).toBe(r.payload.obj.category);
              }
              expect(new Set(r.payload.options).size).toBe(r.payload.options.length);
            }
          }
        }
      }
    }
  });

  it('усі 4 класи (grade1..grade4) × difficulty 1/2/3 — unit-раунди без крос-категорійних дистракторів', () => {
    const classes = ['grade1', 'grade2', 'grade3', 'grade4'] as const;
    for (const classLevel of classes) {
      for (const difficulty of [1, 2, 3] as const) {
        for (let i = 0; i < 15; i++) {
          const { rounds } = generate(difficulty, 'L3', classLevel);
          for (const r of rounds) {
            if (r.payload.mode === 'unit') {
              for (const label of r.payload.options) {
                expect(categoryOfLabel(label)).toBe(r.payload.obj.category);
              }
              expect(new Set(r.payload.options).size).toBe(r.payload.options.length);
            }
          }
        }
      }
    }
  });
});
