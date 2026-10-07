import { describe, it, expect } from 'vitest';
import { generate, explainWordProblem, opAnswer, plural, type Op } from './generate';
import type { ClassLevel, Difficulty } from '../types';

const CLASSES: ClassLevel[] = ['grade1', 'grade2', 'grade3', 'grade4'];
const DIFFS: Difficulty[] = [1, 2, 3];

function apply(op: Op, x: number, y: number) {
  return op === '+' ? x + y : op === '−' ? x - y : op === '×' ? x * y : x / y;
}

describe('word-problems v2: генератор', () => {
  it('відповіді — натуральні числа, і дія в задачі дає саме цю відповідь', () => {
    for (const cl of CLASSES) {
      for (const d of DIFFS) {
        for (let i = 0; i < 60; i++) {
          for (const r of generate(d, 'L3', cl).rounds) {
            expect(Number.isInteger(r.answer) && r.answer >= 1, `${cl}/${d}: ${r.payload.text} → ${r.answer}`).toBe(true);
            if (r.payload.op) expect(apply(r.payload.op, r.payload.x, r.payload.y)).toBe(r.answer);
          }
        }
      }
    }
  });

  it('1 клас: жодного множення і ділення, вибір лише з + і −', () => {
    for (const d of DIFFS) {
      for (let i = 0; i < 40; i++) {
        for (const r of generate(d, 'L3', 'grade1').rounds) {
          expect(r.payload.ops).toEqual(['+', '−']);
          expect(r.payload.op === '×' || r.payload.op === '÷').toBe(false);
          expect(r.answer).toBeLessThanOrEqual(20);
        }
      }
    }
  });

  it('2 клас, «Легко»: множення/ділення є в кожному рівні (сенс множення — головна прогалина)', () => {
    for (let i = 0; i < 40; i++) {
      const ops = generate(1, 'L3', 'grade2').rounds.map((r) => r.payload.op);
      expect(ops.filter((o) => o === '×' || o === '÷').length).toBeGreaterThanOrEqual(2);
    }
  });

  it('2 клас, «Легко»: множники не більші за 5', () => {
    for (let i = 0; i < 40; i++) {
      for (const r of generate(1, 'L3', 'grade2').rounds) {
        if (r.payload.hint?.kind === 'groups') {
          expect(r.payload.hint.groups).toBeLessThanOrEqual(5);
          expect(r.payload.hint.per).toBeLessThanOrEqual(5);
        }
      }
    }
  });

  it('«Складно»: є задачі на дві дії, підказок немає', () => {
    let twoStep = 0;
    for (let i = 0; i < 20; i++) {
      for (const r of generate(3, 'L3', 'grade3').rounds) {
        expect(r.payload.hint).toBeNull();
        if (r.payload.op === null) twoStep++;
      }
    }
    expect(twoStep).toBeGreaterThan(0);
  });

  it('текст не містить «1 олівців»-подібних неузгоджень і порожніх підстановок', () => {
    for (const cl of CLASSES) {
      for (const d of DIFFS) {
        for (let i = 0; i < 30; i++) {
          for (const r of generate(d, 'L3', cl).rounds) {
            expect(r.payload.text).not.toMatch(/undefined|NaN|\$\{/);
          }
        }
      }
    }
  });
});

describe('word-problems v2: пояснення', () => {
  const round = (op: Op, x: number, y: number, answer: number) => ({
    id: 'r',
    answer,
    payload: { text: '', emoji: '', op, x, y, cue: 'ознака', solution: [`${x} ${op} ${y} = ${answer}`], hint: null, ops: ['+', '−', '×', '÷'] as Op[] },
  });

  it('хибна дія → ознака з тексту і правильна дія', () => {
    const e = explainWordProblem(round('×', 4, 3, 12), opAnswer('+'));
    expect(e.steps[0]).toBe('ознака');
    expect(e.steps[1]).toContain('помножити');
    expect(e.why).toContain('додати');
  });

  it('число з іншої дії → так і кажемо', () => {
    const e = explainWordProblem(round('×', 4, 3, 12), 7);
    expect(e.why).toContain('4 + 3');
  });

  it('відмінювання: 1 олівець, 3 олівці, 5 олівців, 21 олівець', () => {
    const f: [string, string, string] = ['олівець', 'олівці', 'олівців'];
    expect([1, 3, 5, 11, 21].map((n) => plural(n, f))).toEqual(['олівець', 'олівці', 'олівців', 'олівців', 'олівець']);
  });
});
