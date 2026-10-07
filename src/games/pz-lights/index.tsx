import { useState } from 'react';
import type { GameDefinition, GameComponentProps, Difficulty } from '../types';
import { Task, boardLevel, useFinish, type Answer } from '../puzzles/shared';
import { allOff, generate, press } from './core';

interface P {
  n: number;
  board: boolean[];
  presses: number;
}

function Component({ round, onAnswer }: GameComponentProps<P, Answer>) {
  const { n, board: start, presses } = round.payload;
  const [b, setB] = useState(start);
  const [moves, setMoves] = useState(0);
  const done = allOff(b);
  useFinish(done, onAnswer);
  const tap = (i: number) => {
    if (done) return;
    setB(press(b, i, n));
    setMoves(moves + 1);
  };
  return (
    <>
      <Task
        text="Вимкни всі лампи"
        sub={`Натискання перемикає лампу й сусідів хрестиком. Можна за ${presses}. Натискань: ${moves}`}
        done={done}
        doneText={`Темно! Усі вимкнено за ${moves} 🎉`}
      />
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 8, maxWidth: 80 * n, margin: '0 auto' }}>
        {b.map((on, i) => (
          <button
            key={i}
            type="button"
            aria-label={on ? 'Лампа світить' : 'Лампа вимкнена'}
            onClick={() => tap(i)}
            style={{
              aspectRatio: '1',
              borderRadius: 16,
              border: 'none',
              fontSize: 34,
              cursor: 'pointer',
              background: on ? '#FDE68A' : '#334155',
              boxShadow: on ? '0 0 18px #FACC15' : 'none',
              transition: 'background .2s, box-shadow .2s',
            }}
          >
            {on ? '💡' : ''}
          </button>
        ))}
      </div>
      <button className="g-btn ghost" style={{ marginTop: 16, padding: 10, fontSize: 14 }} onClick={() => { setB(start); setMoves(0); }}>
        ↺ Почати спочатку
      </button>
    </>
  );
}

const pzLights: GameDefinition<P, Answer> = {
  id: 'pz-lights',
  title: 'Вимкни всі лампи',
  subject: 'logic',
  levels: ['L3'],
  icon: '💡',
  description: 'Кожне натискання перемикає лампу і сусідні. Вимкни всі!',
  accent: '#FEF9C3',
  generate: (d: Difficulty) => boardLevel(d, generate(d)),
  Component,
};

export default pzLights;
