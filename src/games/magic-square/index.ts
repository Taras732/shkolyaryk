import type { GameDefinition, LevelSpec, Task } from '../types';
import type { AgeGroupId } from '../../constants/ageGroups';
import { Renderer, type MagicAnswer, type MagicPayload } from './Renderer';
import { buildPuzzle, generateMagicSquare } from './solver';

const TASKS_PER_LEVEL = 3;

function emptyCountFor(difficulty: number, ageGroupId: AgeGroupId | undefined): number {
  const group = ageGroupId ?? 'grade3';
  if (group === 'grade3') {
    if (difficulty <= 1) return 2;
    if (difficulty === 2) return 4;
    return 6;
  }
  // grade4
  if (difficulty <= 1) return 4;
  if (difficulty === 2) return 6;
  return 8;
}

function generateTask(index: number, emptyCount: number): Task<MagicAnswer> {
  const solution = generateMagicSquare();
  const puzzle = buildPuzzle(solution, emptyCount);
  const payload: MagicPayload = { puzzle, solution };
  return { id: `t${index}`, payload };
}

function generateLevel(difficulty: number, ageGroupId?: AgeGroupId): LevelSpec<MagicAnswer> {
  const emptyCount = emptyCountFor(difficulty, ageGroupId);
  const tasks: Task<MagicAnswer>[] = [];
  for (let i = 0; i < TASKS_PER_LEVEL; i++) {
    tasks.push(generateTask(i, emptyCount));
  }
  return {
    seed: `magic-square-${Date.now()}`,
    difficulty,
    tasks,
  };
}

function gridsEqual(a: number[][], b: number[][]): boolean {
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) if (a[r][c] !== b[r][c]) return false;
  return true;
}

const magicSquare: GameDefinition<LevelSpec<MagicAnswer>, MagicAnswer> = {
  id: 'magic-square',
  islandId: 'logic',
  name: 'game.magicSquare.name',
  icon: '✨',
  rulesKey: 'game.magicSquare.rules',
  availableFor: ['grade3', 'grade4'],
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as MagicPayload;
    return { correct: gridsEqual(answer, p.solution) };
  },
  gradeFit: { kindergarten: true, grade1: true, grade2: true, grade3: true, grade4: true },
  Renderer,
};

export default magicSquare;
