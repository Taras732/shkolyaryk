import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { Difficulty, GameComponentProps, LevelData } from '../types';
import { sayUk } from '../shared/uk-audio';
import { SceneTask } from '../shared/count-ui';

/**
 * Дошкілля (10.10.2026, після рев'ю Тараса: «ідея класна, реалізації немає»): намальовані шестерні, що справді крутяться.
 * Перша крутиться (стрілка показує куди) — «куди крутитиметься остання?», відповідь — велика стрілка ↻ / ↺.
 * Після відповіді вся передача оживає й показує правду. На першому раунді друг пояснює правило.
 * Рівні: 2 → 3 → 4–5 шестерень, різних розмірів.
 */
export const CW = 'cw';
export const CCW = 'ccw';
const COLORS = ['#F59E0B', '#3B82F6', '#22C55E', '#EF4444', '#A855F7'];

export interface KidGearP { kid: true; sizes: number[]; firstCw: boolean }

export function generateKids(d: Difficulty): LevelData<KidGearP, string> {
  const count = (i: number) => (d === 1 ? 2 : d === 2 ? 3 : 4 + (i % 2));
  return {
    difficulty: d,
    rounds: Array.from({ length: 5 }, (_, i) => {
      const n = count(i);
      const sizes = Array.from({ length: n }, () => [44, 34, 54][Math.floor(Math.random() * 3)]);
      const firstCw = Math.random() < 0.5;
      // сусідні — у різні боки: остання крутиться як перша, якщо їх непарна кількість
      const lastCw = n % 2 === 1 ? firstCw : !firstCw;
      return { id: `r${i}`, payload: { kid: true, sizes, firstCw }, answer: lastCw ? CW : CCW };
    }),
  };
}

/** Шестерня: коло з зубцями (SVG), зубців ∝ радіусу — тоді зчеплені крутяться з однаковою «швидкістю зубців». */
function Gear({ r, color }: { r: number; color: string }) {
  const teeth = Math.round(r / 4.5);
  const pts: string[] = [];
  for (let k = 0; k < teeth * 2; k++) {
    const a = (k / (teeth * 2)) * Math.PI * 2;
    const rr = k % 2 === 0 ? r : r - 8;
    const a2 = a + Math.PI / (teeth * 2);
    pts.push(`${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`, `${(Math.cos(a2) * rr).toFixed(1)},${(Math.sin(a2) * rr).toFixed(1)}`);
  }
  return (
    <g>
      <polygon points={pts.join(' ')} fill={color} stroke="#3a2a35" strokeWidth={2.5} strokeLinejoin="round" />
      <circle r={r * 0.32} fill="#fff" stroke="#3a2a35" strokeWidth={2.5} />
      <circle r={r * 0.1} fill="#3a2a35" />
    </g>
  );
}

const Arrow = ({ cw, size = 46 }: { cw: boolean; size?: number }) => (
  <svg viewBox="0 0 48 48" width={size} height={size} style={{ transform: cw ? undefined : 'scaleX(-1)' }}>
    <path d="M38 24 A14 14 0 1 1 24 10" fill="none" stroke="#3a2a35" strokeWidth={5} strokeLinecap="round" />
    <path d="M24 2 L33 10 L24 18 Z" fill="#3a2a35" />
  </svg>
);

export function KidsGears({ round, disabled, answerState, onAnswer }: GameComponentProps<KidGearP, string>) {
  const { sizes, firstCw } = round.payload;
  const [spin, setSpin] = useState(false);
  useEffect(() => { setSpin(false); }, [round.id]);
  useEffect(() => { if (answerState !== 'idle') setSpin(true); }, [answerState]);
  const say = (again?: boolean) => {
    if (round.id === 'r0' && !again) sayUk('gears.rule', 'Зубчики штовхають сусіда — тому він крутиться в інший бік. Куди крутитиметься остання?');
    else sayUk('gears.q', 'Куди крутитиметься остання?');
  };
  // розкладка: центри в ряд з легким зигзагом, сусіди торкаються зубцями
  const xs: number[] = [];
  const ys: number[] = [];
  sizes.forEach((r, i) => {
    if (i === 0) { xs.push(r + 6); ys.push(90); return; }
    const d = sizes[i - 1] + r - 7;
    const dy = i % 2 === 1 ? -18 : 18;
    xs.push(xs[i - 1] + Math.sqrt(Math.max(0, d * d - dy * dy)));
    ys.push(ys[i - 1] + dy);
  });
  const W = xs[xs.length - 1] + sizes[sizes.length - 1] + 6;
  return (
    <SceneTask question="Куди крутитиметься остання?" say={say} sayKey={round.id} peek={false} sceneBg="linear-gradient(180deg, #FFF7E8 0%, #FDEBD3 100%)">
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
        <svg viewBox={`0 0 ${W} 180`} style={{ width: '100%', maxWidth: 360, overflow: 'visible' }}>
          {sizes.map((r, i) => {
            const cw = i % 2 === 0 ? firstCw : !firstCw;
            // перша крутиться завжди (дитина бачить напрям); решта — лише після відповіді
            const moving = i === 0 || spin;
            const dur = (r / 44) * 3;
            return (
              <g key={i} transform={`translate(${xs[i]} ${ys[i]})`}>
                <motion.g animate={moving ? { rotate: cw ? 360 : -360 } : { rotate: 0 }}
                  transition={moving ? { duration: dur, repeat: Infinity, ease: 'linear' } : { duration: 0.3 }}>
                  <Gear r={r} color={COLORS[i % COLORS.length]} />
                </motion.g>
                {i === 0 && <g transform={`translate(${-24} ${-r - 52})`}><foreignObject width="48" height="48"><Arrow cw={firstCw} /></foreignObject></g>}
                {i === sizes.length - 1 && !spin && <text x={0} y={-r - 14} textAnchor="middle" fontSize={30} fontWeight={900} fill="#F08A24">?</text>}
              </g>
            );
          })}
        </svg>
        <div style={{ display: 'flex', gap: 18 }}>
          {[CW, CCW].map((v) => {
            const right = answerState === 'correct' && v === round.answer;
            return (
              <motion.button key={v} type="button" aria-label={v === CW ? 'за годинниковою' : 'проти годинникової'} disabled={disabled} whileTap={{ scale: 0.9 }} onClick={() => !disabled && onAnswer(v)}
                style={{ width: 96, height: 96, border: 0, borderRadius: 28, background: right ? '#DCF7E3' : '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer',
                  boxShadow: right ? '0 0 0 5px #22C55E, 0 6px 0 #9FDDB0' : '0 6px 0 #F1E3CF' }}>
                <Arrow cw={v === CW} size={58} />
              </motion.button>
            );
          })}
        </div>
      </div>
    </SceneTask>
  );
}
