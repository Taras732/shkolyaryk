import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';

/**
 * Рамка гри дошкілля, варіант B «Кульки в небі» (рішення 09.10.2026, 2.5D скрізь).
 * Ігри не переписуємо: PromptCard стає бульбашкою зайчика, ChoiceGrid — кульками,
 * коли гра грає всередині <PreschoolProvider>.
 */
const PreschoolCtx = createContext(false);
export const usePreschool = () => useContext(PreschoolCtx);
export function PreschoolProvider({ children }: { children: ReactNode }) {
  return <PreschoolCtx.Provider value>{children}</PreschoolCtx.Provider>;
}

export const SKY = 'linear-gradient(180deg, #BFE3FF 0%, #E3F1FF 55%, #FFF4E8 100%)';
const BIG = { fontFamily: 'var(--font-round)', fontWeight: 900 } as const;

/** Небо: хмарки пливуть, внизу пагорб. Лежить під грою. */
export function SkyScene() {
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <style>{`
        @keyframes pk-drift { from { transform: translateX(-24px) } to { transform: translateX(24px) } }
        @keyframes pk-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-12px) } }
        @keyframes pk-pop { 0% { transform: scale(1); opacity: 1 } 60% { transform: scale(1.35); opacity: .8 } 100% { transform: scale(1.6); opacity: 0 } }
        @keyframes pk-spark { from { transform: translate(0,0) scale(.6); opacity: 1 } to { transform: translate(var(--dx), var(--dy)) scale(1.1); opacity: 0 } }
        @keyframes pk-shake { 0%,100% { transform: translateX(0) } 25% { transform: translateX(-8px) } 75% { transform: translateX(8px) } }
        @media (prefers-reduced-motion: reduce) { .pk-anim { animation: none !important } }
      `}</style>
      {[[16, 104, 1, 0], [200, 176, 0.8, -3], [120, 46, 0.6, -6]].map(([x, y, k, d], i) => (
        <svg key={i} className="pk-anim" viewBox="0 0 120 64" width={120 * k} height={64 * k}
          style={{ position: 'absolute', left: x, top: y, animation: `pk-drift ${9 + i * 3}s ease-in-out ${d}s infinite alternate`, filter: 'drop-shadow(0 4px 6px rgba(80,120,180,.18))' }}>
          {/* пухнаста хмаринка: кілька кругів і плаский низ, легка тінь знизу */}
          <g fill="#fff">
            <circle cx="34" cy="38" r="20" /><circle cx="58" cy="28" r="24" /><circle cx="84" cy="36" r="18" /><circle cx="100" cy="44" r="12" />
            <rect x="18" y="40" width="92" height="18" rx="9" />
          </g>
          <path d="M22 54 Q60 62 106 54" stroke="#DCEBFA" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      ))}
      <div style={{ position: 'absolute', left: -30, right: -30, bottom: -40, height: 150, borderRadius: '50% 50% 0 0', background: '#BDE8C6' }} />
      <div style={{ position: 'absolute', left: -60, right: 40, bottom: -70, height: 130, borderRadius: '50% 50% 0 0', background: '#A9E2B4' }} />
    </div>
  );
}

/** Завдання — бульбашка зайчика з маленькою 🔊 усередині. */
export function TaskBubble({ text, onSay, children }: { text: string; onSay?: () => void; children?: ReactNode }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
        <img src="/creatures/zodiac_rabbit_wood.png" alt="" style={{ width: 78, flex: 'none' }} />
        <div style={{ ...BIG, flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: '22px 22px 22px 6px', padding: '12px 12px 12px 16px', boxShadow: 'var(--c-shadow)', fontSize: 19, lineHeight: 1.2, color: 'var(--c-ink)' }}>
          <span style={{ flex: 1 }}>{text}</span>
          {onSay && (
            <button type="button" onClick={onSay} aria-label="Послухати ще раз"
              style={{ flex: 'none', width: 42, height: 42, borderRadius: '50%', border: 0, background: 'var(--c-primary-soft)', fontSize: 19, cursor: 'pointer' }}>
              🔊
            </button>
          )}
        </div>
      </div>
      {children && <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>{children}</div>}
    </div>
  );
}

