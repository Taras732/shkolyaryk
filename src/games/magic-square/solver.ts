// 3×3 magic square (Lo Shu) — every row/column/diagonal sums to 15.
// 8 symmetric variants via rotations + reflections.

export type MagicCell = number | null;

const LO_SHU: number[][] = [
  [2, 9, 4],
  [7, 5, 3],
  [6, 1, 8],
];

export const MAGIC_SUM = 15;

function rotateCW(grid: number[][]): number[][] {
  const n = grid.length;
  const result: number[][] = Array.from({ length: n }, () => Array<number>(n).fill(0));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      result[c][n - 1 - r] = grid[r][c];
    }
  }
  return result;
}

function flipHorizontal(grid: number[][]): number[][] {
  return grid.map((row) => row.slice().reverse());
}

export function generateMagicSquare(): number[][] {
  let grid = LO_SHU.map((row) => [...row]);
  const rotations = Math.floor(Math.random() * 4);
  for (let i = 0; i < rotations; i++) grid = rotateCW(grid);
  if (Math.random() < 0.5) grid = flipHorizontal(grid);
  return grid;
}

// True if the grid is a fully filled, valid 3×3 magic square that preserves
// all of the puzzle's givens. Validates by rules — does NOT compare to a
// reference solution. Requires: a permutation of 1..9, and every row, column
// and both diagonals summing to MAGIC_SUM.
export function isValidMagicSquare(grid: MagicCell[][], puzzle: MagicCell[][]): boolean {
  const seen = new Set<number>();
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const v = grid[r][c];
      if (v === null || v < 1 || v > 9) return false;
      if (seen.has(v)) return false;
      seen.add(v);
      const given = puzzle[r][c];
      if (given !== null && given !== v) return false;
    }
  }
  for (let i = 0; i < 3; i++) {
    let rowSum = 0;
    let colSum = 0;
    for (let j = 0; j < 3; j++) {
      rowSum += grid[i][j] as number;
      colSum += grid[j][i] as number;
    }
    if (rowSum !== MAGIC_SUM || colSum !== MAGIC_SUM) return false;
  }
  const diag1 = (grid[0][0] as number) + (grid[1][1] as number) + (grid[2][2] as number);
  const diag2 = (grid[0][2] as number) + (grid[1][1] as number) + (grid[2][0] as number);
  if (diag1 !== MAGIC_SUM || diag2 !== MAGIC_SUM) return false;
  return true;
}

export function buildPuzzle(solved: number[][], emptyCount: number): MagicCell[][] {
  const puzzle: MagicCell[][] = solved.map((row) => [...row]);
  const positions: [number, number][] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) positions.push([r, c]);
  // shuffle
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  const toRemove = Math.max(0, Math.min(9, emptyCount));
  for (let i = 0; i < toRemove; i++) {
    const [r, c] = positions[i];
    puzzle[r][c] = null;
  }
  return puzzle;
}
