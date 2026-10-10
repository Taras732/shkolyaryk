import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import PuppetBunny from '@/pages/poc/PuppetBunny';
import type { Face, Zone } from '@/pages/poc/Bunny';
import type { Pet } from './pets';

const P = (v: number) => `${(v / 1024) * 100}%`;

/**
 * Друг на екрані. Зайчик — лялька з шарів (вушка окремо). Решта — ціла ілюстрація з накладками
 * за розміткою `pet.face`: повіки (моргає, жмуриться, спить), ротик (сміх, «о», жує, сум),
 * тіло стискається й підстрибує, голова тягнеться за пальцем, від погладжування — сердечка.
 * Вибір концепції 10.10: варіант А (без генерації); справжні шари — пізніше.
 */
export default function PetPuppet({ pet, face, onZone, bounce = 0, earFlop }: { pet: Pet; face: Face; onZone: (z: Zone) => void; bounce?: number; earFlop?: 'L' | 'R' | null }) {
  if (pet.id === 'rabbit' || !pet.face) return <PuppetBunny face={face} onZone={onZone} bounce={bounce} earFlop={earFlop} />;
  return <FacePuppet pet={pet} face={face} onZone={onZone} bounce={bounce} />;
}

function FacePuppet({ pet, face, onZone, bounce }: { pet: Pet; face: Face; onZone: (z: Zone) => void; bounce: number }) {
  const { eyes, mouth } = pet.face!;
  const root = useRef<HTMLDivElement>(null);
  const [blink, setBlink] = useState(false);
  const [tilt, setTilt] = useState(0);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const stroke = useRef<{ x: number; y: number; d: number } | null>(null);

  // голова трохи повертається за пальцем
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const r = root.current?.getBoundingClientRect();
      if (!r) return;
      setTilt(Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / r.width)) * 5);
    };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, []);

  useEffect(() => {
    if (face === 'sleep' || face === 'happy' || face === 'laugh') return;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => { t = setTimeout(() => { setBlink(true); setTimeout(() => setBlink(false), 130); loop(); }, 2400 + Math.random() * 2600); };
    loop();
    return () => clearTimeout(t);
  }, [face]);

  const closed = face === 'sleep' || face === 'happy' || face === 'laugh' || blink;

  /** Зона за точкою: над очима — голова, біля рота — носик, нижче — пузико. */
  const zoneAt = (e: React.PointerEvent): Zone => {
    const r = root.current!.getBoundingClientRect();
    const y = ((e.clientY - r.top) / r.height) * 1024;
    const x = ((e.clientX - r.left) / r.width) * 1024;
    const eyeTop = Math.min(...eyes.map((q) => q[1] - q[3]));
    if (y < eyeTop + 10) return 'head';
    if (Math.hypot(x - mouth[0], y - mouth[1]) < 90) return 'nose';
    return y > mouth[1] + 90 ? 'belly' : 'head';
  };

  const heart = (e: React.PointerEvent) => {
    const r = root.current!.getBoundingClientRect();
    const h = { id: Date.now() + Math.random(), x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
    setHearts((a) => [...a.slice(-6), h]);
    window.setTimeout(() => setHearts((a) => a.filter((q) => q.id !== h.id)), 900);
  };

  return (
    <motion.div
      ref={root}
      key={bounce}
      onPointerDown={(e) => { stroke.current = { x: e.clientX, y: e.clientY, d: 0 }; onZone(zoneAt(e)); }}
      onPointerMove={(e) => {
        // погладжування: палець провів ~60px — сердечко і ще раз «голова» (жмуриться)
        const s = stroke.current;
        if (!s) return;
        s.d += Math.hypot(e.clientX - s.x, e.clientY - s.y);
        s.x = e.clientX; s.y = e.clientY;
        if (s.d > 60) { s.d = 0; heart(e); onZone('head'); }
      }}
      onPointerUp={() => { stroke.current = null; }}
      onPointerLeave={() => { stroke.current = null; }}
      style={{ position: 'relative', width: '100%', aspectRatio: '1', transformOrigin: '50% 92%', touchAction: 'none', cursor: 'pointer', userSelect: 'none' }}
      animate={
        face === 'sleep'
          ? { scaleY: [0.97, 0.995, 0.97], y: 10, rotate: -4 }
          : bounce
            ? { y: [0, -60, 0, -22, 0], scaleY: [1, 1.06, 0.9, 1.03, 1], scaleX: [1, 0.96, 1.08, 0.98, 1], rotate: tilt }
            : face === 'laugh'
              ? { scaleY: [1, 0.93, 1.03, 0.95, 1], scaleX: [1, 1.05, 0.98, 1.03, 1], rotate: tilt }
              : { scaleY: [1, 1.018, 1], scaleX: [1, 0.993, 1], rotate: tilt }
      }
      transition={face === 'sleep' ? { duration: 3.2, repeat: Infinity } : bounce ? { duration: 0.85 } : face === 'laugh' ? { duration: 0.7 }
        : { scaleY: { duration: 2.6, repeat: Infinity }, scaleX: { duration: 2.6, repeat: Infinity }, rotate: { type: 'spring', stiffness: 60, damping: 12 } }}
    >
      <div style={{ position: 'absolute', left: '22%', right: '22%', bottom: '4%', height: '4%', borderRadius: '50%', background: 'rgba(60,40,30,.13)', filter: 'blur(2px)' }} />
      <img src={pet.full} alt={pet.name} draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />

      {/* повіки */}
      {eyes.map(([cx, cy, rx, ry, lidColor], i) => (
        <div key={i} style={{ position: 'absolute', left: P(cx - rx), top: P(cy - ry), width: P(rx * 2), height: P(ry * 2), pointerEvents: 'none' }}>
          <motion.div initial={false} animate={{ scaleY: closed ? 1 : 0 }} transition={{ duration: blink ? 0.06 : 0.18 }}
            style={{ position: 'absolute', inset: '-8%', borderRadius: '50%', background: lidColor, transformOrigin: '50% 0%' }} />
          {closed && (
            <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
              {face === 'happy' || face === 'laugh'
                ? <path d="M18 62 Q50 28 82 62" stroke="#2b2340" strokeWidth="9" fill="none" strokeLinecap="round" />
                : <path d="M16 52 Q50 74 84 52" stroke="#2b2340" strokeWidth="8" fill="none" strokeLinecap="round" />}
            </svg>
          )}
        </div>
      ))}

      {/* брови й сльозинка: щоб сум і здивування читались з першого погляду (гра «Хто сумує?», 10.10) */}
      {(face === 'sad' || face === 'o') && eyes.map(([cx, cy, rx, ry], i) => {
        const left = i === 0;
        const y = cy - ry - (face === 'o' ? 38 : 16);
        const d = face === 'o'
          ? `M ${cx - rx * 0.9} ${y + 10} Q ${cx} ${y - 22} ${cx + rx * 0.9} ${y + 10}`
          : left ? `M ${cx - rx * 0.9} ${y + 6} L ${cx + rx * 0.8} ${y - 12}` : `M ${cx - rx * 0.8} ${y - 12} L ${cx + rx * 0.9} ${y + 6}`;
        return (
          <svg key={`b${i}`} viewBox="0 0 1024 1024" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
            <path d={d} stroke="#3a2a35" strokeWidth={14} fill="none" strokeLinecap="round" />
            {face === 'sad' && i === 1 && <path d={`M ${cx + rx * 0.3} ${cy + ry + 6} q 14 26 0 40 q -14 -14 0 -40 Z`} fill="#6EC6FF" stroke="#3A8FD0" strokeWidth={4} />}
          </svg>
        );
      })}

      {/* ротик поверх намальованого */}
      {(face === 'laugh' || face === 'o' || face === 'chew' || face === 'sad') && (
        <svg viewBox="0 0 100 60" style={{ position: 'absolute', left: P(mouth[0] - 49), top: P(mouth[1] - 20), width: P(98), height: P(58), overflow: 'visible', pointerEvents: 'none' }}>
          <ellipse cx="50" cy="22" rx="44" ry="20" fill={mouth[2]} />
          {face === 'laugh' && <path d="M22 10 Q50 66 78 10 Z" fill="#c2456b" stroke="#7a3550" strokeWidth="4" strokeLinejoin="round" />}
          {face === 'o' && <ellipse cx="50" cy="24" rx="15" ry="19" fill="#c2456b" stroke="#7a3550" strokeWidth="4" />}
          {face === 'sad' && <path d="M24 36 Q50 8 76 36" stroke="#7a3550" strokeWidth="7" fill="none" strokeLinecap="round" />}
          {face === 'chew' && (
            <motion.ellipse cx="50" cy="20" rx="16" fill="#c2456b" stroke="#7a3550" strokeWidth="4" animate={{ ry: [4, 11, 4, 11, 4] }} transition={{ duration: 0.8, repeat: 1 }} />
          )}
        </svg>
      )}

      {face === 'sleep' && <span style={{ position: 'absolute', top: '8%', right: '14%', fontSize: 26, pointerEvents: 'none' }}>💤</span>}

      <AnimatePresence>
        {hearts.map((h) => (
          <motion.span key={h.id} initial={{ opacity: 0, y: 0, scale: 0.5 }} animate={{ opacity: [0, 1, 0], y: -60, scale: 1.1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9 }}
            style={{ position: 'absolute', left: `${h.x}%`, top: `${h.y}%`, fontSize: 24, pointerEvents: 'none', marginLeft: -12, marginTop: -12 }}>
            💗
          </motion.span>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
