import { describe, expect, it } from 'vitest';
import { CLASS_COMPARE_CFG, generate, maxFor, MAX_BY_TRACK } from './generate';

describe('math-compare: maxFor (D5 шкала L0-L4, два треки)', () => {
  it('L0-профіль: межа завжди 10 у реально задіяних L0-L2 (без масштабування складністю)', () => {
    expect(maxFor('L0', 1)).toBe(10);
    expect(maxFor('L0', 2)).toBe(10);
    expect(maxFor('L0', 3)).toBe(10);
  });

  it('L3-профіль: зберігає попередню відповідність difficulty→max (100 → 1000 → 1000)', () => {
    expect(maxFor('L3', 1)).toBe(100);
    expect(maxFor('L3', 2)).toBe(1000);
    expect(maxFor('L3', 3)).toBe(1000);
  });

  it('обидва треки монотонно не спадають від L0 до L4', () => {
    const bands = ['L0', 'L1', 'L2', 'L3', 'L4'] as const;
    for (const level of ['L0', 'L3'] as const) {
      for (let i = 1; i < bands.length; i++) {
        expect(MAX_BY_TRACK[level][bands[i]]).toBeGreaterThanOrEqual(MAX_BY_TRACK[level][bands[i - 1]]);
      }
    }
  });
});

describe('math-compare: generate', () => {
  it('L0-профіль — обидва числа в межах 1..10 незалежно від difficulty', () => {
    for (const difficulty of [1, 2, 3] as const) {
      for (let i = 0; i < 15; i++) {
        const { rounds } = generate(difficulty, 'L0');
        for (const r of rounds) {
          expect(r.payload.left).toBeGreaterThanOrEqual(1);
          expect(r.payload.left).toBeLessThanOrEqual(10);
          expect(r.payload.right).toBeGreaterThanOrEqual(1);
          expect(r.payload.right).toBeLessThanOrEqual(10);
        }
      }
    }
  });

  it('L3-профіль difficulty=1 — числа не перевищують 100', () => {
    for (let i = 0; i < 20; i++) {
      const { rounds } = generate(1, 'L3');
      for (const r of rounds) {
        expect(r.payload.left).toBeLessThanOrEqual(100);
        expect(r.payload.right).toBeLessThanOrEqual(100);
      }
    }
  });

  it('відповідь відповідає знаку порівняння', () => {
    const { rounds } = generate(2, 'L3');
    for (const r of rounds) {
      const expected = r.payload.left < r.payload.right ? '<' : r.payload.left > r.payload.right ? '>' : '=';
      expect(r.answer).toBe(expected);
    }
  });
});

describe('math-compare: CLASS_COMPARE_CFG (G2b, обрій за класом)', () => {
  // 11.10.2026: програма Савченко — у 1 класі вирази «сума і різниця»
  it('кількість дій не спадає grade1 (+ і −) → grade2 (4 дії) → grade3 → grade4', () => {
    expect(CLASS_COMPARE_CFG.grade1.opsAllowed).toEqual(['+', '−']);
    expect(CLASS_COMPARE_CFG.grade2.opsAllowed).toHaveLength(4);
    const order = ['grade1', 'grade2', 'grade3', 'grade4'] as const;
    for (let i = 1; i < order.length; i++) {
      expect(CLASS_COMPARE_CFG[order[i]].opsAllowed.length).toBeGreaterThanOrEqual(
        CLASS_COMPARE_CFG[order[i - 1]].opsAllowed.length,
      );
    }
  });

  it('діапазони не звужуються grade2 → grade3 → grade4; лише grade4 має useOrderOfOps', () => {
    expect(CLASS_COMPARE_CFG.grade3.addSubRange[1]).toBeGreaterThanOrEqual(CLASS_COMPARE_CFG.grade2.addSubRange[1]);
    expect(CLASS_COMPARE_CFG.grade4.addSubRange[1]).toBeGreaterThanOrEqual(CLASS_COMPARE_CFG.grade3.addSubRange[1]);
    expect(CLASS_COMPARE_CFG.grade1.useOrderOfOps).toBe(false);
    expect(CLASS_COMPARE_CFG.grade2.useOrderOfOps).toBe(false);
    expect(CLASS_COMPARE_CFG.grade3.useOrderOfOps).toBe(false);
    expect(CLASS_COMPARE_CFG.grade4.useOrderOfOps).toBe(true);
  });
});

