import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { GameComponentProps } from '../types';
import { useFinish, type Answer } from '../puzzles/shared';
import { sayUk } from '../shared/uk-audio';
import { TaskBubble } from '../shared/preschool';
import { COLORS, canPour, isSolved, pour, type Tubes } from './core';

export interface KidSortP {
  tubes: Tubes;
  cap: number;
  kid: true;
}

const BALL = 46;

/**
 * Дошкілля (10.10.2026): кульки в прозорих пробірках. Тап — верхні кульки одного кольору підстрибують,
 * тап по іншій пробірці — вони перелітають туди (layoutId: кожна кулька має свій id і летить, а не зникає).
 * Не можна налити — пробірка хитається. Без лічильника ходів і тексту: мета видно з самих кульок.
 */
export function KidsSort({ round, onAnswer }: GameComponentProps<KidSortP, Answer>) {
  const { cap } = round.payload;
  // кожна кулька зі сталим id, щоб анімація знала, яка куди летить
  const startIds = () => {
    let k = 0;
    return round.payload.tubes.map((t) => t.map((c) => ({ c, id: `b${k++}` })));
  };
  const [balls, setBalls] = useState(startIds);
  const [sel, setSel] = useState<number | null>(null);
  const [shake, setShake] = useState<number | null>(null);
  const colors: Tubes = balls.map((t) => t.map((b) => b.c));
  const done = isSolved(colors, cap);
  useFinish(done, onAnswer, 1000);

  useEffect(() => {
    const t = window.setTimeout(() => sayUk('p_sort_colors', 'Склади кульки за кольором!'), 300);
    return () => window.clearTimeout(t);
  }, []);

  /** Скільки верхніх кульок одного кольору піднято. */
  const topRun = (t: { c: number }[]) => {
    let n = 0;
    while (n < t.length && t[t.length - 1 - n].c === t[t.length - 1].c) n++;
    return n;
  };

  const tap = (i: number) => {
    if (done) return;
    if (sel === null) {
      if (balls[i].length) setSel(i);
      return;
    }
    if (sel === i) return setSel(null);
    if (!canPour(colors, sel, i, cap)) {
      setShake(i);
      window.setTimeout(() => setShake(null), 400);
      setSel(null);
      return;
    }
    const after = pour(colors, sel, i, cap);
    const moved = after[i].length - colors[i].length;
    setBalls((b) => {
      const out = b.map((t) => [...t]);
      for (let k = 0; k < moved; k++) out[i].push(out[sel].pop()!);
      return out;
    });
    setSel(null);
  };

  const tubeH = cap * (BALL + 6) + 26;
  return (
    <TaskBubble text="Склади кульки за кольором!" onSay={() => sayUk('p_sort_colors', 'Склади кульки за кольором!')} peek={false} sceneBg="#EEF4FF">
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', justifyContent: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 1, paddingTop: BALL + 20 }}>
        {balls.map((tube, i) => {
          const lifted = sel === i ? topRun(tube) : 0;
          const full = tube.length === cap && tube.every((b) => b.c === tube[0].c);
          return (
            <motion.button key={i} type="button" aria-label={`Пробірка ${i + 1}`} onClick={() => tap(i)} whileTap={{ scale: 0.97 }}
              style={{ position: 'relative', width: BALL + 18, height: tubeH, padding: 0, cursor: 'pointer', borderStyle: 'solid', borderWidth: '0 4px 4px', borderColor: full ? '#6FCF8A' : '#B8C7E6',
                borderRadius: '0 0 34px 34px', background: full ? 'rgba(111,207,138,.18)' : 'rgba(255,255,255,.75)',
                display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', gap: 6, paddingBottom: 8,
                animation: shake === i ? 'pk-shake .4s ease' : undefined }}>
              {tube.map((b, k) => {
                const up = k >= tube.length - lifted;
                return (
                  <motion.span key={b.id} layoutId={b.id} layout transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                    animate={{ y: up ? -((cap - tube.length) * (BALL + 6) + BALL + 10) : 0 }}
                    style={{ width: BALL, height: BALL, borderRadius: '50%', flex: 'none',
                      background: `radial-gradient(circle at 34% 30%, #fff8 0 14%, transparent 15%), ${COLORS[b.c]}`,
                      boxShadow: 'inset 0 -5px 0 rgba(0,0,0,.14)' }} />
                );
              })}
            </motion.button>
          );
        })}
      </div>
    </TaskBubble>
  );
}
