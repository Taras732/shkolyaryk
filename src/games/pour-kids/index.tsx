import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { GameDefinition, GameComponentProps, Difficulty } from '../types';
import { boardLevel, useFinish, type Answer } from '../puzzles/shared';
import { sayUk } from '../shared/uk-audio';
import { TaskBubble, useBoardProgress } from '../shared/preschool';
import { empty, fill, pickTasks, pour, solved, type PourTask } from './core';

/**
 * «Переливайка» (дошкілля): тицни, ЗВІДКИ лити (банка або кран), потім — КУДИ (банка або відро).
 * Рівень води видно рисками; ⭐ на боці банки — скільки треба. Логіка й рівні — core.ts.
 */
const L = 40; // висота одного «літра», px
const TAP = -1;
const SINK = -2;

function Jug({ cap, v, target, sel, win, tilt, onTap }: { cap: number; v: number; target: number; sel: boolean; win: boolean; tilt: number; onTap: () => void }) {
  return (
    <motion.button type="button" onClick={onTap} aria-label="банка"
      animate={{ y: sel ? -16 : 0, rotate: tilt }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', position: 'relative', transformOrigin: 'bottom center' }}>
      {/* шийка */}
      <div style={{ width: 58, height: 10, margin: '0 auto', borderRadius: '6px 6px 0 0', background: 'rgba(170,205,235,.55)', border: '3px solid #9CC4E4', borderBottom: 0 }} />
      <div style={{ position: 'relative', width: 92, height: cap * L + 8, borderRadius: '14px 14px 24px 24px', overflow: 'hidden',
        background: 'rgba(255,255,255,.7)', border: `4px solid ${win ? '#22C55E' : sel ? '#F08A24' : '#9CC4E4'}`,
        boxShadow: win ? '0 0 0 4px #BBF7D0, 0 6px 0 #9FDDB0' : '0 6px 0 rgba(120,150,190,.35)' }}>
        <motion.div initial={false} animate={{ height: v * L }} transition={{ duration: 0.6, ease: 'easeInOut' }}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'linear-gradient(180deg, #8FD3FA 0%, #45A6E8 100%)' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: 'rgba(255,255,255,.55)' }} />
        </motion.div>
        {/* риски-літри */}
        {Array.from({ length: cap - 1 }).map((_, i) => (
          <div key={i} style={{ position: 'absolute', left: 0, width: 22, bottom: (i + 1) * L, height: 3, borderRadius: 2, background: 'rgba(60,100,150,.45)' }} />
        ))}
        {/* блиск скла */}
        <div style={{ position: 'absolute', right: 10, top: 8, bottom: 14, width: 7, borderRadius: 4, background: 'rgba(255,255,255,.6)' }} />
      </div>
      {cap >= target && (
        <span style={{ position: 'absolute', right: -24, bottom: target * L - 10, fontSize: 22, filter: 'drop-shadow(0 1px 0 #fff)' }}>⭐</span>
      )}
    </motion.button>
  );
}

function RoundBtn({ icon, label, sel, onTap }: { icon: string; label: string; sel: boolean; onTap: () => void }) {
  return (
    <motion.button type="button" onClick={onTap} aria-label={label} whileTap={{ scale: 0.92 }} animate={{ y: sel ? -10 : 0 }}
      style={{ width: 64, height: 64, borderRadius: '50%', border: 0, background: '#fff', fontSize: 34, cursor: 'pointer',
        boxShadow: `0 5px 0 #EED9BF${sel ? ', 0 0 0 4px #F08A24' : ''}` }}>
      {icon}
    </motion.button>
  );
}

