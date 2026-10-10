import { motion } from 'motion/react';
import type { Pet } from './pets';

/**
 * Кошик під ковдрочкою (концепція v2, 10.10.2026): малюк спить, з-під ковдрочки визирає лише верх —
 * вушка, ріжки, гребінь. Без pet — порожня горбочка під ковдрою («хтось тут спить»).
 * Ковдрочка дихає; над кошиком пливуть «з-з-з».
 */
export default function SleepyBasket({ pet, size = 120, glow = false }: { pet?: Pet; size?: number; glow?: boolean }) {
  const line = 0.56; // верхній край ковдрочки — частка висоти кошика
  const imgW = size * 1.3; // звір більший за кошик: з-під ковдрочки має визирати впізнавана маківка
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      {glow && (
        <motion.div animate={{ opacity: [0.35, 0.8, 0.35], scale: [0.95, 1.06, 0.95] }} transition={{ duration: 2.2, repeat: Infinity }}
          style={{ position: 'absolute', inset: '-8%', borderRadius: '50%', background: 'radial-gradient(circle, #FFE7A3 0%, rgba(255,231,163,0) 70%)' }} />
      )}
      {pet && (
        // рамка кошика обрізає низ ілюстрації; сяйво й «з-з-з» лишаються зовні
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <img src={pet.full} alt="" draggable={false}
            style={{ position: 'absolute', left: (size - imgW) / 2, top: size * line - pet.peek * imgW, width: imgW, height: imgW, objectFit: 'contain' }} />
        </div>
      )}
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
        <defs>
          <pattern id="sb-dots" width="9" height="9" patternUnits="userSpaceOnUse">
            <circle cx="4.5" cy="4.5" r="1.3" fill="#fff" opacity=".7" />
          </pattern>
        </defs>
        {/* ковдрочка: дихає */}
        <motion.g animate={{ scaleY: [1, 1.035, 1] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }} style={{ transformOrigin: '50% 80%' }}>
          <path d={`M6 ${line * 100 + 6} Q 18 ${line * 100 - (pet ? 4 : 16)} 50 ${line * 100 - (pet ? 2 : 20)} Q 82 ${line * 100 - (pet ? 4 : 16)} 94 ${line * 100 + 6} L 94 80 L 6 80 Z`} fill="#F7A9C4" />
          <path d={`M6 ${line * 100 + 6} Q 18 ${line * 100 - (pet ? 4 : 16)} 50 ${line * 100 - (pet ? 2 : 20)} Q 82 ${line * 100 - (pet ? 4 : 16)} 94 ${line * 100 + 6} L 94 80 L 6 80 Z`} fill="url(#sb-dots)" />
          <path d={`M10 ${line * 100 + 8} Q 50 ${line * 100 + (pet ? 2 : -10)} 90 ${line * 100 + 8}`} stroke="#E57FA5" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </motion.g>
        {/* кошик */}
        <path d="M4 72 L96 72 L88 97 Q50 101 12 97 Z" fill="#C98A4B" />
        {[18, 32, 46, 60, 74].map((x) => <path key={x} d={`M${x} 73 L${x + 4} 97`} stroke="#A86E33" strokeWidth="2" />)}
        <path d="M8 81 Q50 86 92 81" stroke="#A86E33" strokeWidth="2" fill="none" />
        <path d="M10 89 Q50 94 90 89" stroke="#A86E33" strokeWidth="2" fill="none" />
        <rect x="2" y="68" width="96" height="8" rx="4" fill="#DDA163" />
      </svg>
      {/* з-з-з */}
      {[0, 1].map((k) => (
        <motion.span key={k} animate={{ opacity: [0, 1, 0], y: [-2, -24], x: [0, 8] }} transition={{ duration: 2.4, repeat: Infinity, delay: k * 1.2 }}
          style={{ position: 'absolute', right: '8%', top: '18%', fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: size * 0.13, color: '#8C7BD6', pointerEvents: 'none' }}>
          z
        </motion.span>
      ))}
    </div>
  );
}
