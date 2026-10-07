import { useEffect, useRef, useState } from 'react';
import type { GameDefinition, GameComponentProps, Difficulty, LevelData, Round } from '../types';
import { BOARD_DONE } from '../types';
import { shuffle } from '../shared/ui';

type Cell = number | null;
type Size = 4 | 6;

interface Payload {
  size: Size;
  puzzle: Cell[][];
  solution: number[][];
}

type Answer = typeof BOARD_DONE;

/** Розмір блоку (рядків×стовпців) для перевірки/розмітки. 4×4 → 2×2, 6×6 → 2×3. */
function boxDims(size: Size): { br: number; bc: number } {
  return size === 4 ? { br: 2, bc: 2 } : { br: 2, bc: 3 };
}

/** Розв'язана дошка через рандомізований backtracking (мала дошка — швидко). */
function generateSolvedGrid(size: Size): number[][] {
  const { br, bc } = boxDims(size);
  const grid: number[][] = Array.from({ length: size }, () => Array(size).fill(0));

  function isValid(r: number, c: number, v: number): boolean {
    for (let i = 0; i < size; i++) {
      if (grid[r][i] === v || grid[i][c] === v) return false;
    }
    const r0 = Math.floor(r / br) * br;
    const c0 = Math.floor(c / bc) * bc;
    for (let rr = r0; rr < r0 + br; rr++) {
      for (let cc = c0; cc < c0 + bc; cc++) {
        if (grid[rr][cc] === v) return false;
      }
    }
    return true;
  }

  function fill(pos: number): boolean {
    if (pos === size * size) return true;
    const r = Math.floor(pos / size);
    const c = pos % size;
    const digits = shuffle(Array.from({ length: size }, (_, i) => i + 1));
    for (const v of digits) {
      if (isValid(r, c, v)) {
        grid[r][c] = v;
        if (fill(pos + 1)) return true;
        grid[r][c] = 0;
      }
    }
    return false;
  }

  fill(0);
  return grid;
}

/** Прибрати випадкові клітинки, лишивши givenCount підказок. */
function buildPuzzle(solution: number[][], size: Size, givenCount: number): Cell[][] {
  const puzzle: Cell[][] = solution.map((row) => [...row]);
  const positions: [number, number][] = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) positions.push([r, c]);
  const shuffled = shuffle(positions);
  const toRemove = size * size - givenCount;
  for (let i = 0; i < toRemove; i++) {
    const [r, c] = shuffled[i];
    puzzle[r][c] = null;
  }
  return puzzle;
}

function configFor(difficulty: Difficulty): { size: Size; given: number } {
  if (difficulty === 1) return { size: 4, given: 10 };
  if (difficulty === 2) return { size: 4, given: 7 };
  return { size: 6, given: 18 };
}

function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const { size, given } = configFor(difficulty);
  const solution = generateSolvedGrid(size);
  const puzzle = buildPuzzle(solution, size, given);
  const round: Round<Payload, Answer> = {
    id: `board-${difficulty}`,
    payload: { size, puzzle, solution },
    answer: BOARD_DONE,
  };
  return { difficulty, rounds: [round] };
}

function Component({ round, disabled, onAnswer, onMistake }: GameComponentProps<Payload, Answer>) {
  const { size, puzzle, solution } = round.payload;
  const { br, bc } = boxDims(size);
  const [grid, setGrid] = useState<Cell[][]>(() => puzzle.map((row) => [...row]));
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [wrongCell, setWrongCell] = useState<{ r: number; c: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const doneRef = useRef(false);

  const isGiven = (r: number, c: number) => puzzle[r][c] !== null;

  // Усі клітинки заповнено (заповнюємо лише правильними цифрами) — поле розв'язано.
  useEffect(() => {
    if (doneRef.current) return;
    const filled = grid.every((row) => row.every((v) => v !== null));
    if (!filled) return;
    doneRef.current = true;
    onAnswer(BOARD_DONE);
  }, [grid, onAnswer]);

  function selectCell(r: number, c: number) {
    if (disabled || busy || isGiven(r, c)) return;
    setSelected({ r, c });
  }

  function pickDigit(n: number) {
    if (disabled || busy || !selected) return;
    const { r, c } = selected;
    if (isGiven(r, c)) return;
    if (n === solution[r][c]) {
      setGrid((prev) => {
        const next = prev.map((row) => [...row]);
        next[r][c] = n;
        return next;
      });
      setSelected(null);
      return;
    }
    onMistake();
    setBusy(true);
    setWrongCell({ r, c });
    window.setTimeout(() => {
      setWrongCell(null);
      setBusy(false);
    }, 700);
  }

  const cellPx = size === 4 ? 62 : 46;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${size}, ${cellPx}px)`,
          gridTemplateRows: `repeat(${size}, ${cellPx}px)`,
          border: '2px solid var(--c-ink)',
          borderRadius: 'var(--c-r-sm)',
          overflow: 'hidden',
          boxShadow: 'var(--c-shadow)',
        }}
      >
        {grid.map((row, r) =>
          row.map((v, c) => {
            const given = isGiven(r, c);
            const isSel = selected?.r === r && selected?.c === c;
            const isWrong = wrongCell?.r === r && wrongCell?.c === c;
            const thickRight = (c + 1) % bc === 0 && c !== size - 1;
            const thickBottom = (r + 1) % br === 0 && r !== size - 1;
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                aria-label={v ? `Клітинка ${r + 1},${c + 1}: ${v}` : `Клітинка ${r + 1},${c + 1}: порожня`}
                onClick={() => selectCell(r, c)}
                disabled={disabled || given}
                style={{
                  width: cellPx,
                  height: cellPx,
                  border: '1px solid var(--c-line)',
                  borderRight: thickRight ? '2px solid var(--c-ink)' : undefined,
                  borderBottom: thickBottom ? '2px solid var(--c-ink)' : undefined,
                  background: isWrong
                    ? '#FFE2E2'
                    : given
                      ? '#F3F4FA'
                      : isSel
                        ? 'var(--c-primary-soft)'
                        : 'var(--c-card)',
                  color: isWrong ? 'var(--c-err-ink)' : given ? 'var(--c-ink)' : 'var(--c-primary)',
                  fontFamily: 'var(--font-round)',
                  fontSize: size === 4 ? 26 : 20,
                  fontWeight: 800,
                  cursor: given || disabled ? 'default' : 'pointer',
                  padding: 0,
                }}
              >
                {v ?? ''}
              </button>
            );
          }),
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 320 }}>
        {Array.from({ length: size }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => pickDigit(n)}
            disabled={disabled || busy || !selected}
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--c-r-sm)',
              border: '1.5px solid var(--c-line)',
              background: 'var(--c-card)',
              color: 'var(--c-ink)',
              fontFamily: 'var(--font-round)',
              fontSize: 20,
              fontWeight: 800,
              cursor: !selected || disabled || busy ? 'default' : 'pointer',
              boxShadow: 'var(--c-shadow)',
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

const sudoku: GameDefinition<Payload, Answer> = {
  id: 'sudoku',
  title: 'Судоку',
  subject: 'logic',
  levels: ['L3'],
  icon: '🔢',
  description: 'Судоку для дітей.',
  accent: '#EDE9FE',
  generate,
  Component,
  // TODO(A2-логіка): skills після seed skill-graph логіки
};

export default sudoku;