describe('math-compare: generate — класовий масштаб (G2b, classLevel)', () => {
  it('відповідь завжди узгоджена зі знаком порівняння значень (з виразами і без)', () => {
    for (const cl of ['grade1', 'grade2', 'grade3', 'grade4'] as const) {
      for (const difficulty of [1, 2, 3] as const) {
        const { rounds } = generate(difficulty, 'L3', cl);
        for (const r of rounds) {
          const expected =
            r.payload.left < r.payload.right ? '<' : r.payload.left > r.payload.right ? '>' : '=';
          expect(r.answer).toBe(expected);
        }
      }
    }
  });

  it('grade1 difficulty=3 (два вирази) — лише сума й різниця, без × і ÷', () => {
    for (let i = 0; i < 20; i++) {
      const { rounds } = generate(3, 'L3', 'grade1');
      for (const r of rounds) {
        for (const text of [r.payload.leftDisplay, r.payload.rightDisplay]) {
          if (text) expect(/[×÷]/.test(text)).toBe(false);
        }
      }
    }
  });

  it('grade2 difficulty=3 — серед виразів трапляються × або ÷ ("4 дії")', () => {
    let sawMulOrDiv = false;
    for (let i = 0; i < 40; i++) {
      const { rounds } = generate(3, 'L3', 'grade2');
      for (const r of rounds) {
        for (const text of [r.payload.leftDisplay, r.payload.rightDisplay]) {
          if (text && /[×÷]/.test(text)) sawMulOrDiv = true;
        }
      }
    }
    expect(sawMulOrDiv).toBe(true);
  });

  it('grade4 difficulty=3 — трапляються вирази з ПОРЯДКОМ ДІЙ (два знаки, напр. "3×4+2")', () => {
    let sawTwoOps = false;
    for (let i = 0; i < 60; i++) {
      const { rounds } = generate(3, 'L3', 'grade4');
      for (const r of rounds) {
        for (const text of [r.payload.leftDisplay, r.payload.rightDisplay]) {
          if (text && (text.match(/[+−×÷]/g)?.length ?? 0) >= 2) sawTwoOps = true;
        }
      }
    }
    expect(sawTwoOps).toBe(true);
  });

  it('difficulty=1 — обидві сторони лишаються простими числами (display == саме число, без знаків дій)', () => {
    for (const cl of ['grade1', 'grade2', 'grade3', 'grade4'] as const) {
      const { rounds } = generate(1, 'L3', cl);
      for (const r of rounds) {
        expect(r.payload.leftDisplay).toBe(String(r.payload.left));
        expect(r.payload.rightDisplay).toBe(String(r.payload.right));
      }
    }
  });

  it('classLevel="preschool" — поводиться як fallback (лише числа, без виразів)', () => {
    for (let i = 0; i < 15; i++) {
      const { rounds } = generate(1, 'L0', 'preschool');
      for (const r of rounds) {
        expect(r.payload.leftDisplay).toBeUndefined();
        expect(r.payload.left).toBeGreaterThanOrEqual(1);
        expect(r.payload.left).toBeLessThanOrEqual(10);
      }
    }
  });

  it('classLevel не задано — поведінка ідентична попередній (fallback через maxFor)', () => {
    const withUndefined = generate(1, 'L3', undefined);
    const withoutParam = generate(1, 'L3');
    for (const r of [...withUndefined.rounds, ...withoutParam.rounds]) {
      expect(r.payload.leftDisplay).toBeUndefined();
      expect(r.payload.left).toBeLessThanOrEqual(100);
    }
  });
});
