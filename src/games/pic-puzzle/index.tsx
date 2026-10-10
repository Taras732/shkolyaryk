import { useEffect, useState } from 'react';
import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { BOARD_DONE } from '../types';
import { PUZZLE_IMAGES, tileStyle } from '../shared/puzzle-images';
import { SIZE, isSolved, scramble, swap } from './core';

interface Payload {
  src: string;
  name: string;
  cols: number;
  rows: number;
  start: number[];
  hint: boolean;
}
type Answer = typeof BOARD_DONE;

/** Пазл без «програшу»: для малих важливо дійти до картинки, а не не помилитись. */
function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const { cols, rows } = SIZE[difficulty];
  const pool = cols >= 4 ? PUZZLE_IMAGES.filter((i) => i.fine) : PUZZLE_IMAGES;
  const { src, name } = pool[Math.floor(Math.random() * pool.length)];
  const img = { src, name };
  const start = scramble(cols * rows);
  const round: Round<Payload, Answer> = {
    // унікальний id: GameShell ключує раунд за id — з постійним 'pp' зміна рівня лишала старі шматки
    id: `pp-${cols}x${rows}-${start.join('.')}`,
    payload: { ...img, cols, rows, start, hint: difficulty === 1 },
    answer: BOARD_DONE,
  };
  return { difficulty, rounds: [round] };
}

function Component({ round, onAnswer }: GameComponentProps<Payload, Answer>) {
  const { src, name, cols, rows, start, hint } = round.payload;
  const [order, setOrder] = useState(start);
  const [sel, setSel] = useState<number | null>(null);
  const done = isSolved(order);

  useEffect(() => {
    if (!done) return;
    const t = window.setTimeout(() => onAnswer(BOARD_DONE), 800);
    return () => window.clearTimeout(t);
  }, [done, onAnswer]);

  const tap = (pos: number) => {
    if (done) return;
    if (sel === null) return setSel(pos);
    if (sel !== pos) setOrder(swap(order, sel, pos));
    setSel(null);
  };

  return (
    <>
      <div className="g-card" style={{ marginBottom: 12 }}>
        <div className="g-question">{done ? `Ура! ${name}!` : 'Торкнись двох шматочків — вони поміняються місцями'}</div>
      </div>
      <div style={{ position: 'relative', width: '100%', maxWidth: 360, margin: '0 auto', aspectRatio: `${cols} / ${rows}` }}>
        {hint && !done && <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${src})`, backgroundSize: '100% 100%', opacity: 0.18, borderRadius: 14 }} />}
        <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: done ? 0 : 4, transition: 'gap .4s' }}>
          {order.map((piece, pos) => (
            <button
              key={pos}
              type="button"
              aria-label={`Шматок ${pos + 1}`}
              onClick={() => tap(pos)}
              style={{
                ...tileStyle(src, piece, cols, rows),
                border: sel === pos ? '4px solid var(--c-primary)' : 'none',
                borderRadius: done ? 0 : 10,
                cursor: 'pointer',
                padding: 0,
                transform: sel === pos ? 'scale(.94)' : 'none',
                transition: 'transform .15s, border-radius .4s',
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}

const picPuzzle: GameDefinition<Payload, Answer> = {
  id: 'pic-puzzle',
  title: 'Склади картинку',
  subject: 'puzzles',
  levels: ['L0', 'L3'],
  icon: '🧩',
  description: 'Пазл: поміняй шматочки місцями й склади картинку.',
  accent: '#E0F2FE',
  generate,
  Component,
};

export default picPuzzle;
