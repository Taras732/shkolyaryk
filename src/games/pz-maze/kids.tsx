import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { GameComponentProps } from '../types';
import { useFinish, type Answer } from '../puzzles/shared';
import { sayUk } from '../shared/uk-audio';
import { TaskBubble } from '../shared/preschool';
import { E, N, S, W, step, type Dir } from './core';

/** Дошкільний лабіринт: намальовані герой і смаколик (public/count). */
export const KID_PAIRS = [
  ['bunny', 'carrot'],
  ['hedgehog', 'mushroom'],
  ['mouse', 'cookie'],
  ['bear', 'strawberry'],
  ['pig', 'apple'],
] as const;

export interface KidP {
  n: number;
  walls: number[];
  hero: string;
  goal: string;
}

const HEDGE = '#7BBF6A';
const HEDGE_DARK = '#5E9F50';

/**
 * Дошкілля (10.10.2026): на телефоні героя ведуть пальцем (кнопок немає), на комп'ютері — кнопки й стрілки.
 * Палець «тягне» героя: з кожною клітинкою під пальцем герой робить крок у її бік, якщо не заважає живопліт.
 */
export function KidsMaze({ round, onAnswer }: GameComponentProps<KidP, Answer>) {
  const { n, walls, hero, goal } = round.payload;
  const [pos, setPos] = useState(0);
  const [trail, setTrail] = useState<number[]>([0]);
  const done = pos === n * n - 1;
  useFinish(done, onAnswer, 900);
  const board = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const posRef = useRef(0);
  posRef.current = pos;
  const finePointer = typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches;

  useEffect(() => {
    const t = window.setTimeout(() => sayUk('p_maze', 'Проведи до смаколика!'), 300);
    return () => window.clearTimeout(t);
  }, []);

  const moveTo = (next: number) => {
    if (next === posRef.current) return;
    posRef.current = next;
    setPos(next);
    setTrail((t) => (t.includes(next) ? t : [...t, next]));
  };
  const go = (d: Dir) => !done && moveTo(step(walls, n, posRef.current, d));

  /** Крок(и) до клітинки під пальцем: спершу по довшій осі, потім по іншій — поки є куди. */
  const pull = (clientX: number, clientY: number) => {
    const r = board.current?.getBoundingClientRect();
    if (!r || done) return;
    const col = Math.min(n - 1, Math.max(0, Math.floor(((clientX - r.left) / r.width) * n)));
    const row = Math.min(n - 1, Math.max(0, Math.floor(((clientY - r.top) / r.height) * n)));
    for (let k = 0; k < 2 * n; k++) {
      const p = posRef.current;
      const dr = row - Math.floor(p / n);
      const dc = col - (p % n);
      if (!dr && !dc) return;
      const tries: Dir[] = Math.abs(dc) >= Math.abs(dr)
        ? [dc > 0 ? 'right' : 'left', ...(dr ? [dr > 0 ? 'down' : 'up'] as Dir[] : [])]
        : [dr > 0 ? 'down' : 'up', ...(dc ? [dc > 0 ? 'right' : 'left'] as Dir[] : [])];
      const moved = tries.map((d) => step(walls, n, p, d)).find((q) => q !== p);
      if (moved === undefined) return;
      moveTo(moved);
    }
  };

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

  const cell = `${100 / n}%`;
  const line = (on: number) => (on ? `6px solid ${HEDGE}` : '6px solid transparent');
  return (
    <TaskBubble text="Проведи до смаколика!" onSay={() => sayUk('p_maze', 'Проведи до смаколика!')} peek={false} sceneBg="#EAF6DF">
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
        <div
          ref={board}
          onPointerDown={(e) => { dragging.current = true; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); pull(e.clientX, e.clientY); }}
          onPointerMove={(e) => dragging.current && pull(e.clientX, e.clientY)}
          onPointerUp={() => { dragging.current = false; }}
          onPointerCancel={() => { dragging.current = false; }}
          style={{ position: 'relative', width: 'min(100%, 340px)', aspectRatio: '1', background: '#FFF6E6', borderRadius: 18, outline: `6px solid ${HEDGE_DARK}`,
            touchAction: 'none', userSelect: 'none', cursor: 'pointer', display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)` }}>
          {walls.map((w, i) => (
            <div key={i} style={{ borderTop: line(w & N), borderRight: line(w & E), borderBottom: line(w & S), borderLeft: line(w & W), margin: -3, borderRadius: 4,
              display: 'grid', placeItems: 'center' }}>
              {trail.includes(i) && i !== pos && <span style={{ width: '22%', height: '22%', borderRadius: '50%', background: '#F2C38B' }} />}
            </div>
          ))}
          <div style={{ position: 'absolute', right: 0, bottom: 0, width: cell, height: cell, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
            <img src={`/count/${goal}.webp`} alt="" draggable={false}
              style={{ width: '70%', height: '70%', objectFit: 'contain', animation: done ? undefined : 'pk-float 1.6s ease-in-out infinite' }} />
          </div>
          <motion.div
            animate={{ x: `${(pos % n) * 100}%`, y: `${Math.floor(pos / n) * 100}%`, scale: done ? 1.25 : 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            style={{ position: 'absolute', left: 0, top: 0, width: cell, height: cell, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
            <img src={`/count/${hero}.webp`} alt="" draggable={false}
              style={{ width: '86%', height: '86%', objectFit: 'contain', filter: 'drop-shadow(0 3px 2px rgba(60,40,10,.25))' }} />
          </motion.div>
        </div>
        {finePointer && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 58px)', gap: 8, justifyContent: 'center' }}>
            <span />
            <Arrow label="Вгору" onClick={() => go('up')}>▲</Arrow>
            <span />
            <Arrow label="Ліворуч" onClick={() => go('left')}>◀</Arrow>
            <Arrow label="Вниз" onClick={() => go('down')}>▼</Arrow>
            <Arrow label="Праворуч" onClick={() => go('right')}>▶</Arrow>
          </div>
        )}
      </div>
    </TaskBubble>
  );
}

function Arrow({ label, onClick, children }: { label: string; onClick: () => void; children: string }) {
  return (
    <motion.button type="button" aria-label={label} onClick={onClick} whileTap={{ scale: 0.9 }}
      style={{ height: 52, borderRadius: 16, border: 0, background: '#fff', boxShadow: '0 4px 0 #F1E3CF', color: '#E0882E', fontSize: 22, cursor: 'pointer' }}>
      {children}
    </motion.button>
  );
}
