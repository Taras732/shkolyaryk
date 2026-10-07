import { describe, expect, it } from 'vitest';
import type { ClassLevel, Difficulty, ProfileLevel } from '../types';
import { CLASS_LEVELS } from '../types';
import { bandConfigFor, classBandConfigFor, generate } from './generate';

const DIFFICULTIES: Difficulty[] = [1, 2, 3];

/** Найбільше число, що фактично з'являється в раунді (операнд або відповідь) — проста метрика "ваги" прикладу. */
function weight(payload: { a: number; b: number; correct: number }): number {
  return Math.max(payload.a, payload.b, payload.correct);
}

describe('math-examples: bandConfigFor (D5 шкала L0-L4, два треки)', () => {
  it('L0-профіль: L0 найлегше (лише +), L4 найважче (max та кількість дій не спадають)', () => {
    expect(bandConfigFor('L0', 1)).toEqual({ ops: ['+'], max: 10 });
    expect(bandConfigFor('L0', 1).ops).toHaveLength(1);
    expect(bandConfigFor('L0', 2).ops.length).toBeGreaterThanOrEqual(bandConfigFor('L0', 1).ops.length);
    expect(bandConfigFor('L0', 3).max).toBeGreaterThanOrEqual(bandConfigFor('L0', 1).max);
  });

  it('L3-профіль: зберігає попередню відповідність difficulty→ops/max', () => {
    expect(bandConfigFor('L3', 1)).toEqual({ ops: ['×', '+', '−'], max: 100 });
    expect(bandConfigFor('L3', 2)).toEqual({ ops: ['×', '÷', '+', '−'], max: 100 });
    expect(bandConfigFor('L3', 3)).toEqual({ ops: ['+', '−', '×'], max: 100 });
  });

  it('стик L2: найскладніший L0-профіль і найлегший L3-профіль — різний зміст, той самий band', () => {
    const l0Top = bandConfigFor('L0', 3);
    const l3Bottom = bandConfigFor('L3', 1);
    expect(l0Top).not.toEqual(l3Bottom);
    expect(l3Bottom.max).toBeGreaterThanOrEqual(l0Top.max);
  });
});

describe('math-examples: generate', () => {
  it('L0-профіль difficulty=1 — лише додавання, сума не перевищує max=10', () => {
    for (let i = 0; i < 20; i++) {
      const { rounds } = generate(1, 'L0');
      expect(rounds).toHaveLength(5);
      for (const r of rounds) {
        expect(r.payload.op).toBe('+');
        expect(r.payload.correct).toBe(r.payload.a + r.payload.b);
        expect(r.payload.correct).toBeLessThanOrEqual(10);
      }
    }
  });

  it('L3-профіль difficulty=2 — може містити ×/÷ у межах таблиці (без тривіального ×1/÷1)', () => {
    let sawMultiplyOrDivide = false;
    for (let i = 0; i < 20; i++) {
      const { rounds } = generate(2, 'L3');
      for (const r of rounds) {
        expect(['×', '÷', '+', '−']).toContain(r.payload.op);
        if (r.payload.op === '×' || r.payload.op === '÷') sawMultiplyOrDivide = true;
        if (r.payload.op === '×') {
          expect(r.payload.correct).toBe(r.payload.a * r.payload.b);
          expect(r.payload.a).toBeGreaterThanOrEqual(2);
          expect(r.payload.b).toBeGreaterThanOrEqual(2);
        }
        if (r.payload.op === '÷') {
          expect(r.payload.correct).toBe(r.payload.a / r.payload.b);
          expect(r.payload.b).toBeGreaterThanOrEqual(2);
          expect(r.payload.correct).toBeGreaterThanOrEqual(2);
        }
      }
    }
    expect(sawMultiplyOrDivide).toBe(true);
  });
});

