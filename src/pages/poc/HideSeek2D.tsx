import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { sayUk } from '@/games/shared/uk-audio';

/**
 * PoC «Де сховалось звірятко?» у 2.5D: шари ілюстрацій + пружинна фізика Motion.
 * Зайчик сидить за одним із трьох кущів, з-за листя видно вушка. Не той кущ —
 * трусимо, той — кущ від'їжджає, зайчик вистрибує, летять іскри.
 */
const BUSHES = [
  { x: 6, y: 58, s: 1 },
  { x: 37, y: 63, s: 1.12 },
  { x: 68, y: 57, s: 0.96 },
];

type Phase = 'hidden' | 'found';

function Sparks() {
  const parts = useMemo(
    () => Array.from({ length: 14 }, (_, i) => ({ a: (i / 14) * Math.PI * 2, d: 70 + Math.random() * 60, e: ['✨', '⭐', '💛'][i % 3] })),
    [],
  );
  return (
    <>
      {parts.map((p, i) => (
        <motion.span
          key={i}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
          animate={{ x: Math.cos(p.a) * p.d, y: Math.sin(p.a) * p.d - 30, opacity: 0, scale: 1.2 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          style={{ position: 'absolute', left: '50%', top: '40%', fontSize: 22, pointerEvents: 'none' }}
        >
          {p.e}
        </motion.span>
      ))}
    </>
  );
}

export default function HideSeek2D() {
  const [spot, setSpot] = useState(() => Math.floor(Math.random() * 3));
  const [phase, setPhase] = useState<Phase>('hidden');
  const [shake, setShake] = useState<number | null>(null);
  const [round, setRound] = useState(0);

  useEffect(() => {
    sayUk('poc.where', 'Де сховався зайчик?');
  }, [round]);

  const tap = (i: number) => {
    if (phase === 'found') return;
    if (i === spot) {
      setPhase('found');
      sayUk('poc.found', 'Ось він! Молодець!');
    } else {
      setShake(i);
      sayUk('poc.notHere', 'Тут немає. Шукай ще!');
      setTimeout(() => setShake(null), 500);
    }
  };

  const next = () => {
    let n = spot;
    while (n === spot) n = Math.floor(Math.random() * 3);
    setSpot(n);
    setPhase('hidden');
    setRound((r) => r + 1);
  };

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '9 / 14', maxHeight: '78vh', borderRadius: 28, overflow: 'hidden', background: 'url(/poc-assets/meadow.webp) center / cover', userSelect: 'none', touchAction: 'manipulation' }}>
      {/* хмарка-підказка */}
      <motion.div
        key={round + phase}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{ position: 'absolute', top: '6%', left: 0, right: 0, textAlign: 'center', fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: 22, color: '#2b3a2b', textShadow: '0 2px 0 #fff' }}
      >
        {phase === 'hidden' ? 'Де сховався зайчик?' : 'Ось він! 🎉'}
      </motion.div>

      {BUSHES.map((b, i) => {
        const here = i === spot;
        return (
          <div key={`${round}-${i}`} style={{ position: 'absolute', left: `${b.x}%`, top: `${b.y}%`, width: `${26 * b.s}%`, aspectRatio: '1' }}>
            {/* зайчик — шар ЗА кущем */}
            {here && (
              <motion.img
                src="/poc-assets/rabbit.webp"
                alt=""
                draggable={false}
                initial={{ y: '18%' }}
                animate={phase === 'found' ? { y: '-62%', scale: [1, 1.15, 0.95, 1.05, 1], rotate: [0, -6, 6, 0] } : { y: ['18%', '12%', '18%'] }}
                transition={phase === 'found' ? { type: 'spring', stiffness: 260, damping: 12 } : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'absolute', left: '8%', width: '84%', bottom: '30%', zIndex: 1, pointerEvents: 'none' }}
              />
            )}
            {/* кущ — шар ПОПЕРЕДУ */}
            <motion.img
              src="/poc-assets/bush.webp"
              alt=""
              draggable={false}
              onClick={() => tap(i)}
              animate={
                here && phase === 'found'
                  ? { x: '70%', rotate: 14, opacity: 0.85 }
                  : shake === i
                    ? { x: [0, -14, 14, -10, 10, 0], rotate: [0, -4, 4, 0] }
                    : { rotate: [0, here ? 2.5 : 1.2, 0, here ? -2.5 : -1.2, 0] }
              }
              transition={
                here && phase === 'found'
                  ? { type: 'spring', stiffness: 120, damping: 14 }
                  : shake === i
                    ? { duration: 0.45 }
                    : { duration: here ? 2.4 : 3.4, repeat: Infinity, ease: 'easeInOut' }
              }
              whileTap={{ scale: 0.94 }}
              style={{ position: 'absolute', inset: 0, width: '100%', zIndex: 2, cursor: 'pointer', transformOrigin: '50% 95%', filter: 'drop-shadow(0 8px 6px rgba(0,0,0,.18))' }}
            />
            {here && phase === 'found' && <Sparks />}
          </div>
        );
      })}

      <AnimatePresence>
        {phase === 'found' && (
          <motion.button
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.5 }}
            onClick={next}
            style={{ position: 'absolute', bottom: '5%', left: '20%', right: '20%', padding: '16px 0', borderRadius: 20, border: 0, background: '#7c3aed', color: '#fff', fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: 22, boxShadow: '0 8px 20px -6px rgba(124,58,237,.6)', cursor: 'pointer' }}
          >
            ▶ Ще раз
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
