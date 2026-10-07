import { describe, it, expect } from 'vitest';
import { TASKS as JUGS, minMoves as jugMoves, pour as jugPour } from '../pz-jugs/core';
import { CAP, LEVELS as SORT, generate as sortGen, isSolvable, isSolved as sortSolved, pour as sortPour } from '../pz-sort/core';
import { balance, makeTasks as scaleTasks, reachable } from '../pz-scales/core';
import { isFair, makeTasks as shareTasks } from '../pz-share/core';
import { canMove, isSolved as hanoiSolved, move as hanoiMove, start as hanoiStart } from '../pz-hanoi/core';
import { allOff, generate as lightsGen, press } from '../pz-lights/core';
import { SIZE as MAZE, generate as mazeGen, pathLength } from '../pz-maze/core';
import { makeRound as heavierRound } from '../pz-heavier/generate';
import { canAdd, generate as pathGen, neighbours } from '../pz-path/core';
import { TASKS as RIVER, cross, minCrossings, startState, trouble } from '../pz-river/core';

const D = [1, 2, 3] as const;

describe('Переливайка', () => {
  it('кожна задача розв\'язна, і рівні не легшають', () => {
    for (const d of D) for (const t of JUGS[d]) expect(jugMoves(t), JSON.stringify(t)).toBeGreaterThan(0);
    const worst = (d: 1 | 2 | 3) => Math.max(...JUGS[d].map(jugMoves));
    expect(worst(1)).toBeLessThanOrEqual(worst(2));
  });
  it('переливання не переповнює банку й не створює воду', () => {
    const t = JUGS[2][0];
    expect(jugPour(t, [0, 5], 1, 0)).toEqual([3, 2]);
  });
});

describe('Сортуй кольори', () => {
  it('розкладка розв\'язна, не складена, кожного кольору рівно CAP', () => {
    for (const d of D) {
      for (let k = 0; k < 5; k++) {
        const t = sortGen(d);
        expect(sortSolved(t)).toBe(false);
        expect(isSolvable(t)).toBe(true);
        const counts = t.flat().reduce<Record<number, number>>((m, c) => ((m[c] = (m[c] ?? 0) + 1), m), {});
        expect(Object.values(counts).every((v) => v === CAP)).toBe(true);
        expect(t.length).toBe(SORT[d].colors + SORT[d].empty);
      }
    }
  });
  it('лити можна лише на такий самий колір або в порожню', () => {
    expect(sortPour([[0, 1], [0]], 0, 1)).toEqual([[0, 1], [0]]);
    expect(sortPour([[0, 1], [1]], 0, 1)).toEqual([[0], [1, 1]]);
  });
});

describe('Терези', () => {
  it('вагу завжди можна врівноважити; на 3 рівні — лише з гирями на обох шальках', () => {
    for (const d of D) {
      for (const t of scaleTasks(d)) {
        expect(reachable(t.weights, t.weight, t.twoSided)).toBe(true);
        if (d === 3) expect(reachable(t.weights, t.weight, false)).toBe(false);
      }
    }
  });
  it('баланс: гирі справа мінус предмет', () => {
    const t = { item: { emoji: '🍉', name: 'кавун', acc: 'кавун' }, weight: 7, weights: [1, 2, 5], twoSided: false };
    expect(balance(t, [0, 1, 1])).toBe(0);
  });
});

describe('Розклади порівну', () => {
  it('на 1–2 рівнях ділиться націло, на 3 — з остачею', () => {
    for (const t of shareTasks(1)) expect(t.n % t.k).toBe(0);
    for (const t of shareTasks(3)) expect(t.n % t.k).toBeGreaterThan(0);
  });
  it('порівну — коли тарілки рівні і в коробці менше, ніж тарілок', () => {
    expect(isFair([4, 4, 4], 0)).toBe(true);
    expect(isFair([4, 4, 4], 2)).toBe(true);
    expect(isFair([4, 4, 4], 3)).toBe(false);
    expect(isFair([5, 4, 4], 0)).toBe(false);
  });
});