describe('math-examples: classBandConfigFor (G2b, обрій за класом)', () => {
  it('обрій зростає grade1 < grade2 < grade3 == grade4 за max, ops не спадають', () => {
    expect(classBandConfigFor('grade1', 3).max).toBe(20);
    expect(classBandConfigFor('grade2', 3).max).toBe(100);
    expect(classBandConfigFor('grade3', 3).max).toBe(1000);
    expect(classBandConfigFor('grade4', 3).max).toBe(1000);

    const order = ['grade1', 'grade2', 'grade3', 'grade4'] as const;
    for (let i = 1; i < order.length; i++) {
      expect(classBandConfigFor(order[i], 3).max).toBeGreaterThanOrEqual(classBandConfigFor(order[i - 1], 3).max);
    }
  });

  it('grade1 — лише додавання на всіх difficulty (не як для малят, але без ×÷ у 1 класі)', () => {
    expect(classBandConfigFor('grade1', 1).ops).toEqual(['+']);
    expect(classBandConfigFor('grade1', 3).ops.every((o) => o === '+' || o === '−')).toBe(true);
  });

  it('grade3 difficulty=1 не має ÷, а grade4 difficulty=1 вже має повний набір дій (складніше при тому самому max)', () => {
    expect(classBandConfigFor('grade3', 1).ops).not.toContain('÷');
    expect(classBandConfigFor('grade4', 1).ops).toEqual(expect.arrayContaining(['+', '−', '×', '÷']));
  });

  it('grade2/grade3/grade4 — tableMax зростає з difficulty в межах класу (QA-фікс: раніше був пласким 10 всюди)', () => {
    expect(classBandConfigFor('grade2', 1).tableMax).toBeLessThan(classBandConfigFor('grade2', 3).tableMax);
    expect(classBandConfigFor('grade3', 1).tableMax).toBeLessThan(classBandConfigFor('grade3', 3).tableMax);
    expect(classBandConfigFor('grade4', 1).tableMax).toBeLessThan(classBandConfigFor('grade4', 3).tableMax);
  });

  it('grade4 має ширшу таблицю множення/ділення на hard (tableMax=12) за grade2/grade3 (10/11)', () => {
    expect(classBandConfigFor('grade2', 3).tableMax).toBe(10);
    expect(classBandConfigFor('grade3', 3).tableMax).toBe(11);
    expect(classBandConfigFor('grade4', 3).tableMax).toBe(12);
  });

  it('QA-фікс: grade2/grade3/grade4 мають нижню межу (min) для +/− узгоджену з розрядом класу', () => {
    expect(classBandConfigFor('grade2', 1).min).toBe(10);
    expect(classBandConfigFor('grade3', 1).min).toBe(100);
    expect(classBandConfigFor('grade4', 1).min).toBe(100);
    // preschool/grade1 — числа й так малі, floor=1 (дошкільний/1-класний діапазон не потребує "розряду").
    expect(classBandConfigFor('preschool', 1).min).toBe(1);
    expect(classBandConfigFor('grade1', 1).min).toBe(1);
  });
});

describe('math-examples: QA-фікс — немає вироджених прикладів (×1/×0/+0/−0)', () => {
  const CASES: Array<{ classLevel: ClassLevel; difficulty: Difficulty }> = [];
  for (const classLevel of CLASS_LEVELS) {
    for (const difficulty of DIFFICULTIES) CASES.push({ classLevel, difficulty });
  }

  it.each(CASES)('$classLevel diff=$difficulty — жодного ×1/×0, ÷ з дільником або часткою =1, +0/−0/x-x', ({ classLevel, difficulty }) => {
    for (let i = 0; i < 40; i++) {
      const { rounds } = generate(difficulty, 'L3', classLevel);
      for (const r of rounds) {
        const { a, b, op, correct } = r.payload;
        expect(a).toBeGreaterThan(0);
        expect(b).toBeGreaterThan(0);
        if (op === '×') {
          expect(a).toBeGreaterThanOrEqual(2);
          expect(b).toBeGreaterThanOrEqual(2);
        }
        if (op === '÷') {
          expect(b).toBeGreaterThanOrEqual(2); // дільник
          expect(correct).toBeGreaterThanOrEqual(2); // частка
        }
        if (op === '+') {
          expect(a).toBeGreaterThan(0);
          expect(b).toBeGreaterThan(0);
        }
        if (op === '−') {
          expect(b).toBeGreaterThan(0); // без "x - 0"
          expect(a).not.toBe(b); // без "x - x"
          expect(correct).toBeGreaterThan(0);
        }
      }
    }
  });

  it('L0/L3-профіль (fallback без classLevel) — теж без ×1/×0', () => {
    const profiles: ProfileLevel[] = ['L0', 'L3'];
    for (const level of profiles) {
      for (const difficulty of DIFFICULTIES) {
        for (let i = 0; i < 30; i++) {
          const { rounds } = generate(difficulty, level);
          for (const r of rounds) {
            if (r.payload.op === '×') {
              expect(r.payload.a).toBeGreaterThanOrEqual(2);
              expect(r.payload.b).toBeGreaterThanOrEqual(2);
            }
          }
        }
      }
    }
  });
});

