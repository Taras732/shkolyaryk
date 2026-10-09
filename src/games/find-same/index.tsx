import { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { GameDefinition, GameComponentProps } from '../types';
import { BOARD_DONE } from '../types';
import { sayUk } from '../shared/uk-audio';
import { PictureCard, TaskBubble, useBoardProgress } from '../shared/preschool';
import { buildTasks, generate, type Payload, type Task } from './generate';

/** «Знайди всіх таких самих»: знайди в сітці всі копії зразка, зайчик рахує вголос. */
const DIGITS = ['нуль', 'один', 'два', 'три', 'чотири', 'пʼять'];

function Component({ round, onAnswer, onMistake }: GameComponentProps<Payload, typeof BOARD_DONE>) {
  const [tasks] = useState<Task[]>(() => buildTasks(round.payload.difficulty));
  const [idx, setIdx] = useState(0);
  const [found, setFound] = useState<number[]>([]);
  const [shake, setShake] = useState<number | null>(null);
  const task = tasks[idx];
  const report = useBoardProgress();
  useEffect(() => report(Math.round((idx / tasks.length) * 5)), [idx, tasks.length, report]);

  const done = useCallback(() => onAnswer(BOARD_DONE), [onAnswer]);

  // усі знайдено — пауза й далі
  useEffect(() => {
    if (!task || found.length < task.count) return;
    const t = window.setTimeout(() => {
      setFound([]);
      if (idx + 1 >= tasks.length) done();
      else setIdx(idx + 1);
    }, 1400);
    return () => window.clearTimeout(t);
  }, [found.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!task) return null;
  const all = found.length >= task.count;
  const cols = task.cells.length > 9 ? 4 : 3;
  const d = cols === 4 ? 70 : 84;

  const tap = (i: number) => {
    if (all || found.includes(i)) return;
    if (task.cells[i] !== task.target) {
      setShake(i);
      onMistake();
      window.setTimeout(() => setShake(null), 450);
      return;
    }
    const n = found.length + 1;
    setFound([...found, i]);
    sayUk(`d_${n}`, DIGITS[n] ?? String(n)); // зайчик рахує: «один… два…»
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <TaskBubble text={all ? `Молодець! Усі ${task.count}!` : 'Знайди всіх таких самих!'}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <PictureCard><span style={{ fontSize: 76, lineHeight: 1 }}>{task.target}</span></PictureCard>
          {/* лічильник знайдених: кружечки, що зеленіють */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Array.from({ length: task.count }, (_, k) => (
              <span key={k} style={{ width: 22, height: 22, borderRadius: '50%', background: k < found.length ? '#22C55E' : '#fff', boxShadow: '0 3px 0 #EED9BF', transition: 'background .2s' }} />
            ))}
          </div>
        </div>
      </TaskBubble>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${d}px)`, justifyContent: 'center', gap: 10, padding: '4px 0 10px' }}>
        {task.cells.map((c, i) => {
          const ok = found.includes(i);
          return (
            <motion.button key={`${idx}-${i}`} type="button" onClick={() => tap(i)} whileTap={{ scale: 0.92 }}
              style={{ width: d, height: d, borderRadius: '50%', border: 0, cursor: 'pointer', display: 'grid', placeItems: 'center',
                background: ok ? '#DCF7E3' : '#fff', boxShadow: `0 6px 0 ${ok ? '#9FDDB0' : '#EED9BF'}`, fontSize: cols === 4 ? 36 : 44,
                opacity: all && !ok ? 0.35 : 1, animation: shake === i ? 'pk-shake .4s ease' : ok ? 'pk-pop .4s ease-out forwards' : undefined }}>
              {c}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

const findSame: GameDefinition<Payload, typeof BOARD_DONE> = {
  id: 'find-same',
  title: 'Знайди всіх таких самих',
  subject: 'attention',
  levels: ['L0', 'L3'],
  icon: '🔍',
  description: 'Знайди всі картинки, такі як зразок, — зайчик порахує.',
  accent: '#FCE7F3',
  generate,
  Component,
};

export default findSame;
