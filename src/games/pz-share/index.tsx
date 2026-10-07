import { useState } from 'react';
import type { GameDefinition, GameComponentProps, Difficulty } from '../types';
import { Task, boardLevel, useFinish, type Answer } from '../puzzles/shared';
import { isFair, makeTasks, type ShareTask } from './core';

const Items = ({ emoji, n }: { emoji: string; n: number }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', fontSize: 22 }}>
    {Array.from({ length: n }).map((_, i) => (
      <span key={i}>{emoji}</span>
    ))}
  </div>
);

function Component({ round, onAnswer, onMistake }: GameComponentProps<{ tasks: ShareTask[] }, Answer>) {
  const { tasks } = round.payload;
  const [ti, setTi] = useState(0);
  const t = tasks[ti];
  const [plates, setPlates] = useState<number[]>(() => Array(t.k).fill(0));
  const [msg, setMsg] = useState<string | null>(null);
  const [allDone, setAllDone] = useState(false);
  useFinish(allDone, onAnswer);
  const pile = t.n - plates.reduce((s, p) => s + p, 0);

  const check = () => {
    if (isFair(plates, pile)) {
      if (ti === tasks.length - 1) return setAllDone(true);
      setMsg(`Так! Кожному по ${plates[0]}${pile ? `, і ${pile} лишилось` : ''} 🎉`);
      window.setTimeout(() => {
        setTi(ti + 1);
        setPlates(Array(tasks[ti + 1].k).fill(0));
        setMsg(null);
      }, 1300);
    } else {
      onMistake();
      setMsg(plates.some((p) => p !== plates[0]) ? 'На тарілках не однаково — переклади' : 'У коробці ще вистачає, щоб дати кожному');
    }
  };

  return (
    <>
      <Task
        text={`Розклади ${t.n} ${t.emoji} на ${t.k} тарілки порівну`}
        sub={`Задача ${ti + 1} з ${tasks.length}. Кнопкою + кладеш на тарілку, кнопкою − забираєш назад.`}
        done={allDone}
      />
      <div className="g-card" style={{ marginBottom: 12, minHeight: 60 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--c-mut)', marginBottom: 4 }}>📦 У коробці: {pile}</div>
        <Items emoji={t.emoji} n={pile} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(t.k, 2)}, 1fr)`, gap: 10 }}>
        {plates.map((p, i) => (
          <div key={i} style={{ background: 'var(--c-card)', border: '2px solid var(--c-line)', borderRadius: '50%/40%', padding: '14px 8px', minHeight: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Items emoji={t.emoji} n={p} />
            <div style={{ marginTop: 'auto', display: 'flex', gap: 6 }}>
              <button className="g-btn ghost" style={{ width: 'auto', padding: '4px 12px' }} disabled={p === 0} onClick={() => setPlates(plates.map((v, k) => (k === i ? v - 1 : v)))}>
                −
              </button>
              <button className="g-btn soft" style={{ width: 'auto', padding: '4px 12px' }} disabled={pile === 0} onClick={() => setPlates(plates.map((v, k) => (k === i ? v + 1 : v)))}>
                +
              </button>
            </div>
          </div>
        ))}
      </div>
      {msg && <div style={{ textAlign: 'center', marginTop: 10, fontWeight: 800, color: msg.startsWith('Так') ? 'var(--c-ok-ink)' : 'var(--c-warn-ink)' }}>{msg}</div>}
      <button className="g-btn primary" style={{ marginTop: 12 }} onClick={check} disabled={allDone}>
        Готово, порівну!
      </button>
    </>
  );
}

const pzShare: GameDefinition<{ tasks: ShareTask[] }, Answer> = {
  id: 'pz-share',
  title: 'Розклади порівну',
  subject: 'math',
  levels: ['L0', 'L3'],
  icon: '🍽️',
  description: 'Поділи частування на тарілки так, щоб усім було однаково.',
  accent: '#FFEDD5',
  generate: (d: Difficulty) => boardLevel(d, { tasks: makeTasks(d) }, 'board', 3),
  Component,
};

export default pzShare;
