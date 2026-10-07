import { useState } from 'react';
import type { GameDefinition, GameComponentProps, Difficulty } from '../types';
import { Task, boardLevel, useFinish, type Answer } from '../puzzles/shared';
import { DISKS, canMove, isSolved, minMoves, move, start } from './core';

const DISK_COLORS = ['#F87171', '#FB923C', '#FACC15', '#4ADE80', '#60A5FA', '#A78BFA'];

function Component({ round, onAnswer }: GameComponentProps<{ n: number }, Answer>) {
  const { n } = round.payload;
  const [p, setP] = useState(() => start(n));
  const [sel, setSel] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [warn, setWarn] = useState(false);
  const done = isSolved(p, n);
  useFinish(done, onAnswer);

  const tap = (i: number) => {
    if (done) return;
    if (sel === null) return p[i].length ? setSel(i) : undefined;
    if (canMove(p, sel, i)) {
      setP(move(p, sel, i));
      setMoves(moves + 1);
      setWarn(false);
    } else if (sel !== i) setWarn(true);
    setSel(null);
  };

  return (
    <>
      <Task
        text={`Переклади вежу на праву паличку`}
        sub={`Торкнись палички, звідки взяти верхнє кільце, потім — куди покласти. Велике на мале не можна. Ходів: ${moves} (найменше — ${minMoves(n)})`}
        done={done}
        doneText={`Вежа на місці! Ходів: ${moves} 🎉`}
      />
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
        {p.map((peg, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Паличка ${i + 1}`}
            onClick={() => tap(i)}
            style={{ flex: 1, maxWidth: 120, height: 40 + n * 26, position: 'relative', background: sel === i ? 'var(--c-primary-soft)' : 'transparent', border: 'none', borderRadius: 12, cursor: 'pointer' }}
          >
            <div style={{ position: 'absolute', left: '50%', bottom: 6, width: 8, height: 26 + n * 26, marginLeft: -4, background: '#94A3B8', borderRadius: 4 }} />
            <div style={{ position: 'absolute', left: 4, right: 4, bottom: 0, height: 6, background: '#64748B', borderRadius: 3 }} />
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 6, display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', gap: 2 }}>
              {peg.map((size, k) => (
                <div
                  key={k}
                  style={{
                    width: `${25 + (size / n) * 70}%`,
                    height: 22,
                    borderRadius: 11,
                    background: DISK_COLORS[(size - 1) % DISK_COLORS.length],
                    transform: sel === i && k === peg.length - 1 ? 'translateY(-10px)' : 'none',
                    transition: 'transform .15s',
                  }}
                />
              ))}
            </div>
          </button>
        ))}
      </div>
      {warn && <div style={{ textAlign: 'center', marginTop: 10, fontWeight: 800, color: '#B45309' }}>Велике кільце на мале класти не можна</div>}
      <button className="g-btn ghost" style={{ marginTop: 16, padding: 10, fontSize: 14 }} onClick={() => { setP(start(n)); setMoves(0); setSel(null); }}>
        ↺ Почати спочатку
      </button>
    </>
  );
}

const pzHanoi: GameDefinition<{ n: number }, Answer> = {
  id: 'pz-hanoi',
  title: 'Ханойська вежа',
  subject: 'puzzles',
  levels: ['L3'],
  icon: '🗼',
  description: 'Переклади всі кільця на іншу паличку. Велике на мале — не можна!',
  accent: '#FEF3C7',
  generate: (d: Difficulty) => boardLevel(d, { n: DISKS[d] }),
  Component,
};

export default pzHanoi;