const BALLOON = ['#FF8FA3', '#8CC8FF', '#8EDB9E', '#FFC36B', '#B79CFF', '#FF9E7A'];

/** Варіанти — кульки, що погойдуються. Правильна лопає зірочками, хибна хитається. */
export function Balloons<T extends string | number>({
  options, correct, disabled, answerState, onPick,
}: {
  options: { value: T; node?: ReactNode }[];
  correct: T;
  disabled: boolean;
  answerState: 'idle' | 'correct' | 'incorrect';
  onPick: (v: T) => void;
}) {
  const [sel, setSel] = useState<T | null>(null);
  // новий раунд чи повтор після помилки — кульки знову цілі
  useEffect(() => {
    if (answerState === 'idle') setSel(null);
  }, [answerState]);
  const wide = options.some((o) => String(o.node ?? o.value).length > 3 && (typeof o.node === 'string' || o.node === undefined));
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start', gap: '28px 14px', padding: '12px 4px 36px' }}>
      {options.map((o, i) => {
        const picked = sel === o.value;
        const popped = picked && answerState === 'correct';
        const wrong = picked && answerState === 'incorrect';
        const dim = answerState === 'correct' && !picked;
        const hint = answerState === 'incorrect' && o.value === correct;
        return (
          <div key={i} style={{ position: 'relative', animation: `pk-float 3s ease-in-out ${-i * 0.9}s infinite` }} className="pk-anim">
            <motion.button
              type="button"
              disabled={disabled}
              whileTap={{ scale: 0.92 }}
              onClick={() => { if (disabled) return; setSel(o.value); onPick(o.value); }}
              style={{
                ...BIG,
                position: 'relative',
                minWidth: wide ? 128 : 108,
                height: 126,
                padding: '0 14px',
                border: 0,
                borderRadius: wide ? 56 : '50% 50% 48% 48%',
                background: BALLOON[i % BALLOON.length],
                color: '#fff',
                fontSize: wide ? 26 : 52,
                textShadow: '0 2px 0 rgba(0,0,0,.15)',
                boxShadow: `inset -10px -12px 0 rgba(0,0,0,.08), inset 10px 10px 0 rgba(255,255,255,.25)${hint ? ', 0 0 0 4px #fff' : ''}`,
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
                opacity: dim ? 0.35 : 1,
                animation: popped ? 'pk-pop .5s ease-out forwards' : wrong ? 'pk-shake .4s ease' : undefined,
              }}
            >
              {o.node ?? o.value}
            </motion.button>
            {/* ниточка */}
            <div style={{ position: 'absolute', left: '50%', top: 126, width: 2, height: 38, background: 'rgba(31,33,56,.22)', opacity: popped ? 0 : 1 }} />
            {popped && ['-50px,-40px', '50px,-36px', '-40px,40px', '44px,44px', '0,-60px'].map((d, k) => {
              const [dx, dy] = d.split(',');
              return <span key={k} style={{ position: 'absolute', left: '42%', top: '38%', fontSize: 22, ['--dx' as string]: dx, ['--dy' as string]: dy, animation: 'pk-spark .6s ease-out forwards' }}>⭐</span>;
            })}
          </div>
        );
      })}
    </div>
  );
}

/** 5 зірочок прогресу (угорі гри й на екрані кінця — однаково). */
export function FiveStars({ filled, size = 22 }: { filled: number; size?: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 4, fontSize: size }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} style={{ filter: i < filled ? 'none' : 'grayscale(1)', opacity: i < filled ? 1 : 0.28, transition: 'all .3s' }}>⭐</span>
      ))}
    </div>
  );
}
