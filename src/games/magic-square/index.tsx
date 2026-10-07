import { useEffect, useRef, useState } from 'react';
import type { GameDefinition, GameComponentProps, Difficulty, LevelData, Round } from '../types';
import { BOARD_DONE } from '../types';
import { randInt, shuffle } from '../shared/ui';

type Cell = number | null;

interface Payload {
  puzzle: Cell[][];
  solution: number[][];
}

type Answer = typeof BOARD_DONE;

const MAGIC_SUM = 15;

/** 3×3 Lo Shu magic square (базовий варіант, суми = 15). */
const LO_SHU: number[][] = [
  [2, 9, 4],
  [7, 5, 3],
  [6, 1, 8],
];

function rotateCW(grid: number[][]): number[][] {
  const n = grid.length;
  const result: number[][] = Array.from({ length: n }, () => Array<number>(n).fill(0));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) result[c][n - 1 - r] = grid[r][c];
  }
  return result;
}

function flipHorizontal(grid: number[][]): number[][] {
  return grid.map((row) => row.slice().reverse());
}

/** Випадковий симетричний варіант Lo Shu (ротації + віддзеркалення). */
function generateSolution(): number[][] {
  let grid = LO_SHU.map((row) => [...row]);
  const rotations = randInt(0, 3);
  for (let i = 0; i < rotations; i++) grid = rotateCW(grid);
  if (Math.random() < 0.5) grid = flipHorizontal(grid);
  return grid;
}

function buildPuzzle(solution: number[][], emptyCount: number): Cell[][] {
  const puzzle: Cell[][] = solution.map((row) => [...row]);
  const positions: [number, number][] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) positions.push([r, c]);
  const shuffled = shuffle(positions);
  for (let i = 0; i < emptyCount; i++) {
    const [r, c] = shuffled[i];
    puzzle[r][c] = null;
  }
  return puzzle;
}

/** Складність → кількість порожніх клітинок. */
function emptyCountFor(difficulty: Difficulty): number {
  return difficulty === 1 ? 2 : difficulty === 2 ? 4 : 6;
}

function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const solution = generateSolution();
  const puzzle = buildPuzzle(solution, emptyCountFor(difficulty));
  const round: Round<Payload, Answer> = {
    id: `board-${difficulty}`,
    payload: { puzzle, solution },
    answer: BOARD_DONE,
  };
  return { difficulty, rounds: [round] };
}

function Component({ round, disabled, onAnswer, onMistake }: GameComponentProps<Payload, Answer>) {
  const { puzzle, solution } = round.payload;
  const [grid, setGrid] = useState<Cell[][]>(() => puzzle.map((row) => [...row]));
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [wrongCell, setWrongCell] = useState<{ r: number; c: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const doneRef = useRef(false);

  const isGiven = (r: number, c: number) => puzzle[r][c] !== null;

  // Усі клітинки заповнено правильно (заповнюємо лише правильними цифрами) — поле пройдено.
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

  const cellPx = 78;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
      <div
        style={{
          textAlign: 'center',
          fontFamily: 'var(--font-round)',
          fontWeight: 800,
          color: 'var(--c-mut)',
        }}
      >
        Сума в кожному рядку, стовпці й діагоналі = {MAGIC_SUM}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(3, ${cellPx}px)`,
          gridTemplateRows: `repeat(3, ${cellPx}px)`,
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
                  background: isWrong
                    ? '#FFE2E2'
                    : given
                      ? '#F3F4FA'
                      : isSel
                        ? 'var(--c-primary-soft)'
                        : 'var(--c-card)',
                  color: isWrong ? 'var(--c-err-ink)' : given ? 'var(--c-ink)' : 'var(--c-primary)',
                  fontFamily: 'var(--font-round)',
                  fontSize: 28,
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
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
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

const magicSquare: GameDefinition<Payload, Answer> = {
  id: 'magic-square',
  title: 'Магічний квадрат',
  subject: 'logic',
  levels: ['L3'],
  icon: '🔲',
  description: 'Магічний квадрат.',
  accent: '#EDE9FE',
  generate,
  Component,
  // TODO(A2-логіка): skills після seed skill-graph логіки
};

export default magicSquare;