function Component({ round, onAnswer }: GameComponentProps<{ tasks: PourTask[] }, Answer>) {
  const { tasks } = round.payload;
  const [ti, setTi] = useState(0);
  const t = tasks[ti];
  const [v, setV] = useState<number[]>(() => t.start);
  const [from, setFrom] = useState<number | null>(null);
  const [tilt, setTilt] = useState<{ i: number; deg: number } | null>(null);
  const [won, setWon] = useState(false);
  const [allDone, setAllDone] = useState(false);
  useFinish(allDone, onAnswer);
  const report = useBoardProgress();
  useEffect(() => report(Math.round(((ti + (won ? 1 : 0)) / tasks.length) * 5)), [ti, won, tasks.length, report]);

  useEffect(() => {
    const id = window.setTimeout(() => sayUk('p_pour', 'Налий рівно до зірочки!'), 300);
    return () => window.clearTimeout(id);
  }, []);

  const apply = (nv: number[], src: number, dst: number) => {
    if (src >= 0) {
      setTilt({ i: src, deg: dst > src || dst === SINK ? 22 : -22 });
      window.setTimeout(() => setTilt(null), 650);
    }
    setV(nv);
    setFrom(null);
    if (solved(nv, t.target)) {
      setWon(true);
      window.setTimeout(() => {
        if (ti === tasks.length - 1) return setAllDone(true);
        setTi(ti + 1);
        setV(tasks[ti + 1].start);
        setWon(false);
      }, 1700);
    }
  };

  const tap = (i: number) => {
    if (won) return;
    if (from === null) {
      // звідки: банка з водою або кран
      if (i === SINK || (i >= 0 && v[i] === 0)) return;
      return setFrom(i);
    }
    if (from === i) return setFrom(null);
    if (i === TAP) return setFrom(TAP);
    if (from === TAP) return i >= 0 ? apply(fill(v, t.caps, i), TAP, i) : setFrom(null);
    if (i === SINK) return apply(empty(v, from), from, SINK);
    apply(pour(v, t.caps, from, i), from, i);
  };

  const restart = () => {
    setV(t.start);
    setFrom(null);
  };

  return (
    <TaskBubble text={won ? 'Ура! Рівно!' : 'Налий рівно до зірочки!'} onSay={() => sayUk('p_pour', 'Налий рівно до зірочки!')}
      sceneBg="linear-gradient(180deg, #EAF6FF 0%, #F4FAFF 76%, #E9D8C2 76%, #DCC6AA 100%)" peek={false}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        {t.tap && (
          <div style={{ position: 'absolute', top: '6%', left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            <RoundBtn icon="🚰" label="кран" sel={from === TAP} onTap={() => tap(TAP)} />
            <span style={{ fontSize: 14, fontWeight: 800, color: '#6B8BAE' }}>набрати</span>
          </div>
        )}
        {/* банки стоять на столі */}
        <div style={{ position: 'absolute', bottom: '24%', left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 34, paddingRight: 20 }}>
          {t.caps.map((cap, i) => (
            <Jug key={`${ti}-${i}`} cap={cap} v={v[i]} target={t.target} sel={from === i} win={won && v[i] === t.target}
              tilt={tilt?.i === i ? tilt.deg : 0} onTap={() => tap(i)} />
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: '6%', left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          {t.tap && (
            <>
              <RoundBtn icon="🪣" label="вилити" sel={false} onTap={() => tap(SINK)} />
              <span style={{ fontSize: 14, fontWeight: 800, color: '#8A6A45' }}>вилити</span>
            </>
          )}
          <button type="button" onClick={restart} aria-label="почати задачу спочатку"
            style={{ width: 44, height: 44, borderRadius: '50%', border: 0, background: 'rgba(255,255,255,.85)', fontSize: 20, color: '#9B7A55', cursor: 'pointer', boxShadow: '0 3px 0 #CDB395', marginLeft: 10 }}>
            ↻
          </button>
        </div>
      </div>
      {won && ['-60px,-50px', '60px,-40px', '0,-80px', '-70px,20px', '70px,24px'].map((d, k) => {
        const [dx, dy] = d.split(',');
        return <span key={k} style={{ position: 'absolute', left: '48%', top: '45%', fontSize: 24, zIndex: 3, ['--dx' as string]: dx, ['--dy' as string]: dy, animation: 'pk-spark .7s ease-out forwards' }}>⭐</span>;
      })}
    </TaskBubble>
  );
}

const pourKids: GameDefinition<{ tasks: PourTask[] }, Answer> = {
  id: 'pour-kids',
  title: 'Переливайка',
  subject: 'math',
  levels: ['L0'],
  icon: '🫙',
  description: 'Переливай воду з банки в банку, щоб стало рівно до зірочки.',
  accent: '#E0F2FE',
  generate: (d: Difficulty) => boardLevel(d, { tasks: pickTasks(d) }, 'board', 1),
  Component,
};

export default pourKids;
