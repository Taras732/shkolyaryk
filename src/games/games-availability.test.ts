import { describe, it, expect } from 'vitest';
import { gamesForClass } from './registry';
import { CLASS_LEVELS, type ClassLevel } from './types';

const idsFor = (cl: ClassLevel) => gamesForClass(cl).map((g) => g.id);

describe('gamesForClass (G3) — доступність ігор за класом', () => {
  it('дошкільня НЕ бачить старших математичних тем', () => {
    const pre = idsFor('preschool');
    expect(pre).not.toContain('times-tables');
    expect(pre).not.toContain('fractions-compare');
    expect(pre).not.toContain('magic-square');
    expect(pre).not.toContain('column-arithmetic');
  });

  it('4 клас бачить старші теми (множення, дроби, магічний квадрат)', () => {
    const g4 = idsFor('grade4');
    expect(g4).toContain('times-tables');
    expect(g4).toContain('fractions-compare');
    expect(g4).toContain('magic-square');
  });

  it('множення/дроби — з 2 класу, не з 1', () => {
    expect(idsFor('grade1')).not.toContain('times-tables');
    expect(idsFor('grade1')).not.toContain('column-arithmetic');
    expect(idsFor('grade2')).toContain('times-tables');
    expect(idsFor('grade2')).toContain('fractions-compare');
  });

  it('магічний квадрат — лише 3–4 клас', () => {
    expect(idsFor('grade2')).not.toContain('magic-square');
    expect(idsFor('grade3')).toContain('magic-square');
  });

  it('кожен клас має непорожній набір ігор', () => {
    for (const cl of CLASS_LEVELS as ClassLevel[]) {
      expect(gamesForClass(cl).length).toBeGreaterThan(0);
    }
  });
});
