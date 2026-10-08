import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

/**
 * Зайчик-супутник зі складових частин (SVG): вушка, очі, ротик анімуються окремо.
 * Очі стежать за пальцем, моргання само по собі, реакції на дотик по зонах.
 */
export type Face = 'smile' | 'laugh' | 'o' | 'sad' | 'happy' | 'sleep' | 'chew';
export type Zone = 'earL' | 'earR' | 'nose' | 'belly' | 'head';

const MOUTH: Record<Exclude<Face, 'happy' | 'sleep'>, string> = {
  smile: 'M136 203 Q150 216 164 203',
  laugh: 'M134 199 Q150 232 166 199 Z',
  o: 'M150 198 m-8 8 a8 9 0 1 0 16 0 a8 9 0 1 0 -16 0',
  sad: 'M138 212 Q150 202 162 212',
  chew: 'M140 204 Q150 210 160 204',
};

export default function Bunny({ face, onZone, bounce = 0, earFlop }: { face: Face; onZone: (z: Zone) => void; bounce?: number; earFlop?: 'L' | 'R' | null }) {
  const svg = useRef<SVGSVGElement>(null);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);

  // очі за пальцем / мишкою
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const r = svg.current?.getBoundingClientRect();
      if (!r) return;
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height * 0.45);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 220);
      setLook({ x: (dx / d) * 6 * k, y: (dy / d) * 6 * k });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerdown', move);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerdown', move); };
  }, []);

  // моргання раз на 2.5–5 с
  useEffect(() => {
    if (face === 'sleep' || face === 'happy') return;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => { setBlink(true); setTimeout(() => setBlink(false), 140); loop(); }, 2500 + Math.random() * 2500);
    };
    loop();
    return () => clearTimeout(t);
  }, [face]);

  const eyesClosed = face === 'sleep';
  const hit = (z: Zone) => (e: React.PointerEvent) => { e.stopPropagation(); onZone(z); };
  const fb = { transformBox: 'fill-box' as const };

  return (
    <motion.svg
      ref={svg}
      viewBox="0 0 300 370"
      style={{ width: '100%', height: '100%', overflow: 'visible', touchAction: 'none' }}
      animate={face === 'sleep' ? { scaleY: [1, 1.025, 1] } : { y: bounce ? [0, -40, 0, -16, 0] : [0, -3, 0] }}
      transition={face === 'sleep' ? { duration: 3.2, repeat: Infinity } : bounce ? { duration: 0.8 } : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      key={bounce}
    >
      {/* тінь */}
      <ellipse cx="150" cy="356" rx="80" ry="10" fill="rgba(60,40,30,.12)" />

      {/* вушка */}
      {(['L', 'R'] as const).map((s) => {
        const x = s === 'L' ? 112 : 188;
        const flop = earFlop === s;
        return (
          <motion.g
            key={s}
            style={{ ...fb, transformOrigin: '50% 100%' }}
            animate={flop ? { rotate: s === 'L' ? [-0, -55, -40] : [0, 55, 40] } : face === 'sleep' ? { rotate: s === 'L' ? -28 : 28 } : { rotate: s === 'L' ? [-4, -8, -4] : [4, 8, 4] }}
            transition={flop ? { type: 'spring', stiffness: 220, damping: 9 } : { duration: s === 'L' ? 3.1 : 2.7, repeat: Infinity, ease: 'easeInOut' }}
            onPointerDown={hit(s === 'L' ? 'earL' : 'earR')}
          >
            <ellipse cx={x} cy="58" rx="27" ry="66" fill="#EEF8F1" stroke="#d7eadf" strokeWidth="2" />
            <ellipse cx={x} cy="62" rx="14" ry="48" fill="#F8B9C8" />
          </motion.g>
        );
      })}

      {/* тіло */}
      <ellipse cx="150" cy="282" rx="86" ry="74" fill="#E6F5EC" />
      <motion.ellipse
        cx="150" cy="292" rx="52" ry="50" fill="#FFFFFF"
        style={{ ...fb, transformOrigin: '50% 50%' }}
        animate={face === 'laugh' ? { scale: [1, 1.08, 0.96, 1.06, 1] } : { scale: 1 }}
        transition={{ duration: 0.6 }}
        onPointerDown={hit('belly')}
      />
      <ellipse cx="102" cy="344" rx="30" ry="15" fill="#F3FBF6" />
      <ellipse cx="198" cy="344" rx="30" ry="15" fill="#F3FBF6" />
      <ellipse cx="102" cy="346" rx="12" ry="6" fill="#F8B9C8" />
      <ellipse cx="198" cy="346" rx="12" ry="6" fill="#F8B9C8" />

      {/* голова */}
      <ellipse cx="150" cy="165" rx="98" ry="86" fill="#F3FBF6" onPointerDown={hit('head')} />

      {/* щічки */}
      <ellipse cx="92" cy="198" rx="17" ry="11" fill="#F7A8BC" opacity={face === 'happy' || face === 'laugh' ? 0.85 : 0.5} />
      <ellipse cx="208" cy="198" rx="17" ry="11" fill="#F7A8BC" opacity={face === 'happy' || face === 'laugh' ? 0.85 : 0.5} />

      {/* очі */}
      {[112, 188].map((cx) =>
        face === 'happy' || face === 'laugh' ? (
          <path key={cx} d={`M${cx - 16} 172 Q${cx} 152 ${cx + 16} 172`} stroke="#2b2340" strokeWidth="6" fill="none" strokeLinecap="round" />
        ) : eyesClosed ? (
          <path key={cx} d={`M${cx - 15} 168 Q${cx} 178 ${cx + 15} 168`} stroke="#2b2340" strokeWidth="5" fill="none" strokeLinecap="round" />
        ) : (
          <motion.g key={cx} style={{ ...fb, transformOrigin: '50% 50%' }} animate={{ scaleY: blink ? 0.08 : face === 'o' ? 1.12 : 1 }} transition={{ duration: 0.07 }}>
            <ellipse cx={cx} cy="166" rx="21" ry="25" fill="#2b2340" />
            <g transform={`translate(${look.x} ${look.y})`}>
              <circle cx={cx + 6} cy="158" r="7.5" fill="#fff" />
              <circle cx={cx - 6} cy="174" r="3.5" fill="#fff" opacity=".8" />
            </g>
          </motion.g>
        ),
      )}

      {/* носик */}
      <motion.path
        d="M141 186 Q150 180 159 186 Q150 197 141 186 Z" fill="#E8708F"
        style={{ ...fb, transformOrigin: '50% 50%' }}
        animate={{ scale: face === 'o' ? 1.25 : [1, 1.08, 1] }}
        transition={face === 'o' ? { duration: 0.2 } : { duration: 1.4, repeat: Infinity }}
        onPointerDown={hit('nose')}
      />

      {/* ротик */}
      {face !== 'sleep' && face !== 'happy' && (
        <motion.path
          key={face}
          d={MOUTH[face]}
          initial={{ opacity: 0 }}
          animate={face === 'chew' ? { opacity: 1, scaleX: [1, 0.7, 1, 0.7, 1] } : { opacity: 1 }}
          transition={face === 'chew' ? { duration: 0.6, repeat: 2 } : { duration: 0.15 }}
          style={{ ...fb, transformOrigin: '50% 50%' }}
          stroke="#7a3550" strokeWidth="4" strokeLinecap="round"
          fill={face === 'laugh' || face === 'o' ? '#c2456b' : 'none'}
        />
      )}
      {face === 'happy' && <path d="M136 203 Q150 220 164 203" stroke="#7a3550" strokeWidth="4" fill="none" strokeLinecap="round" />}
    </motion.svg>
  );
}
