import { useState } from 'react';
import type { GameDefinition, GameComponentProps, Difficulty } from '../types';
import { Task, boardLevel, pickOne, useFinish, type Answer } from '../puzzles/shared';
import { TASKS, empty, fill, minMoves, pour, solved, type JugTask } from './core';

function Jug({ cap, amount, max, selected, onTap }: { cap: number; amount: number; max: number; selected: boolean; onTap: () => void }) {
  const h = 60 + (cap / max) * 160;
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={`Банка ${cap} л, у ній ${amount} л`}
      style={{ width: 78, height: h, position: 'relative', borderLeft: `3px solid ${selected ? 'var(--c-primary)' : '#94A3B8'}`, borderRight: `3px solid ${selected ? 'var(--c-primary)' : '#94A3B8'}`, borderBottom: `3px solid ${selected ? 'var(--c-primary)' : '#94A3B8'}`, borderTop: 'none', borderRadius: '0 0 16px 16px', background: 'var(--c-card)', padding: 0, cursor: 'pointer', overflow: 'hidden' }}
    >
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${(amount / cap) * 100}%`, background: 'linear-gradient(#60A5FA, #2563EB)', transition: 'height .35s' }} />
      {Array.from({ length: cap - 1 }).map((_, k) => (
        <div key={k} style={{ position: 'absolute', left: 0, width: 12, bottom: `${((k + 1) / cap) * 100}%`, borderTop: '2px solid #94A3B8' }} />
      ))}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: amount / cap > 0.5 ? '#fff' : 'var(--c-ink)' }}>{amount}</div>
    </button>
  );
}

function Component({ round, onAnswer }: GameComponentProps<JugTask, Answer>) {
  const t = round.payload;
  const [s, setS] = useState(t.start);
  const [sel, setSel] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const done = solved(t, s);
  useFinish(done, onAnswer);
  const max = Math.max(...t.caps);
  const act = (next: number[]) => {
    if (done) return;
    setS(next);
    setMoves(moves + 1);
    setSel(null);
  };

  return (
    <>
      <Task
        text={`Відміряй рівно ${t.target} л`}
        sub={`${t.tap ? 'Торкнись банки, потім іншої — переллєш з першої в другу.' : 'Крана немає — тільки переливати з банки в банку.'} Ходів: ${moves} (можна за ${minMoves(t)})`}
        done={done}
        doneText={`Є ${t.target} л! 🎉 Ходів: ${moves}`}
      />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 18, minHeight: 240 }}>
        {t.caps.map((cap, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Jug cap={cap} amount={s[i]} max={max} selected={sel === i} onTap={() => (sel === null ? setSel(i) : sel === i ? setSel(null) : act(pour(t, s, sel, i)))} />
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--c-mut)' }}>{cap} л</div>
            {t.tap && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 90 }}>
                <button className="g-btn soft" style={{ padding: '7px 4px', fontSize: 13 }} onClick={() => act(fill(t, s, i))}>
                  💧 Налити
                </button>
                <button className="g-btn ghost" style={{ padding: '7px 4px', fontSize: 13 }} onClick={() => act(empty(s, i))}>
                  Вилити
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {sel !== null && !done && <div style={{ textAlign: 'center', marginTop: 10, fontWeight: 800, color: 'var(--c-primary)' }}>Куди перелити з банки {t.caps[sel]} л?</div>}
      <button className="g-btn ghost" style={{ marginTop: 16, padding: 10, fontSize: 14 }} onClick={() => { setS(t.start); setMoves(0); setSel(null); }}>
        ↺ Почати спочатку
      </button>
    </>
  );
}

const pzJugs: GameDefinition<JugTask, Answer> = {
  id: 'pz-jugs',
  title: 'Переливайка',
  subject: 'puzzles',
  levels: ['L3'],
  icon: '🫙',
  description: 'Відміряй рівно стільки літрів, скільки треба, переливаючи між банками.',
  accent: '#DBEAFE',
  generate: (d: Difficulty) => boardLevel(d, pickOne(TASKS[d])),
  Component,
};

export default pzJugs;
