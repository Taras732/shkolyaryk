import { useEffect, useState } from 'react';
import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { BOARD_DONE } from '../types';
import { PUZZLE_IMAGES, tileStyle } from '../shared/puzzle-images';
import { LEVELS, isSolved, move, shuffleByMoves } from './core';

interface Payload {
  src: string;
  name: string;
  n: number;
  start: number[];
  numbers: boolean;
}
type Answer = typeof BOARD_DONE;

function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const img = PUZZLE_IMAGES[Math.floor(Math.random() * PUZZLE_IMAGES.length)];
  const { n, moves } = LEVELS[difficulty];
  const start = shuffleByMoves(n, moves);
  const round: Round<Payload, Answer> = {
    id: `sp-${n}-${start.join('.')}`, // унікальний: зі сталим id зміна рівня лишала стару дошку
    // номери-підказки в куточку — на перших рівнях, щоб було за що зачепитись
    payload: { ...img, n, start, numbers: difficulty < 3 },
    answer: BOARD_DONE,
  };
  return { difficulty, rounds: [round] };
}

function Component({ round, onAnswer }: GameComponentProps<Payload, Answer>) {
  const { src, name, n, start, numbers } = round.payload;
  const [board, setBoard] = useState(start);
  const [moves, setMoves] = useState(0);
  const done = isSolved(board);
  const empty = n * n - 1;

  useEffect(() => {
    if (!done) return;
    const t = window.setTimeout(() => onAnswer(BOARD_DONE), 1600);
    return () => window.clearTimeout(t);
  }, [done, onAnswer]);

  const tap = (pos: number) => {
    if (done) return;
    const next = move(board, pos, n);
    if (next !== board) {
      setBoard(next);
      setMoves(moves + 1);
    }
  };

  return (
    <>
      <div className="g-card" style={{ marginBottom: 12 }}>
        <div className="g-question">{done ? `Готово! ${name} 🎉` : 'Торкнись шматочка біля порожнього місця — він посунеться'}</div>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--c-mut)' }}>Ходів: {moves}</div>
      </div>
      <div style={{ width: '100%', maxWidth: 360, margin: '0 auto', aspectRatio: '1 / 1', display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, gap: done ? 0 : 4, transition: 'gap .4s' }}>
        {board.map((piece, pos) =>
          piece === empty && !done ? (
            <div key={pos} style={{ borderRadius: 10, background: 'var(--c-line)' }} />
          ) : (
            <button
              key={pos}
              type="button"
              aria-label={`Шматок ${piece + 1}`}
              onClick={() => tap(pos)}
              style={{ ...tileStyle(src, piece, n, n), border: 'none', borderRadius: done ? 0 : 10, padding: 0, cursor: 'pointer', position: 'relative', transition: 'border-radius .4s' }}
            >
              {numbers && !done && (
                <span style={{ position: 'absolute', top: 4, left: 6, fontSize: 13, fontWeight: 900, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,.7)' }}>{piece + 1}</span>
              )}
            </button>
          ),
        )}
      </div>
    </>
  );
}

const slidePuzzle: GameDefinition<Payload, Answer> = {
  id: 'slide-puzzle',
  title: "П'ятнашки",
  subject: 'puzzles',
  levels: ['L0', 'L3'],
  icon: '🔲',
  description: 'Пересувай шматочки на порожнє місце, щоб скласти картинку.',
  accent: '#EDE9FE',
  generate,
  Component,
};

export default slidePuzzle;
