import { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { GameDefinition, GameComponentProps, Difficulty, LevelData, Round } from '../types';
import { BOARD_DONE } from '../types';
import { sayUk } from '../shared/uk-audio';
import { TaskBubble, useBoardProgress } from '../shared/preschool';
import { ROUNDS, buildTasks, type OddTask } from './core';

/** «Що тут зайве?»: чотири великі картки в сцені; знайшов — зайчик пояснює, чому зайва (див. core.ts). */
interface Payload {
  difficulty: Difficulty;
}
type Answer = typeof BOARD_DONE;

/** Пауза на «сяйво» правильної картинки; пояснення «Решта — …» прибране (10.10: накладалось на наступну картинку). */
const NEXT_MS = 1200;

function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const round: Round<Payload, Answer> = { id: 'odd-board', payload: { difficulty }, answer: BOARD_DONE };
  return { difficulty, rounds: Array.from({ length: ROUNDS }, () => round) };
}

function Component({ round, onAnswer, onMistake }: GameComponentProps<Payload, Answer>) {
  const [tasks] = useState<OddTask[]>(() => buildTasks(round.payload.difficulty));
  const [idx, setIdx] = useState(0);
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);
  const [shake, setShake] = useState<number | null>(null);
  const task = tasks[idx];
  const report = useBoardProgress();
  useEffect(() => report(Math.round((idx / tasks.length) * 5)), [idx, tasks.length, report]);

  // завдання звучить один раз — на старті гри; далі раунди просто змінюються (🔊 — повторити)
  useEffect(() => {
    const t = window.setTimeout(() => sayUk('p_odd', 'Що тут зайве?'), 300);
    return () => window.clearTimeout(t);
  }, []);

  const done = useCallback(() => onAnswer(BOARD_DONE), [onAnswer]);

  useEffect(() => {
    if (!solved) return;
    const t = window.setTimeout(() => {
      setSolved(false);
      setMisses(0);
      if (idx + 1 >= tasks.length) done();
      else setIdx(idx + 1);
    }, NEXT_MS);
    return () => window.clearTimeout(t);
  }, [solved]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!task) return null;

  const tap = (i: number) => {
    if (solved) return;
    if (i === task.odd) {
      setSolved(true);
      return;
    }
    setShake(i);
    setMisses((m) => m + 1);
    onMistake();
    window.setTimeout(() => setShake(null), 450);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TaskBubble text="Що тут зайве?" onSay={() => sayUk('p_odd', 'Що тут зайве?')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 120px)', gap: 16, position: 'relative', zIndex: 1 }}>
          {task.items.map((e, i) => {
            const isOdd = i === task.odd;
            const win = solved && isOdd;
            // після двох помилок зайва картка «підморгує» — підказка
            const hint = !solved && misses >= 2 && isOdd;
            return (
              <motion.button key={`${idx}-${i}`} type="button" onClick={() => tap(i)} whileTap={{ scale: 0.93 }}
                animate={hint ? { rotate: [0, -6, 6, 0] } : { rotate: 0 }}
                transition={hint ? { duration: 0.6, repeat: Infinity, repeatDelay: 0.8 } : undefined}
                style={{ width: 120, height: 120, borderRadius: 30, border: 0, cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: 70,
                  background: win ? '#DCF7E3' : '#fff', boxShadow: `0 7px 0 ${win ? '#9FDDB0' : '#EED9BF'}${win ? ', 0 0 0 4px #22C55E' : ''}`,
                  opacity: solved && !isOdd ? 0.45 : 1, animation: shake === i ? 'pk-shake .4s ease' : win ? 'pk-pop .5s ease-out forwards' : undefined }}>
                {e}
              </motion.button>
            );
          })}
        </div>
      </TaskBubble>
      <div style={{ height: 24 }} />
    </div>
  );
}

const oddOneOut: GameDefinition<Payload, Answer> = {
  id: 'odd-one-out',
  title: 'Що тут зайве?',
  subject: 'attention',
  levels: ['L0'],
  icon: '🤔',
  description: 'Одна картинка не така, як інші — знайди її і дізнайся чому.',
  accent: '#FFE3EC',
  generate,
  Component,
};

export default oddOneOut;
