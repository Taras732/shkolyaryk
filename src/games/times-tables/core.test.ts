import { describe, it, expect } from 'vitest';
import {
  SESSION_LEN,
  KNOWN_STREAK,
  buildSession,
  explainDivide,
  explainMultiply,
  factKey,
  recommendedTable,
  recordAnswer,
  requeue,
  tableFacts,
  tableProgress,
  weakFacts,
  type FactStats,
} from './core';

/** Детермінований rng — тести не флейкають. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function learn(stats: FactStats, facts: string[]): FactStats {
  let out = stats;
  for (const f of facts) for (let i = 0; i < KNOWN_STREAK; i++) out = recordAnswer(out, f, true, i);
  return out;
}

describe('times-tables v2: факти і прогрес', () => {
  it('факт не залежить від порядку множників (6×7 = 7×6)', () => {
    expect(factKey(7, 6)).toBe(factKey(6, 7));
  });

  it('таблиця — 8 фактів ×2…×9', () => {
    expect(tableFacts(6)).toHaveLength(8);
    expect(tableFacts(6)).toContain('6x6');
  });

  it('вивчене до ×5 → радимо ×6 (кейс Емілії)', () => {
    let stats: FactStats = {};
    for (const n of [2, 3, 4, 5]) stats = learn(stats, tableFacts(n));
    expect(recommendedTable(stats)).toBe(6);
    expect(tableProgress(stats, 5).known).toBe(8);
  });

  it('помилка скидає серію; слабкий факт потрапляє в «Мої помилки»', () => {
    let stats = learn({}, ['7x8']);
    stats = recordAnswer(stats, '7x8', false, 10);
    expect(stats['7x8'].streak).toBe(0);
    expect(weakFacts(stats)).toEqual(['7x8']);
  });
});

describe('times-tables v2: сесія', () => {
  it('таблиця на «Легко» — по порядку, таблиця першим множником, відповіді правильні', () => {
    const qs = buildSession({ kind: 'table', n: 7 }, 1, {}, seeded(1));
    expect(qs).toHaveLength(SESSION_LEN);
    expect(qs.slice(0, 8).map((q) => q.b)).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
    for (const q of qs) {
      expect(q.op).toBe('×');
      expect(q.a).toBe(7);
      expect(q.answer).toBe(q.a * q.b);
    }
  });

  it('«Складно» додає ділення, і воно завжди націло', () => {
    let divisions = 0;
    for (let s = 1; s < 40; s++) {
      for (const q of buildSession({ kind: 'table', n: 8 }, 3, {}, seeded(s))) {
        if (q.op === '÷') {
          divisions++;
          expect(q.a % q.b).toBe(0);
          expect(q.answer).toBe(q.a / q.b);
        } else expect(q.answer).toBe(q.a * q.b);
      }
    }
    expect(divisions).toBeGreaterThan(0);
  });

  it('«Мої помилки» без помилок — порожньо, а не випадкові приклади', () => {
    expect(buildSession({ kind: 'mistakes' }, 1, {})).toEqual([]);
  });

  it('«Мої помилки» беруть лише слабкі факти', () => {
    const stats = recordAnswer(recordAnswer({}, '6x7', false, 1), '8x9', false, 2);
    const qs = buildSession({ kind: 'mistakes' }, 2, stats, seeded(3));
    expect(qs).toHaveLength(SESSION_LEN);
    for (const q of qs) expect(['6x7', '8x9']).toContain(q.fact);
  });

  it('«Мікс» не стрибає вперед: лише таблиці до рекомендованої', () => {
    let stats: FactStats = {};
    for (const n of [2, 3]) stats = learn(stats, tableFacts(n));
    const allowed = new Set([...tableFacts(2), ...tableFacts(3), ...tableFacts(4)]);
    for (let s = 1; s < 20; s++) {
      for (const q of buildSession({ kind: 'mix' }, 2, stats, seeded(s))) expect(allowed.has(q.fact)).toBe(true);
    }
  });

  it('помилкове питання повертається через кілька інших', () => {
    const qs = buildSession({ kind: 'table', n: 6 }, 1, {}, seeded(5));
    const next = requeue(qs, 2);
    expect(next).toHaveLength(qs.length + 1);
    expect(next[6]).toBe(qs[2]);
  });
});

describe('times-tables v2: пояснення', () => {
  it('«від п\'ятірки» для великих множників сходиться до правильної відповіді', () => {
    for (let a = 6; a <= 9; a++) {
      for (let b = a; b <= 9; b++) {
        const steps = explainMultiply(a, b, 0).steps.join(' ');
        expect(steps).toContain(`→ ${a * b}`);
      }
    }
  });

  it('ділення пояснюється через множення', () => {
    const e = explainDivide(42, 6, 6);
    expect(e.steps.join(' ')).toContain('6 × 7 = 42');
  });

  it('ділення: розпізнає «відняла замість поділити»', () => {
    expect(explainDivide(42, 6, 36).why).toContain('віднімання');
  });
});
