import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { Face, Zone } from './Bunny';

/**
 * Маскот-зайченя як «лялька»: справжня ілюстрація, розрізана на шари
 * (тіло, ліве й праве вушко) + накладки повік і ротика. Координати — у пікселях
 * оригіналу 1024×1024, у верстці — відсотки.
 */
const P = (v: number) => `${(v / 1024) * 100}%`;
const BODY = [142, 252, 920, 957];
const EAR_L = [272, 36, 516, 361];
const EAR_R = [590, 76, 861, 356];
const EYES = [
  { cx: 413, cy: 518, rx: 62, ry: 72 },
  { cx: 657, cy: 510, rx: 62, ry: 66 },
];
const SKIN = '#F1F9EE';
const box = (b: number[]) => ({ position: 'absolute' as const, left: P(b[0]), top: P(b[1]), width: P(b[2] - b[0]), height: P(b[3] - b[1]) });

export default function PuppetBunny({ face, onZone, bounce = 0, earFlop }: { face: Face; onZone: (z: Zone) => void; bounce?: number; earFlop?: 'L' | 'R' | null }) {
  const root = useRef<HTMLDivElement>(null);
  const [blink, setBlink] = useState(false);
  const [tilt, setTilt] = useState(0);

  // голова трохи повертається за пальцем
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const r = root.current?.getBoundingClientRect();
      if (!r) return;
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      setTilt(Math.max(-1, Math.min(1, dx)) * 5);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerdown', move);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerdown', move); };
  }, []);

  useEffect(() => {
    if (face === 'sleep' || face === 'happy' || face === 'laugh') return;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => { t = setTimeout(() => { setBlink(true); setTimeout(() => setBlink(false), 130); loop(); }, 2400 + Math.random() * 2600); };
    loop();
    return () => clearTimeout(t);
  }, [face]);

  const lid = face === 'sleep' || face === 'happy' || face === 'laugh' ? 1 : blink ? 1 : 0;
  const hit = (z: Zone) => (e: React.PointerEvent) => { e.stopPropagation(); onZone(z); };

  const ear = (side: 'L' | 'R') => {
    const b = side === 'L' ? EAR_L : EAR_R;
    const flop = earFlop === side;
    const sgn = side === 'L' ? -1 : 1;
    return (
      <motion.img
        src={`/poc-assets/rabbit_ear${side}.webp`}
        alt=""
        draggable={false}
        onPointerDown={hit(side === 'L' ? 'earL' : 'earR')}
        style={{ ...box(b), transformOrigin: side === 'L' ? '52% 90%' : '41% 89%', cursor: 'pointer' }}
        animate={flop ? { rotate: [0, sgn * 28, sgn * 14, sgn * 22, 0] } : face === 'sleep' ? { rotate: sgn * 18 } : face === 'o' ? { rotate: 0 } : { rotate: [0, sgn * 4, 0, sgn * 2, 0] }}
        transition={flop ? { duration: 0.9 } : face === 'sleep' ? { duration: 1.2 } : { duration: side === 'L' ? 3.4 : 2.9, repeat: Infinity, ease: 'easeInOut' }}
      />
    );
  };

  return (
    <motion.div
      ref={root}
      key={bounce}
      style={{ position: 'relative', width: '100%', aspectRatio: '1', transformOrigin: '50% 92%', touchAction: 'none' }}
      animate={
        face === 'sleep'
          ? { scaleY: [0.97, 0.995, 0.97], y: 10, rotate: -4 }
          : bounce
            ? { y: [0, -60, 0, -22, 0], scaleY: [1, 1.06, 0.9, 1.03, 1], scaleX: [1, 0.96, 1.08, 0.98, 1], rotate: tilt }
            : { scaleY: [1, 1.018, 1], scaleX: [1, 0.993, 1], rotate: tilt }
      }
      transition={face === 'sleep' ? { duration: 3.2, repeat: Infinity } : bounce ? { duration: 0.85 } : { scaleY: { duration: 2.6, repeat: Infinity }, scaleX: { duration: 2.6, repeat: Infinity }, rotate: { type: 'spring', stiffness: 60, damping: 12 } }}
    >
      {/* тінь */}
      <div style={{ position: 'absolute', left: '22%', right: '22%', bottom: '5%', height: '4%', borderRadius: '50%', background: 'rgba(60,40,30,.13)', filter: 'blur(2px)' }} />
      {ear('L')}
      {ear('R')}
      <img src="/poc-assets/rabbit_body.webp" alt="" draggable={false} style={{ ...box(BODY), pointerEvents: 'none' }} />

      {/* повіки */}
      {EYES.map((e, i) => (
        <div key={i} style={{ position: 'absolute', left: P(e.cx - e.rx), top: P(e.cy - e.ry), width: P(e.rx * 2), height: P(e.ry * 2), pointerEvents: 'none' }}>
          <motion.div
            initial={false}
            animate={{ scaleY: lid }}
            transition={{ duration: blink ? 0.06 : 0.18 }}
            style={{ position: 'absolute', inset: '-6%', borderRadius: '50%', background: SKIN, transformOrigin: '50% 0%' }}
          />
          {lid === 1 && (
            <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
              {face === 'happy' || face === 'laugh'
                ? <path d="M18 62 Q50 28 82 62" stroke="#2b2340" strokeWidth="9" fill="none" strokeLinecap="round" />
                : <path d="M16 52 Q50 74 84 52" stroke="#2b2340" strokeWidth="8" fill="none" strokeLinecap="round" />}
            </svg>
          )}
        </div>
      ))}

      {/* ротик: накладка поверх намальованого */}
      {(face === 'laugh' || face === 'o' || face === 'chew' || face === 'sad') && (
        <svg viewBox="0 0 100 60" style={{ position: 'absolute', left: P(470), top: P(566), width: P(98), height: P(58), overflow: 'visible', pointerEvents: 'none' }}>
          <ellipse cx="50" cy="26" rx="46" ry="22" fill="#FFFFFF" />
          {face === 'laugh' && <path d="M22 14 Q50 70 78 14 Z" fill="#c2456b" stroke="#7a3550" strokeWidth="4" strokeLinejoin="round" />}
          {face === 'o' && <ellipse cx="50" cy="26" rx="11" ry="14" fill="#c2456b" stroke="#7a3550" strokeWidth="4" />}
          {face === 'sad' && <path d="M28 36 Q50 16 72 36" stroke="#7a3550" strokeWidth="5" fill="none" strokeLinecap="round" />}
          {face === 'chew' && (
            <motion.ellipse cx="50" cy="24" rx="16" fill="#c2456b" stroke="#7a3550" strokeWidth="4" animate={{ ry: [4, 11, 4, 11, 4] }} transition={{ duration: 0.8, repeat: 1 }} />
          )}
        </svg>
      )}

      {/* зони дотику: голова, носик, пузико */}
      <div onPointerDown={hit('head')} style={{ position: 'absolute', left: P(330), top: P(300), width: P(380), height: P(140), borderRadius: '50%', cursor: 'pointer' }} />
      <div onPointerDown={hit('nose')} style={{ position: 'absolute', left: P(470), top: P(535), width: P(90), height: P(70), borderRadius: '50%', cursor: 'pointer' }} />
      <div onPointerDown={hit('belly')} style={{ position: 'absolute', left: P(400), top: P(720), width: P(230), height: P(200), borderRadius: '50%', cursor: 'pointer' }} />
    </motion.div>
  );
}