describe('math-examples: QA-фікс — операнди в межах оголошеного band (класовий шлях)', () => {
  const CASES: Array<{ classLevel: ClassLevel; difficulty: Difficulty }> = [];
  for (const classLevel of CLASS_LEVELS) {
    for (const difficulty of DIFFICULTIES) CASES.push({ classLevel, difficulty });
  }

  it.each(CASES)('$classLevel diff=$difficulty — +/− у [min,max], ×/÷ у [2,tableMax]', ({ classLevel, difficulty }) => {
    const { min, max, tableMax } = classBandConfigFor(classLevel, difficulty);
    for (let i = 0; i < 40; i++) {
      const { rounds } = generate(difficulty, 'L3', classLevel);
      for (const r of rounds) {
        const { a, b, op, correct } = r.payload;
        if (op === '+' || op === '−') {
          expect(a).toBeGreaterThanOrEqual(min);
          expect(a).toBeLessThanOrEqual(max);
          expect(b).toBeGreaterThanOrEqual(min);
          expect(b).toBeLessThanOrEqual(max);
          expect(correct).toBeLessThanOrEqual(max);
        }
        if (op === '×') {
          expect(a).toBeLessThanOrEqual(tableMax);
          expect(b).toBeLessThanOrEqual(tableMax);
          expect(correct).toBe(a * b);
        }
        if (op === '÷') {
          expect(b).toBeLessThanOrEqual(tableMax); // дільник
          expect(correct).toBeLessThanOrEqual(tableMax); // частка
          expect(a).toBeLessThanOrEqual(tableMax * tableMax);
        }
      }
    }
  });
});

describe('math-examples: QA-фікс — монотонність складності (метрика = max(a,b,correct) за багато ітерацій)', () => {
  const ITERATIONS = 200;

  function observedMaxWeight(difficulty: Difficulty, level: ProfileLevel, classLevel?: ClassLevel): number {
    let max = 0;
    for (let i = 0; i < ITERATIONS; i++) {
      const { rounds } = generate(difficulty, level, classLevel);
      for (const r of rounds) max = Math.max(max, weight(r.payload));
    }
    return max;
  }

  it('GradeBand L0..L4 (fallback bandConfigFor, обидва треки профілю) — вага не спадає', () => {
    const l0Sequence = [1, 2, 3].map((d) => observedMaxWeight(d as Difficulty, 'L0'));
    // L0-профіль покриває лише GradeBand L0-L2 (D5) — перевіряємо саме ці три точки.
    for (let i = 1; i < l0Sequence.length; i++) {
      expect(l0Sequence[i]).toBeGreaterThanOrEqual(l0Sequence[i - 1]);
    }

    const l3Sequence = [1, 2, 3].map((d) => observedMaxWeight(d as Difficulty, 'L3'));
    for (let i = 1; i < l3Sequence.length; i++) {
      expect(l3Sequence[i]).toBeGreaterThanOrEqual(l3Sequence[i - 1]);
    }

    // Стик L2: найважчий L0-профіль (L2) не має бути важчим за найлегший L3-профіль (L2).
    expect(l0Sequence[l0Sequence.length - 1]).toBeLessThanOrEqual(l3Sequence[0]);
  });

  it('ClassLevel preschool→grade4 (найважча difficulty=3 кожного класу) — вага не спадає', () => {
    // Порівнюємо ОГОЛОШЕНІ межі конфігу, а не спостережений максимум випадкової
    // вибірки. Чому: grade3 і grade4 мають однакову межу для +/− (свідоме рішення —
    // grade4 важчий набором дій і ширшим tableMax), тож вибірковий максимум у них
    // статистично рівний і коливається: тест бачив «999 проти 1000» і падав
    // приблизно в 2 прогонах із 5. Flaky-тест гірший за відсутній — він привчає
    // ігнорувати червоне.
    const declared = CLASS_LEVELS.map((cl) => {
      const c = classBandConfigFor(cl, 3);
      return Math.max(c.max, c.tableMax * c.tableMax);
    });
    for (let i = 1; i < declared.length; i++) {
      expect(declared[i], `${CLASS_LEVELS[i]} легший за ${CLASS_LEVELS[i - 1]}`).toBeGreaterThanOrEqual(declared[i - 1]);
    }
  });

  it('спостережені приклади не виходять за оголошену межу класу (вибірка узгоджена з конфігом)', () => {
    for (const cl of CLASS_LEVELS) {
      const c = classBandConfigFor(cl, 3);
      const ceiling = Math.max(c.max, c.tableMax * c.tableMax);
      expect(observedMaxWeight(3, 'L3', cl), `${cl}: вибірка перевищила стелю конфігу`).toBeLessThanOrEqual(ceiling);
    }
  });

  it('у межах кожного класу difficulty 1→2→3 — вага не спадає', () => {
    // Знову оголошені межі, а не вибірка: у деяких класах difficulty 2 і 3 мають
    // однакову межу для +/− (важчає набір дій і tableMax), тож вибірковий максимум
    // статистично рівний — тест бачив «999 проти 1000» і падав через раз.
    for (const classLevel of CLASS_LEVELS) {
      const declared = DIFFICULTIES.map((d) => {
        const c = classBandConfigFor(classLevel, d);
        return Math.max(c.max, c.tableMax * c.tableMax);
      });
      for (let i = 1; i < declared.length; i++) {
        expect(declared[i], `${classLevel}: difficulty ${i + 1} легший за ${i}`).toBeGreaterThanOrEqual(declared[i - 1]);
      }
    }
  });
});

