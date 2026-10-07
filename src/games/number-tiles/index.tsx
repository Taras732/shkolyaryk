import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameDefinition, GameComponentProps, ClassLevel, Difficulty, LevelData, ProfileLevel, Round } from '../types';
import { BOARD_DONE } from '../types';
import {
  type Cell,
  type BoardGrid,
  generateBoard,
  isValidPair,
  canConnect,
  hasValidMove,
  reshuffleStuck,
  fuzzCheck,
} from './generate';

interface Payload {
  rows: number;
  cols: number;
  grid: BoardGrid;
  hints: boolean;
  sumOnly: boolean;
}

type Answer = typeof BOARD_DONE;

function generate(difficulty: Difficulty, level: ProfileLevel, classLevel?: ClassLevel): LevelData<Payload, Answer> {
  const { config, grid } = generateBoard(difficulty, level, classLevel);
  const round: Round<Payload, Answer> = {
    id: `board-${difficulty}`,
    payload: { rows: config.rows, cols: config.cols, grid, hints: config.hints, sumOnly: config.sumOnly },
    answer: BOARD_DONE,
  };
  return { difficulty, rounds: [round] };
}

const MISTAKE_DELAY_MS = 550;
const STUCK_RESHUFFLE_DELAY_MS = 900;

/** Одна міні-плитка прикладу на екрані правил (num=null — порожня клітинка). */
function ExampleTile({ num, blocked }: { num: number | null; blocked?: boolean }) {
  return (
    <span
      style={{
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        border: num === null ? '2px dashed var(--c-line)' : `2px solid ${blocked ? '#E74C3C' : 'var(--c-line)'}`,
        background: blocked ? '#FFE2E2' : num === null ? 'transparent' : 'var(--c-card)',
        fontFamily: 'var(--font-round)',
        fontWeight: 800,
        fontSize: 14,
        color: blocked ? 'var(--c-err-ink)' : 'var(--c-ink)',
      }}
    >
      {num ?? ''}
    </span>
  );
}

/** Рядок-приклад на екрані правил: 2-3 міні-плитки + ✅/❌ + короткий підпис. */
function ExampleRow({ cells, ok, label }: { cells: (number | null)[]; ok: boolean; label: string }) {
  const blockerIndex = !ok && cells.length === 3 ? 1 : -1;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
        {cells.map((v, i) => (
          <ExampleTile key={i} num={v} blocked={i === blockerIndex && v !== null} />
        ))}
        <span style={{ marginLeft: 4, fontSize: 16, animation: ok ? 'pulse 0.9s ease-in-out infinite alternate' : 'none' }}>
          {ok ? '✅' : '❌'}
        </span>
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: ok ? 'var(--c-mut)' : 'var(--c-err-ink)', marginTop: 3 }}>{label}</div>
    </div>
  );
}

/** Екран правил ПЕРЕД грою (гра-урок, не тест-загадка): проговорює мету і
 *  найнеочевиднішу частину механіки — "з'єднати" працює лише вздовж рядка/
 *  стовпця й ламається, якщо між плитками стоїть ще одна (не порожньо). */
function RulesIntro({ onStart }: { onStart: () => void }) {
  return (
    <div className="g-card" style={{ maxWidth: 340, margin: '0 auto' }}>
      <div style={{ fontSize: 38, marginBottom: 4 }}>🔟</div>
      <h2 className="g-title" style={{ fontSize: 19, margin: '0 0 8px' }}>Прибери всі плитки!</h2>
      <p style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--c-ink)', lineHeight: 1.5, margin: '0 0 6px' }}>
        Торкнись двох плиток. Якщо числа <b>однакові</b> або разом дають <b>10</b> — вони зникнуть.
      </p>
      <p style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--c-mut)', lineHeight: 1.4, margin: '0 0 14px' }}>
        Це працює лише в одному рядку чи стовпчику — і тільки якщо між ними нічого немає.
      </p>

      <ExampleRow cells={[4, 6]} ok label="4 і 6 разом дають 10 — можна!" />
      <ExampleRow cells={[5, null, 5]} ok label="Між ними порожньо — теж можна!" />
      <ExampleRow cells={[4, 7, 6]} ok={false} label="А тут заважає плитка між ними — ні" />

      <p style={{ fontSize: 12.5, color: 'var(--c-mut)', fontWeight: 800, margin: '4px 0 16px' }}>
        Мета: прибрати геть усі плитки з поля 🎯
      </p>

      <button type="button" className="g-btn primary" onClick={onStart}>
        Почати гру 🎮
      </button>
    </div>
  );
}

