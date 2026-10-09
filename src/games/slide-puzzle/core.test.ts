import { describe, it, expect } from 'vitest';
import { LEVELS, isSolved, move, neighbours, shuffleByMoves } from './core';
import { scramble, swap, isSolved as picSolved } from '../pic-puzzle/core';
import { LOOK_ALIKE } from '../shared/look-alike';
import { buildTasks as buildSameTasks } from '../find-same/generate';
import { generate as shadowGen, SHADOW_SET } from '../find-shadow/generate';

/** Розв'язати пошуком у ширину — доводить, що розкладка складна в принципі. */
function solvable(b: number[], n: number): boolean {
  const seen = new Set([b.join()]);
  let frontier = [b];
  for (let depth = 0; depth < 40 && frontier.length; depth++) {
    const next: number[][] = [];
    for (const s of frontier) {
      if (isSolved(s)) return true;
      const empty = s.indexOf(n * n - 1);
      for (const p of neighbours(empty, n)) {
        const t = move(s, p, n);
        const k = t.join();
        if (!seen.has(k)) {
          seen.add(k);
          next.push(t);
        }
      }
    }
    frontier = next;
  }
  return frontier.some(isSolved);
}

describe("п'ятнашки", () => {
  it('розкладка не складена і розв\'язна', () => {
    for (let i = 0; i < 20; i++) {
      const b = shuffleByMoves(LEVELS[2].n, LEVELS[2].moves);
      expect(isSolved(b)).toBe(false);
      expect(solvable(b, 3)).toBe(true);
    }
  });

  it('хід можливий лише поруч із порожньою клітинкою', () => {
    const b = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    expect(move(b, 0, 3)).toBe(b);
    expect(move(b, 7, 3)).toEqual([0, 1, 2, 3, 4, 5, 6, 8, 7]);
  });
});

describe('пазл з картинки', () => {
  it('перемішаний щонайменше наполовину; обмін двох шматків', () => {
    for (let i = 0; i < 30; i++) {
      const a = scramble(4);
      expect(a.filter((v, k) => v !== k).length).toBeGreaterThanOrEqual(2);
      expect([...a].sort()).toEqual([0, 1, 2, 3]);
    }
    expect(picSolved(swap([1, 0, 2], 0, 1))).toBe(true);
  });
});

describe('уважність', () => {
  it('групи схожих — без повторів картинок', () => {
    const all = LOOK_ALIKE.flat();
    expect(new Set(all).size).toBe(all.length);
  });

  it('«Знайди всіх таких самих»: зразок сховано рівно count разів; на «Складно» — лише схожі', () => {
    for (const d of [1, 2, 3] as const) {
      for (const t of buildSameTasks(d)) {
        expect(t.cells.filter((c) => c === t.target)).toHaveLength(t.count);
        expect(t.count).toBe(d + 1);
      }
    }
    for (const t of buildSameTasks(3)) {
      const group = LOOK_ALIKE.find((g) => g.includes(t.target))!;
      for (const c of t.cells) expect(group).toContain(c);
    }
  });

  it('набір тіней — без повторів і без круглих предметів, що дають однакову тінь', () => {
    expect(new Set(SHADOW_SET).size).toBe(SHADOW_SET.length);
    for (const round of ['⚽', '🏀', '🍎', '🍏', '🍅', '🔴']) expect(SHADOW_SET).not.toContain(round);
  });

  it('«Знайди тінь»: правильна серед варіантів, варіанти різні', () => {
    for (const d of [1, 2, 3] as const) {
      for (const r of shadowGen(d).rounds) {
        expect(r.payload.options).toContain(r.payload.target);
        expect(new Set(r.payload.options).size).toBe(r.payload.options.length);
      }
    }
  });
});
