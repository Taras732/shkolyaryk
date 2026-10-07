import { useState } from 'react';
import type { GameDefinition, GameComponentProps, Difficulty } from '../types';
import { Task, boardLevel, useFinish, type Answer } from '../puzzles/shared';
import { CAP, COLORS, canPour, generate, isSolved, pour, type Tubes } from './core';

function Component({ round, onAnswer }: GameComponentProps<{ tubes: Tubes }, Answer>) {
  const start = round.payload.tubes;
  const [t, setT] = useState(start);
  const [sel, setSel] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const done = isSolved(t);
  useFinish(done, onAnswer);

  const tap = (i: number) => {
    if (done) return;
    if (sel === null) return t[i].length ? setSel(i) : undefined;
    if (sel !== i && canPour(t, sel, i)) {
      setT(pour(t, sel, i));
      setMoves(moves + 1);
    }
    setSel(null);
  };

  return (
    <>
      <Task text="Посортуй кольори: у кожній пробірці — один колір" sub={`Торкнись пробірки, потім тієї, куди перелити. Лити можна на такий самий колір або в порожню. Ходів: ${moves}`} done={done} />
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
        {t.map((tube, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Пробірка ${i + 1}`}
            onClick={() => tap(i)}
            style={{
              width: 50,
              height: CAP * 34 + 14,
              display: 'flex',
              flexDirection: 'column-reverse',
              gap: 2,
              padding: '4px 4px 8px',
              borderLeft: `3px solid ${sel === i ? 'var(--c-primary)' : '#94A3B8'}`,
              borderRight: `3px solid ${sel === i ? 'var(--c-primary)' : '#94A3B8'}`,
              borderBottom: `3px solid ${sel === i ? 'var(--c-primary)' : '#94A3B8'}`,
              borderTop: 'none',
              borderRadius: '0 0 24px 24px',
              background: 'var(--c-card)',
              cursor: 'pointer',
              transform: sel === i ? 'translateY(-10px)' : 'none',
              transition: 'transform .15s',
            }}
          >
            {tube.map((c, k) => (
              <div key={k} style={{ height: 32, borderRadius: k === 0 ? '0 0 18px 18px' : 4, background: COLORS[c] }} />
            ))}
          </button>
        ))}
      </div>
      <button className="g-btn ghost" style={{ marginTop: 16, padding: 10, fontSize: 14 }} onClick={() => { setT(start); setMoves(0); setSel(null); }}>
        ↺ Почати спочатку
      </button>
    </>
  );
}

const pzSort: GameDefinition<{ tubes: Tubes }, Answer> = {
  id: 'pz-sort',
  title: 'Сортуй кольори',
  subject: 'puzzles',
  levels: ['L0', 'L3'],
  icon: '🧪',
  description: 'Переливай кольори між пробірками, щоб у кожній був один колір.',
  accent: '#FCE7F3',
  generate: (d: Difficulty) => boardLevel(d, { tubes: generate(d) }),
  Component,
};

export default pzSort;
