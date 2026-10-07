import { useEffect, useState } from 'react';
import type { GameDefinition, GameComponentProps, Difficulty } from '../types';
import { Task, boardLevel, useFinish, type Answer } from '../puzzles/shared';
import { balance, makeTasks, type ScaleTask, type Side } from './core';

const Weight = ({ w, onTap }: { w: number; onTap?: () => void }) => (
  <button type="button" onClick={onTap} style={{ minWidth: 44, height: 40, borderRadius: '10px 10px 6px 6px', background: '#475569', color: '#fff', fontWeight: 900, fontSize: 15, border: 'none', cursor: onTap ? 'pointer' : 'default', padding: '0 6px' }}>
    {w} кг
  </button>
);

function Scales({ t, sides, setSide }: { t: ScaleTask; sides: Side[]; setSide: (i: number, s: Side) => void }) {
  const diff = balance(t, sides);
  const tilt = Math.max(-12, Math.min(12, diff * 3)); // градуси: переважує права — нахил праворуч
  const pan = (side: 1 | -1) => (
    <div style={{ width: 130, minHeight: 70, display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', alignItems: 'flex-end', borderBottom: '5px solid #64748B', borderRadius: '0 0 50% 50%', paddingBottom: 6 }}>
      {side === -1 && <span style={{ fontSize: 44 }}>{t.item.emoji}</span>}
      {t.weights.map((w, i) => (sides[i] === side ? <Weight key={i} w={w} onTap={() => setSide(i, 0)} /> : null))}
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 30, transform: `rotate(${tilt}deg)`, transition: 'transform .4s' }}>
        {pan(-1)}
        {pan(1)}
      </div>
      <div style={{ width: 6, height: 60, background: '#64748B' }} />
      <div style={{ width: 90, height: 10, borderRadius: 5, background: '#64748B' }} />
      <div style={{ marginTop: 8, fontWeight: 900, color: diff === 0 ? 'var(--c-ok-ink)' : 'var(--c-mut)' }}>
        {diff === 0 ? '⚖️ Рівно!' : diff > 0 ? 'Гирі важчі' : `${t.item.name[0].toUpperCase()}${t.item.name.slice(1)} важчий`}
      </div>
    </div>
  );
}

function Component({ round, onAnswer }: GameComponentProps<{ tasks: ScaleTask[] }, Answer>) {
  const { tasks } = round.payload;
  const [ti, setTi] = useState(0);
  const t = tasks[ti];
  const [sides, setSides] = useState<Side[]>(() => t.weights.map(() => 0));
  const balanced = balance(t, sides) === 0;
  const last = ti === tasks.length - 1;
  useFinish(balanced && last, onAnswer);

  useEffect(() => {
    if (!balanced || last) return;
    const tm = window.setTimeout(() => {
      setTi(ti + 1);
      setSides(tasks[ti + 1].weights.map(() => 0));
    }, 1300);
    return () => window.clearTimeout(tm);
  }, [balanced, last, ti, tasks]);

  const setSide = (i: number, s: Side) => !balanced && setSides(sides.map((v, k) => (k === i ? s : v)));

  return (
    <>
      <Task
        text={`Зваж ${t.item.acc}: ${t.weight} кг ${t.item.emoji}`}
        sub={`Задача ${ti + 1} з ${tasks.length}. ${t.twoSided ? 'Гирі можна класти на будь-яку шальку — навіть до предмета!' : 'Клади гирі на праву шальку, поки терези не врівноважаться.'}`}
      />
      <Scales t={t} sides={sides} setSide={setSide} />
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--c-mut)' }}>Гирі:</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {t.weights.map((w, i) =>
            sides[i] === 0 ? (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                <Weight w={w} onTap={() => setSide(i, 1)} />
                {t.twoSided && (
                  <button className="g-btn ghost" style={{ width: 'auto', padding: '4px 6px', fontSize: 11 }} onClick={() => setSide(i, -1)}>
                    ← до предмета
                  </button>
                )}
              </div>
            ) : null,
          )}
        </div>
      </div>
    </>
  );
}

const pzScales: GameDefinition<{ tasks: ScaleTask[] }, Answer> = {
  id: 'pz-scales',
  title: 'Терези',
  subject: 'math',
  levels: ['L3'],
  icon: '⚖️',
  description: 'Зваж предмет гирями рівно — без зайвого кілограма.',
  accent: '#F1F5F9',
  generate: (d: Difficulty) => boardLevel(d, { tasks: makeTasks(d) }),
  Component,
};

export default pzScales;
