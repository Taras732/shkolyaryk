import { useState } from 'react';
import type { GameDefinition, GameComponentProps, Difficulty } from '../types';
import { Task, boardLevel, useFinish, type Answer } from '../puzzles/shared';
import { canAdd, generate, type PathTask } from './core';

function Component({ round, onAnswer, onMistake }: GameComponentProps<PathTask, Answer>) {
  const { n, grid, target } = round.payload;
  const [path, setPath] = useState<number[]>([]);
  const [over, setOver] = useState(false);
  const sum = path.reduce((s, i) => s + grid[i], 0);
  const done = sum === target;
  useFinish(done, onAnswer);

  const tap = (i: number) => {
    if (done) return;
    // повторний дотик до останньої клітинки — крок назад
    if (path[path.length - 1] === i) return setPath(path.slice(0, -1));
    if (!canAdd(path, i, n)) return;
    const next = [...path, i];
    const s = next.reduce((a, k) => a + grid[k], 0);
    if (s > target) {
      onMistake();
      setOver(true);
      window.setTimeout(() => {
        setPath([]);
        setOver(false);
      }, 900);
    }
    setPath(next);
  };

  return (
    <>
      <Task
        text={`Знайди шлях із сумою ${target}`}
        sub="Торкайся сусідніх клітинок (не по діагоналі). Торкнись останньої ще раз — крок назад."
        done={done}
        doneText={`${path.map((i) => grid[i]).join(' + ')} = ${target} 🎉`}
      />
      <div style={{ textAlign: 'center', fontSize: 28, fontWeight: 900, marginBottom: 10, color: over ? 'var(--c-err-ink)' : done ? 'var(--c-ok-ink)' : 'var(--c-ink)', fontFamily: 'var(--font-round)' }}>
        {path.length ? `${path.map((i) => grid[i]).join(' + ')} = ${sum}` : '…'}
        {over && ' — забагато!'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 8, maxWidth: 76 * n, margin: '0 auto' }}>
        {grid.map((v, i) => {
          const idx = path.indexOf(i);
          const active = idx !== -1;
          const next = !done && canAdd(path, i, n) && path.length > 0;
          return (
            <button
              key={i}
              type="button"
              onClick={() => tap(i)}
              style={{
                aspectRatio: '1',
                borderRadius: 14,
                fontSize: 28,
                fontWeight: 900,
                fontFamily: 'var(--font-round)',
                cursor: 'pointer',
                border: next ? '2px dashed var(--c-primary)' : '2px solid var(--c-line)',
                background: active ? (over ? '#FECACA' : done ? '#BBF7D0' : 'var(--c-primary)') : 'var(--c-card)',
                color: active && !over && !done ? '#fff' : 'var(--c-ink)',
              }}
            >
              {v}
            </button>
          );
        })}
      </div>
      <button className="g-btn ghost" style={{ marginTop: 16, padding: 10, fontSize: 14 }} onClick={() => setPath([])}>
        ↺ Почати шлях спочатку
      </button>
    </>
  );
}

const pzPath: GameDefinition<PathTask, Answer> = {
  id: 'pz-path',
  title: 'Шлях до числа',
  subject: 'math',
  levels: ['L3'],
  icon: '🔢',
  description: 'Пройди сусідніми клітинками так, щоб сума вийшла рівно потрібна.',
  accent: '#EDE9FE',
  generate: (d: Difficulty) => boardLevel(d, generate(d)),
  Component,
};

export default pzPath;