describe('Ханойська вежа', () => {
  it('розв\'язується класичним алгоритмом за 2^n−1 ходів', () => {
    const solve = (n: number, a: number, b: number, c: number, out: [number, number][]) => {
      if (n === 0) return;
      solve(n - 1, a, c, b, out);
      out.push([a, c]);
      solve(n - 1, b, a, c, out);
    };
    for (const n of [3, 4, 5]) {
      const moves: [number, number][] = [];
      solve(n, 0, 1, 2, moves);
      let p = hanoiStart(n);
      for (const [f, t] of moves) {
        expect(canMove(p, f, t)).toBe(true);
        p = hanoiMove(p, f, t);
      }
      expect(hanoiSolved(p, n)).toBe(true);
      expect(moves.length).toBe(2 ** n - 1);
    }
  });
  it('велике на мале — не можна', () => {
    const p = hanoiMove(hanoiStart(3), 0, 1);
    expect(canMove(p, 0, 1)).toBe(false);
  });
});

describe('Вимкни всі лампи', () => {
  it('поле розв\'язне тими самими натисканнями (натискання — своє обернене)', () => {
    for (const d of D) {
      const g = lightsGen(d);
      expect(allOff(g.board)).toBe(false);
      const presses: number[] = [];
      for (let i = 0; i < g.n * g.n; i++) presses.push(i);
      // перебір усіх підмножин для 3×3 (512) — доводить розв'язність
      if (g.n === 3) {
        const ok = Array.from({ length: 512 }).some((_, mask) => allOff(presses.filter((i) => mask & (1 << i)).reduce((b, i) => press(b, i, 3), g.board)));
        expect(ok).toBe(true);
      }
    }
  });
});

describe('Лабіринт', () => {
  it('вихід досяжний; на більших рівнях шлях довший', () => {
    for (const d of D) {
      const n = MAZE[d];
      expect(pathLength(mazeGen(n), n)).toBeGreaterThanOrEqual(2 * (n - 1));
    }
  });
});

describe('Хто важчий?', () => {
  it('відповідь — серед варіантів і випливає зі зважувань', () => {
    for (const d of D) {
      for (let k = 0; k < 20; k++) {
        const { payload, answer } = heavierRound(d);
        expect(payload.options).toContain(answer);
        const heavies = new Set(payload.weighings.map((w) => w.heavy));
        const lights = new Set(payload.weighings.map((w) => w.light));
        if (payload.ask === 'heaviest') expect(heavies.has(answer) && !lights.has(answer)).toBe(true);
        else expect(lights.has(answer) && !heavies.has(answer)).toBe(true);
      }
    }
  });
});

describe('Шлях до числа', () => {
  it('є шлях потрібної довжини з потрібною сумою', () => {
    for (const d of D) {
      const t = pathGen(d);
      const find = (path: number[], sum: number): boolean => {
        if (sum === t.target && path.length === t.len) return true;
        if (sum >= t.target || path.length >= t.len) return false;
        const next = path.length ? neighbours(path[path.length - 1], t.n) : t.grid.map((_, i) => i);
        return next.some((i) => canAdd(path, i, t.n) && find([...path, i], sum + t.grid[i]));
      };
      expect(find([], 0)).toBe(true);
    }
  });
});

describe('Переправа', () => {
  it('кожну переправу можна пройти; класика — за 7 переправ', () => {
    for (const d of D) expect(minCrossings(RIVER[d]), `рівень ${d}`).toBeGreaterThan(0);
    expect(minCrossings(RIVER[1])).toBe(7);
  });
  it('везти вовка першим — коза з капустою лишаються самі', () => {
    const t = RIVER[1];
    expect(trouble(t, cross(t, startState(t), ['wolf'])!)).toEqual(['goat', 'cabbage']);
  });
});