function Component({ round, disabled, onAnswer, onMistake }: GameComponentProps<Payload, Answer>) {
  const { rows, cols, hints, sumOnly } = round.payload;
  const [grid, setGrid] = useState<BoardGrid>(() => round.payload.grid.map((row) => [...row]));
  const [selected, setSelected] = useState<Cell | null>(null);
  const [wrongPair, setWrongPair] = useState<[Cell, Cell] | null>(null);
  const [busy, setBusy] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [stuckBanner, setStuckBanner] = useState(false);
  const doneRef = useRef(false);
  const reshufflingRef = useRef(false);

  const total = useMemo(
    () => round.payload.grid.reduce((n, row) => n + row.filter((v) => v !== null).length, 0),
    [round.payload.grid],
  );
  const remaining = useMemo(() => grid.reduce((n, row) => n + row.filter((v) => v !== null).length, 0), [grid]);

  // Поле чисте — гру пройдено.
  useEffect(() => {
    if (doneRef.current || remaining > 0) return;
    doneRef.current = true;
    onAnswer(BOARD_DONE);
  }, [remaining, onAnswer]);

  // "Глухий кут": плитки лишились, але жодну пару зараз не з'єднати (гравець
  // забрав пари не в тому порядку/складі, що задумав генератор — canConnect
  // звужує геометрію суворіше, ніж дитина здогадується). Живий фаззер-тест
  // підтвердив: це реально трапляється (у частини партій лишається 2-6
  // плиток без жодного ходу) — без цієї страховки гра просто зависає
  // назавжди. Самостійно перемішуємо значення серед тих самих клітинок, поки
  // не знайдеться розклад, що знову розбирається.
  useEffect(() => {
    if (doneRef.current || remaining === 0 || busy) return;
    if (hasValidMove(grid)) return;
    if (reshufflingRef.current) return;
    reshufflingRef.current = true;
    setStuckBanner(true);
    const timer = window.setTimeout(() => {
      setGrid((prev) => reshuffleStuck(prev, sumOnly));
      setStuckBanner(false);
      reshufflingRef.current = false;
    }, STUCK_RESHUFFLE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [grid, remaining, busy, sumOnly]);

  // Підказка (лише Easy): плитки, що склали б валідну пару з обраною зараз.
  const hintCells = useMemo(() => {
    const set = new Set<string>();
    if (!hints || !selected) return set;
    const v1 = grid[selected[0]][selected[1]];
    if (v1 === null) return set;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r === selected[0] && c === selected[1]) continue;
        const v2 = grid[r][c];
        if (v2 === null) continue;
        if (isValidPair(v1, v2) && canConnect(grid, selected, [r, c])) set.add(`${r},${c}`);
      }
    }
    return set;
  }, [grid, selected, hints, rows, cols]);

  function handleClick(r: number, c: number) {
    if (disabled || busy || stuckBanner || grid[r][c] === null) return;

    if (!selected) {
      setSelected([r, c]);
      return;
    }
    const [sr, sc] = selected;
    if (sr === r && sc === c) {
      setSelected(null);
      return;
    }

    const v1 = grid[sr][sc];
    const v2 = grid[r][c];
    if (v1 !== null && v2 !== null && isValidPair(v1, v2) && canConnect(grid, selected, [r, c])) {
      setGrid((prev) => {
        const next = prev.map((row) => [...row]);
        next[sr][sc] = null;
        next[r][c] = null;
        return next;
      });
      setSelected(null);
      return;
    }

    onMistake();
    setWrongPair([selected, [r, c]]);
    setBusy(true);
    window.setTimeout(() => {
      setWrongPair(null);
      setSelected(null);
      setBusy(false);
    }, MISTAKE_DELAY_MS);
  }

  const cellPx = cols <= 4 ? 66 : cols === 5 ? 56 : 46;
  const fontPx = cols <= 4 ? 24 : cols === 5 ? 21 : 18;

  if (showIntro) {
    return <RulesIntro onStart={() => setShowIntro(false)} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ fontFamily: 'var(--font-round)', fontWeight: 800, color: 'var(--c-mut)' }}>
        Залишилось плиток: {remaining} / {total}
      </div>

      {stuckBanner && (
        <div
          style={{
            background: 'var(--c-primary-soft)',
            color: 'var(--c-primary)',
            fontWeight: 800,
            padding: '8px 16px',
            borderRadius: 999,
            fontSize: 13,
            animation: 'fadeInUp .3s ease both',
          }}
        >
          🔀 Перемішую — тут не лишилось жодної пари!
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${cellPx}px)`,
          gridTemplateRows: `repeat(${rows}, ${cellPx}px)`,
          gap: 6,
          animation: wrongPair ? 'shake 0.45s' : stuckBanner ? 'pulse 0.6s ease-in-out infinite alternate' : 'none',
        }}
      >
        {grid.map((row, r) =>
          row.map((v, c) => {
            const isEmpty = v === null;
            const isSelected = selected?.[0] === r && selected?.[1] === c;
            const isHint = hintCells.has(`${r},${c}`);
            const isWrong = !!wrongPair && wrongPair.some(([wr, wc]) => wr === r && wc === c);
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                onClick={() => handleClick(r, c)}
                disabled={disabled || isEmpty || stuckBanner}
                aria-label={isEmpty ? 'порожня клітинка' : `плитка ${v}`}
                style={{
                  width: cellPx,
                  height: cellPx,
                  padding: 0,
                  border: `2px solid ${
                    isWrong ? '#E74C3C' : isSelected ? 'var(--c-primary)' : isHint ? '#F2B705' : 'var(--c-line)'
                  }`,
                  borderRadius: 'var(--c-r-sm)',
                  background: isWrong ? '#FFE2E2' : isSelected ? 'var(--c-primary-soft)' : 'var(--c-card)',
                  color: isWrong ? 'var(--c-err-ink)' : 'var(--c-ink)',
                  fontFamily: 'var(--font-round)',
                  fontWeight: 800,
                  fontSize: fontPx,
                  boxShadow: isEmpty ? 'none' : 'var(--c-shadow)',
                  cursor: disabled || isEmpty || stuckBanner ? 'default' : 'pointer',
                  transform: isEmpty ? 'scale(0)' : 'scale(1)',
                  opacity: isEmpty ? 0 : 1,
                  transition: 'transform .25s ease, opacity .25s ease, background .15s ease, border-color .15s ease',
                }}
              >
                {isEmpty ? '' : v}
              </button>
            );
          }),
        )}
      </div>

      {hints && (
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-mut)' }}>
          💡 Золота рамка — плитка, що складе пару з обраною
        </div>
      )}
    </div>
  );
}

// Перевірка, що генерація полів гарантовано розв'язна (виконується раз при завантаженні в dev).
if (import.meta.env.DEV) {
  fuzzCheck();
}

const numberTiles: GameDefinition<Payload, Answer> = {
  id: 'number-tiles',
  title: 'Числові плитки',
  subject: 'math',
  levels: ['L3'],
  icon: '🔟',
  description: 'Прибирай пари: однакові числа або сума 10.',
  accent: '#FFF4D6',
  // Числа завжди 1-9, ціль завжди сума 10 (лише розмір поля/наявність пар
  // "однакове число" зростає зі складністю) — тому skill той самий на всіх difficulty.
  skillIds: {
    1: ['math.count.l1.compose-10'],
    2: ['math.count.l1.compose-10'],
    3: ['math.count.l1.compose-10'],
  },
  generate,
  Component,
};

export default numberTiles;
