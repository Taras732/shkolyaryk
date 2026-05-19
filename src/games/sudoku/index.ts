import type { GameDefinition, LevelSpec, Task } from '../types';
import type { AgeGroupId } from '../../constants/ageGroups';
import { Renderer, type SudokuAnswer, type SudokuPayload } from './Renderer';
import { buildPuzzle, generateSolvedSudoku } from './solver';

const TASKS_PER_LEVEL = 1;

function givenCountFor(difficulty: number, ageGroupId: AgeGroupId | undefined): number {
  const group = ageGroupId ?? 'grade1';
  if (group === 'grade1') {
    if (difficulty <= 1) return 78;
    if (difficulty === 2) return 72;
    return 65;
  }
  if (group === 'grade2') {
    if (difficulty <= 1) return 60;
    if (difficulty === 2) return 55;
    return 50;
  }
  if (group === 'grade3') {
    if (difficulty <= 1) return 50;
    if (difficulty === 2) return 45;
    return 40;
  }
  // grade4
  if (difficulty <= 1) return 42;
  if (difficulty === 2) return 36;
  return 30;
}

function generateTask(index: number, givenCount: number): Task<SudokuAnswer> {
  const solution = generateSolvedSudoku();
  const puzzle = buildPuzzle(solution, givenCount);
  const payload: SudokuPayload = { puzzle, solution };
  return { id: `t${index}`, payload };
}

function generateLevel(difficulty: number, ageGroupId?: AgeGroupId): LevelSpec<SudokuAnswer> {
  const givenCount = givenCountFor(difficulty, ageGroupId);
  const tasks: Task<SudokuAnswer>[] = [];
  for (let i = 0; i < TASKS_PER_LEVEL; i++) {
    tasks.push(generateTask(i, givenCount));
  }
  return {
    seed: `sudoku-${Date.now()}`,
    difficulty,
    tasks,
  };
}

function gridsEqual(a: number[][], b: number[][]): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

const sudoku: GameDefinition<LevelSpec<SudokuAnswer>, SudokuAnswer> = {
  id: 'sudoku',
  islandId: 'logic',
  name: 'game.sudoku.name',
  icon: '🔢',
  rulesKey: 'game.sudoku.rules',
  availableFor: ['grade1', 'grade2', 'grade3', 'grade4'],
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as SudokuPayload;
    return { correct: gridsEqual(answer, p.solution) };
  },
  gradeFit: { kindergarten: true, grade1: true, grade2: true, grade3: true, grade4: true },
  Renderer,
};

export default sudoku;
