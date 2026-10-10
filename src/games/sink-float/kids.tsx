import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { Difficulty, GameComponentProps, LevelData } from '../types';
import { shuffle } from '../shared/ui';
import { sayUk } from '../shared/uk-audio';
import { SceneTask } from '../shared/count-ui';

/**
 * Дошкілля (10.10.2026): предмет висить над акваріумом; дитина торкається, де він опиниться —
 * на поверхні (плаває) чи на дні (тоне). Після відповіді предмет падає й показує, як насправді.
 * Лише предмети з однозначною відповіддю (без морквин і жолудів, що буває по-різному).
 */
export const KID_ITEMS = [
  { id: 'sf_duck', name: 'качечка', floats: true },
  { id: 'sf_ball', name: 'мʼячик', floats: true },
  { id: 'sf_boat', name: 'човник', floats: true },
  { id: 'sf_leaf', name: 'листочок', floats: true },
  { id: 'apple', name: 'яблуко', floats: true },
  { id: 'sf_stone', name: 'камінчик', floats: false },
  { id: 'sf_key', name: 'ключик', floats: false },
  { id: 'sf_coin', name: 'монетка', floats: false },
  { id: 'sf_spoon', name: 'ложка', floats: false },
] as const;

export interface KidSinkP { kid: true; item: string }

export function generateKids(d: Difficulty): LevelData<KidSinkP, string> {
  // половина на половину, без повторів
  const f = shuffle(KID_ITEMS.filter((x) => x.floats));
  const s = shuffle(KID_ITEMS.filter((x) => !x.floats));
  const pick = shuffle([...f.slice(0, 3), ...s.slice(0, 2)]);
  return { difficulty: d, rounds: pick.map((x, i) => ({ id: `r${i}`, payload: { kid: true, item: x.id }, answer: x.floats ? 'float' : 'sink' })) };
}

export function KidsSink({ round, disabled, answerState, onAnswer }: GameComponentProps<KidSinkP, string>) {
  const item = KID_ITEMS.find((x) => x.id === round.payload.item)!;
  const [dropped, setDropped] = useState(false);
  useEffect(() => { if (answerState === 'idle') setDropped(false); }, [answerState]);
  const say = (again?: boolean) => (again || round.id === 'r0') && sayUk('p_sinkfloat', 'Плаває чи тоне? Торкнись, де воно буде!');
  const pick = (v: 'float' | 'sink') => { if (disabled) return; setDropped(true); onAnswer(v); };
  const SIZE = 84;
  // де предмет: над водою → після відповіді на поверхні або на дні
  const y = !dropped ? '4%' : item.floats ? '33%' : '78%';
  return (
    <SceneTask question="Плаває чи тоне?" say={say} sayKey={round.id} peek={false} sceneBg="#EAF4FF">
      <div style={{ position: 'absolute', inset: 12, borderRadius: 26, overflow: 'hidden' }}>
        {/* вода */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: '38%', bottom: 0, background: 'linear-gradient(#8FD0FF, #3D8FE0)' }} />
        <svg viewBox="0 0 100 6" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, right: 0, top: 'calc(38% - 8px)', width: '100%', height: 12 }}>
          <path d="M0 3 Q 6 0 12.5 3 T 25 3 T 37.5 3 T 50 3 T 62.5 3 T 75 3 T 87.5 3 T 100 3 L100 6 L0 6 Z" fill="#8FD0FF" />
        </svg>
        {/* дно з камінцями */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '12%', background: '#E8C98F' }} />
        {/* дві зони тапу: поверхня і дно */}
        <button type="button" aria-label="Плаває" disabled={disabled} onClick={() => pick('float')}
          style={{ position: 'absolute', left: 0, right: 0, top: '30%', height: '22%', border: 0, background: 'rgba(255,255,255,.0)', cursor: 'pointer', outline: answerState === 'incorrect' && item.floats ? '4px solid #22C55E' : undefined }}>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 26, opacity: 0.8 }}>〰️</span>
        </button>
        <button type="button" aria-label="Тоне" disabled={disabled} onClick={() => pick('sink')}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '30%', border: 0, background: 'rgba(255,255,255,.0)', cursor: 'pointer', outline: answerState === 'incorrect' && !item.floats ? '4px solid #22C55E' : undefined }}>
          <span style={{ position: 'absolute', right: 12, bottom: 14, fontSize: 24, opacity: 0.8 }}>⬇️</span>
        </button>
        {/* предмет */}
        {/* CSS-перехід по top: Motion з відсотками top/left спотикається (лабіринт, 10.10) */}
        <motion.img src={`/count/${item.id}.webp`} alt={item.name} draggable={false}
          animate={{ rotate: dropped && item.floats ? [0, -6, 6, -3, 0] : 0 }}
          transition={{ rotate: { duration: 1.6, repeat: dropped && item.floats ? Infinity : 0 } }}
          style={{ position: 'absolute', top: y, left: `calc(50% - ${SIZE / 2}px)`, width: SIZE, height: SIZE, objectFit: 'contain', pointerEvents: 'none',
            transition: `top ${item.floats ? '.6s' : '1.1s'} cubic-bezier(.3,.1,.3,1.2)`, filter: 'drop-shadow(0 3px 2px rgba(0,0,0,.2))' }} />
      </div>
    </SceneTask>
  );
}
