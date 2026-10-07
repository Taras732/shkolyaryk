import { useEffect, useState } from 'react';
import type { GameDefinition, GameComponentProps, Difficulty } from '../types';
import { Task, boardLevel, pickOne, useFinish, type Answer } from '../puzzles/shared';
import { E, N, S, SIZE, W, generate, step, type Dir } from './core';

const HEROES = [
  ['🐭', '🧀'],
  ['🐰', '🥕'],
  ['🐝', '🌻'],
  ['🐶', '🦴'],
  ['🐿️', '🌰'],
];

interface P {
  n: number;
  walls: number[];
  hero: string;
  goal: string;
}

const ORDER: Dir[] = ['up', 'right', 'down', 'left'];

function Component({ round, onAnswer }: GameComponentProps<P, Answer>) {
  const { n, walls, hero, goal } = round.payload;
  const [pos, setPos] = useState(0);
  const done = pos === n * n - 1;
  useFinish(done, onAnswer);
  const go = (d: Dir) => {
    if (!done) setPos((p) => step(walls, n, p, d));
  };

  // стрілки клавіатури — для планшета з клавіатурою і комп'ютера
  useEffect(() => {
    const keys: Record<string, Dir> = { ArrowUp: 'up', ArrowRight: 'right', ArrowDown: 'down', ArrowLeft: 'left' };
    const h = (e: KeyboardEvent) => {
      if (keys[e.key]) {
        e.preventDefault();
        go(keys[e.key]);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  const line = '3px solid #475569';
  return (
    <>
      <Task text={`Проведи ${hero} до ${goal}`} sub="Стрілками внизу або торкнись сусідньої клітинки" done={done} doneText={`Смакота! ${hero}${goal} 🎉`} />
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, maxWidth: 360, margin: '0 auto', background: 'var(--c-card)', border: line }}>
        {walls.map((w, i) => {
          // клітинка поруч із героєм: у який бік від героя вона лежить
          const fromHero = [pos - n, pos + 1, pos + n, pos - 1].indexOf(i);
          const near = fromHero !== -1 && !(fromHero === 1 && i % n === 0) && !(fromHero === 3 && pos % n === 0);
          return (
            <div
              key={i}
              onClick={() => near && go(ORDER[fromHero])}
              style={{
                aspectRatio: '1',
                borderTop: w & N ? line : 'none',
                borderRight: w & E ? line : 'none',
                borderBottom: w & S ? line : 'none',
                borderLeft: w & W ? line : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: n > 6 ? 22 : 30,
                cursor: near ? 'pointer' : 'default',
              }}
            >
              {i === pos ? hero : i === n * n - 1 ? goal : ''}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 64px)', gap: 6, justifyContent: 'center', marginTop: 14 }}>
        <span />
        <button className="g-btn soft" style={{ padding: 12 }} aria-label="Вгору" onClick={() => go('up')}>⬆️</button>
        <span />
        <button className="g-btn soft" style={{ padding: 12 }} aria-label="Ліворуч" onClick={() => go('left')}>⬅️</button>
        <button className="g-btn soft" style={{ padding: 12 }} aria-label="Вниз" onClick={() => go('down')}>⬇️</button>
        <button className="g-btn soft" style={{ padding: 12 }} aria-label="Праворуч" onClick={() => go('right')}>➡️</button>
      </div>
    </>
  );
}

const pzMaze: GameDefinition<P, Answer> = {
  id: 'pz-maze',
  title: 'Лабіринт',
  subject: 'puzzles',
  levels: ['L0', 'L3'],
  icon: '🌀',
  description: 'Проведи звірятко через лабіринт до смаколика.',
  accent: '#DCFCE7',
  generate: (d: Difficulty) => {
    const n = SIZE[d];
    const [hero, goal] = pickOne(HEROES);
    return boardLevel(d, { n, walls: generate(n), hero, goal });
  },
  Component,
};

export default pzMaze;