describe('math-examples: generate — класовий масштаб (G2b, classLevel)', () => {
  it('grade1 — сума/різниця не перевищує 20, лише +/-', () => {
    for (let i = 0; i < 25; i++) {
      const { rounds } = generate(3, 'L3', 'grade1');
      for (const r of rounds) {
        expect(['+', '−']).toContain(r.payload.op);
        expect(r.payload.correct).toBeLessThanOrEqual(20);
        expect(r.payload.correct).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('grade3 — числа в межах 1000, коректна відповідь для кожної дії, +/− завжди 3-значні (min=100)', () => {
    for (let i = 0; i < 25; i++) {
      const { rounds } = generate(2, 'L3', 'grade3');
      for (const r of rounds) {
        if (r.payload.op === '+') expect(r.payload.correct).toBe(r.payload.a + r.payload.b);
        if (r.payload.op === '−') expect(r.payload.correct).toBe(r.payload.a - r.payload.b);
        if (r.payload.op === '×') expect(r.payload.correct).toBe(r.payload.a * r.payload.b);
        if (r.payload.op === '÷') expect(r.payload.correct).toBe(r.payload.a / r.payload.b);
        if (r.payload.op === '+' || r.payload.op === '−') {
          expect(r.payload.correct).toBeLessThanOrEqual(1000);
          expect(r.payload.a).toBeGreaterThanOrEqual(100);
          expect(r.payload.b).toBeGreaterThanOrEqual(100);
        }
      }
    }
  });

  it('grade4 — множники таблиці на medium/hard (difficulty>=2) іноді перевищують 10 (до 12), на відміну від grade2/grade3', () => {
    let sawAbove10 = false;
    for (const difficulty of [2, 3] as Difficulty[]) {
      for (let i = 0; i < 40; i++) {
        const { rounds } = generate(difficulty, 'L3', 'grade4');
        for (const r of rounds) {
          if (r.payload.op === '×' || r.payload.op === '÷') {
            if (r.payload.a > 10 || r.payload.b > 10) sawAbove10 = true;
            expect(r.payload.a).toBeLessThanOrEqual(144); // 12*12
            expect(r.payload.b).toBeLessThanOrEqual(12);
          }
        }
      }
    }
    expect(sawAbove10).toBe(true);
  });

  it('classLevel не задано — поведінка ідентична попередній (fallback через bandConfigFor)', () => {
    const withUndefined = generate(2, 'L3', undefined);
    const withoutParam = generate(2, 'L3');
    for (const r of [...withUndefined.rounds, ...withoutParam.rounds]) {
      expect(['×', '÷', '+', '−']).toContain(r.payload.op);
    }
  });
});

describe('math-examples: усно в 3 класі — круглі числа (аудит 07.10)', () => {
  it('grade3 diff1: +/− лише круглі сотні; diff2-3 — круглі десятки', () => {
    for (const [d, r] of [[1, 100], [2, 10], [3, 10]] as const) {
      for (let i = 0; i < 50; i++) {
        for (const { payload } of generate(d, 'L3', 'grade3').rounds) {
          if (payload.op === '+' || payload.op === '−') {
            expect(payload.a % r).toBe(0);
            expect(payload.b % r).toBe(0);
            expect(payload.correct).toBeGreaterThan(0);
          }
        }
      }
    }
  });
});
