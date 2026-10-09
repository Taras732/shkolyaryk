import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { GameDefinition, GameComponentProps, Difficulty } from '../types';
import { boardLevel, useFinish, type Answer } from '../puzzles/shared';
import { sayUk } from '../shared/uk-audio';
import { TaskBubble, useBoardProgress } from '../shared/preschool';
import { isFair, makeTasks, type ShareTask } from './core';

/**
 * «Розклади порівну» у рамці дошкілля (10.10.2026): кошик угорі, тарілки — білі кола.
 * Тиснеш тарілку — на неї кладеться один предмет з кошика; «−» під тарілкою — повертає.
 * Кошик порожній — перевіряємо самі. На 3 рівні ділиться з остачею: тоді ✓ «Готово».
 */
const Items = ({ emoji, n, size }: { emoji: string; n: number; size: number }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', fontSize: size, lineHeight: 1.1 }}>
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
  const [state, setState] = useState<'play' | 'ok' | 'uneven'>('play');
  const [allDone, setAllDone] = useState(false);
  useFinish(allDone, onAnswer);
  const report = useBoardProgress();
  useEffect(() => report(Math.round(((ti + (state === 'ok' ? 1 : 0)) / tasks.length) * 5)), [ti, state, tasks.length, report]);
  const pile = t.n - plates.reduce((s, p) => s + p, 0);
  const withRest = t.n % t.k !== 0;

  useEffect(() => {
    const id = window.setTimeout(() => sayUk('p_share', 'Розклади порівну!'), 300);
    return () => window.clearTimeout(id);
  }, []);

  const check = (ps: number[], left: number) => {
    if (isFair(ps, left)) {
      setState('ok');
      window.setTimeout(() => {
        if (ti === tasks.length - 1) return setAllDone(true);
        setTi(ti + 1);
        setPlates(Array(tasks[ti + 1].k).fill(0));
        setState('play');
      }, 1500);
    } else {
      onMistake();
      setState('uneven');
    }
  };

  const put = (i: number, d: 1 | -1) => {
    if (state === 'ok' || (d === 1 && pile === 0) || (d === -1 && plates[i] === 0)) return;
    const ps = plates.map((v, k) => (k === i ? v + d : v));
    setPlates(ps);
    setState('play');
    // без остачі: кошик спорожнів — перевіряємо самі, кнопка не потрібна
    if (!withRest && pile - d === 0) check(ps, 0);
  };

  const big = Math.max(...plates) > 4 || t.n > 12;
  const text = state === 'ok' ? `Так! Кожному по ${plates[0]}` : state === 'uneven' ? 'Не однаково! Переклади' : `Розклади порівну`;

  return (
    <TaskBubble text={text} onSay={() => sayUk('p_share', 'Розклади порівну!')}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%', position: 'relative', zIndex: 1 }}>
        {/* кошик */}
        <div style={{ background: '#FFF3D6', border: '3px solid #E8C98A', borderRadius: '18px 18px 40px 40px', padding: '10px 14px', minWidth: 170, minHeight: 64, display: 'grid', placeItems: 'center' }}>
          {pile > 0 ? <Items emoji={t.emoji} n={pile} size={big ? 22 : 28} /> : <span style={{ fontSize: 15, fontWeight: 800, color: '#B08A4A' }}>порожньо</span>}
        </div>
        {/* тарілки */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${t.k === 3 ? 3 : 2}, auto)`, gap: 12, justifyContent: 'center' }}>
          {plates.map((p, i) => {
            const odd = state === 'uneven' && p !== Math.min(...plates);
            const d = t.k === 3 ? 100 : 118;
            return (
              <div key={`${ti}-${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <motion.button type="button" whileTap={{ scale: 0.94 }} onClick={() => put(i, 1)} aria-label="покласти на тарілку"
                  style={{ width: d, height: d, borderRadius: '50%', border: 0, cursor: 'pointer', padding: 12,
                    background: state === 'ok' ? '#DCF7E3' : '#fff', display: 'grid', placeItems: 'center',
                    boxShadow: `inset 0 0 0 7px ${state === 'ok' ? '#BFEBCB' : '#F2EADF'}, 0 6px 0 ${odd ? '#F59E0B' : '#EED9BF'}`,
                    animation: odd ? 'pk-shake .4s ease' : state === 'ok' ? 'pk-pop .45s ease-out' : undefined }}>
                  <Items emoji={t.emoji} n={p} size={p > 4 ? 18 : 24} />
                </motion.button>
                <button type="button" onClick={() => put(i, -1)} disabled={p === 0} aria-label="забрати з тарілки"
                  style={{ width: 40, height: 32, borderRadius: 16, border: 0, background: '#fff', boxShadow: '0 3px 0 #EED9BF', fontSize: 20, fontWeight: 900, color: '#B08A4A', cursor: 'pointer', opacity: p === 0 ? 0.3 : 1 }}>
                  −
                </button>
              </div>
            );
          })}
        </div>
        {withRest && state !== 'ok' && (
          <motion.button type="button" whileTap={{ scale: 0.92 }} onClick={() => check(plates, pile)} aria-label="готово"
            style={{ width: 64, height: 64, borderRadius: '50%', border: 0, background: '#22C55E', color: '#fff', fontSize: 32, fontWeight: 900, boxShadow: '0 5px 0 #15803d', cursor: 'pointer' }}>
            ✓
          </motion.button>
        )}
      </div>
    </TaskBubble>
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
