import { useState } from 'react';
import type { GameDefinition, GameComponentProps, Difficulty } from '../types';
import { Task, boardLevel, useFinish, type Answer } from '../puzzles/shared';
import { TASKS, cross, isDone, startState, trouble, type RiverState, type RiverTask } from './core';

function Component({ round, onAnswer, onMistake }: GameComponentProps<RiverTask, Answer>) {
  const t = round.payload;
  const [s, setS] = useState<RiverState>(() => startState(t));
  const [boat, setBoat] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [trips, setTrips] = useState(0);
  const done = isDone(s);
  useFinish(done, onAnswer, 1800);
  const byId = Object.fromEntries(t.items.map((i) => [i.id, i]));

  const toggle = (id: string) => {
    if (done || s.at[id] !== s.farmer) return;
    setMsg(null);
    if (boat.includes(id)) setBoat(boat.filter((b) => b !== id));
    else if (boat.length < t.seats) setBoat([...boat, id]);
    else setMsg(`У човні лише ${t.seats === 1 ? 'одне місце' : `${t.seats} місця`} для пасажирів`);
  };

  const sail = () => {
    const next = cross(t, s, boat);
    if (!next) return;
    const bad = trouble(t, next);
    if (bad) {
      // показуємо, що сталося б, і лишаємо все як було — спробуй інакше
      onMistake();
      setMsg(`Ой! ${byId[bad[0]].emoji} без фермера скривдить ${byId[bad[1]].emoji}. Спробуй інакше.`);
      return;
    }
    setS(next);
    setBoat([]);
    setTrips(trips + 1);
    setMsg(null);
  };

  const bank = (right: boolean) => (
    <div style={{ flex: 1, minHeight: 150, background: '#BBF7D0', borderRadius: 16, padding: 10, display: 'flex', flexWrap: 'wrap', gap: 6, alignContent: 'flex-start', justifyContent: 'center' }}>
      {s.farmer === right && <span style={{ fontSize: 40 }}>🧑‍🌾</span>}
      {t.items
        .filter((i) => s.at[i.id] === right && !boat.includes(i.id))
        .map((i) => (
          <button
            key={i.id}
            type="button"
            aria-label={i.name}
            onClick={() => toggle(i.id)}
            style={{ fontSize: 40, background: 'none', border: 'none', cursor: s.farmer === right ? 'pointer' : 'default', padding: 2 }}
          >
            {i.emoji}
          </button>
        ))}
    </div>
  );

  return (
    <>
      <Task
        text="Перевези всіх на правий берег"
        sub={`У човні фермер і ${t.seats === 1 ? 'ще один пасажир' : `ще ${t.seats} пасажири`}. Без фермера не лишай: ${t.conflicts.map(([a, b]) => `${byId[a].emoji} з ${byId[b].emoji}`).join(', ')}. Переправ: ${trips}`}
        done={done}
        doneText={`Усі на тому березі! Переправ: ${trips} 🎉`}
      />
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
        {bank(false)}
        <div style={{ width: 92, background: '#93C5FD', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: s.farmer ? 'flex-end' : 'flex-start', padding: 6 }}>
          <div style={{ fontSize: 30 }}>⛵</div>
          {boat.map((id) => (
            <button key={id} type="button" aria-label={`висадити: ${byId[id].name}`} onClick={() => toggle(id)} style={{ fontSize: 30, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              {byId[id].emoji}
            </button>
          ))}
        </div>
        {bank(true)}
      </div>
      {msg && <div style={{ textAlign: 'center', marginTop: 10, fontWeight: 800, color: '#B45309' }}>{msg}</div>}
      <button className="g-btn primary" style={{ marginTop: 12 }} onClick={sail} disabled={done}>
        {s.farmer ? '⬅️ Пливти назад' : 'Пливти ➡️'} {boat.length ? `з ${boat.map((b) => byId[b].emoji).join(' ')}` : '(сам)'}
      </button>
      <button className="g-btn ghost" style={{ marginTop: 8, padding: 10, fontSize: 14 }} onClick={() => { setS(startState(t)); setBoat([]); setTrips(0); setMsg(null); }}>
        ↺ Почати спочатку
      </button>
    </>
  );
}

const pzRiver: GameDefinition<RiverTask, Answer> = {
  id: 'pz-river',
  title: 'Переправа',
  subject: 'puzzles',
  levels: ['L3'],
  icon: '⛵',
  description: 'Перевези вовка, козу й капусту через річку — так, щоб ніхто нікого не з’їв.',
  accent: '#CFFAFE',
  generate: (d: Difficulty) => boardLevel(d, TASKS[d]),
  Component,
};

export default pzRiver;
