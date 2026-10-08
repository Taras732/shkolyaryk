import { useRef, useState } from 'react';
import { motion, AnimatePresence, type TargetAndTransition, type Transition } from 'motion/react';
import { sayUk } from '@/games/shared/uk-audio';

/**
 * PoC звірятка-супутника: стани без Rive — рух самого малюнка (дихання, підскок,
 * сон, жування). Морквину тягнеш пальцем до зайчика — він їсть і радіє.
 * Справжні міміка й моргання — уже в Rive, якщо PoC сподобається.
 */
type Mood = 'idle' | 'hungry' | 'eating' | 'happy' | 'sleepy';

const MOODS: { id: Mood; label: string }[] = [
  { id: 'idle', label: '🙂 Спокій' },
  { id: 'hungry', label: '🥕 Голодний' },
  { id: 'happy', label: '💛 Радіє' },
  { id: 'sleepy', label: '😴 Спить' },
];

const ANIM: Record<Mood, { animate: TargetAndTransition; transition: Transition }> = {
  idle: { animate: { scaleY: [1, 1.03, 1], scaleX: [1, 0.99, 1], rotate: 0, y: 0 }, transition: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } },
  hungry: { animate: { rotate: [0, -4, 0, 4, 0], y: [0, 4, 0], scaleY: 0.97 }, transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } },
  eating: { animate: { scaleY: [1, 0.92, 1.04, 0.92, 1], scaleX: [1, 1.05, 0.98, 1.05, 1] }, transition: { duration: 0.5, repeat: 3 } },
  happy: { animate: { y: [0, -60, 0, -30, 0], rotate: [0, -8, 8, 0], scaleY: [1, 1.08, 0.9, 1.04, 1] }, transition: { duration: 1.1, repeat: Infinity, repeatDelay: 0.4 } },
  sleepy: { animate: { rotate: -10, y: 16, scaleY: [0.94, 0.97, 0.94], filter: 'brightness(0.85)' }, transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' } },
};

export default function Companion() {
  const [mood, setMood] = useState<Mood>('hungry');
  const zone = useRef<HTMLDivElement>(null);
  const bunny = useRef<HTMLImageElement>(null);

  const feed = (x: number, y: number) => {
    const r = bunny.current?.getBoundingClientRect();
    if (!r || x < r.left || x > r.right || y < r.top || y > r.bottom) return false;
    setMood('eating');
    sayUk('poc.yum', 'Смачно! Дякую!');
    setTimeout(() => setMood('happy'), 1600);
    setTimeout(() => setMood('idle'), 5200);
    return true;
  };

  const a = ANIM[mood];
  return (
    <div ref={zone} style={{ position: 'relative', width: '100%', aspectRatio: '9 / 14', maxHeight: '78vh', borderRadius: 28, overflow: 'hidden', background: mood === 'sleepy' ? 'linear-gradient(#2a2f5a, #4b4f86)' : 'linear-gradient(#fff4dc, #ffe2c4)', transition: 'background .8s', userSelect: 'none', touchAction: 'none' }}>
      <div style={{ position: 'absolute', top: 14, left: 0, right: 0, display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', zIndex: 3 }}>
        {MOODS.map((m) => (
          <button key={m.id} onClick={() => setMood(m.id)} style={{ border: 0, borderRadius: 99, padding: '7px 11px', fontFamily: 'var(--font-round)', fontWeight: 800, fontSize: 13, background: mood === m.id ? '#1F2138' : '#fff', color: mood === m.id ? '#fff' : '#1F2138', cursor: 'pointer' }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* бульбашка думки */}
      <AnimatePresence>
        {(mood === 'hungry' || mood === 'sleepy' || mood === 'happy') && (
          <motion.div key={mood} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}
            style={{ position: 'absolute', top: '17%', right: '14%', background: '#fff', borderRadius: 22, padding: '10px 14px', fontSize: 34, boxShadow: '0 6px 16px -6px rgba(0,0,0,.25)', zIndex: 2 }}>
            {mood === 'hungry' ? '🥕' : mood === 'sleepy' ? '💤' : '💛'}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.img
        ref={bunny}
        src="/poc/rabbit.webp"
        alt=""
        draggable={false}
        key={mood}
        animate={a.animate}
        transition={a.transition}
        onClick={() => { if (mood !== 'sleepy') { setMood('happy'); sayUk('poc.giggle', 'Хі-хі! Лоскотно!'); setTimeout(() => setMood('idle'), 3000); } }}
        style={{ position: 'absolute', left: '17%', width: '66%', top: '24%', transformOrigin: '50% 100%', cursor: 'pointer', zIndex: 1 }}
      />

      {/* морквина — тягни до зайчика */}
      {mood !== 'sleepy' && mood !== 'eating' && (
        <motion.div
          drag
          dragSnapToOrigin
          dragConstraints={zone}
          dragElastic={0.2}
          onDragEnd={(_, info) => feed(info.point.x - window.scrollX, info.point.y - window.scrollY)}
          whileDrag={{ scale: 1.25, rotate: -20 }}
          animate={mood === 'hungry' ? { y: [0, -8, 0] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
          style={{ position: 'absolute', bottom: '6%', left: 'calc(50% - 34px)', width: 68, height: 68, borderRadius: 22, background: '#fff', display: 'grid', placeItems: 'center', fontSize: 40, boxShadow: '0 6px 16px -6px rgba(0,0,0,.3)', cursor: 'grab', zIndex: 3 }}
        >
          🥕
        </motion.div>
      )}
      {mood === 'hungry' && (
        <div style={{ position: 'absolute', bottom: '19%', left: 0, right: 0, textAlign: 'center', fontFamily: 'var(--font-round)', fontWeight: 800, fontSize: 14, color: '#8a6a4a' }}>Перетягни морквину до зайчика</div>
      )}
    </div>
  );
}
