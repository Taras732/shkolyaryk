import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';

/**
 * Рамка гри дошкілля — концепт B2 «книжка-картинка» (рішення 09.10.2026, за референсами
 * Duolingo ABC / Khan Kids): кремове тло, бліда сцена місця з картинкою, зайчик визирає з кутка,
 * варіанти — білі кружечки з кольоровою буквою, прогрес — морквинки.
 * Ігри не переписуємо: PromptCard стає завданням + сценою, ChoiceGrid — кружечками,
 * коли гра грає всередині <PreschoolProvider>.
 */
const PreschoolCtx = createContext(false);
export const usePreschool = () => useContext(PreschoolCtx);
/** Ігри-дошки (самі ведуть раунди) повідомляють шапці прогрес 0..5 — морквинки завжди в шапці. */
const BoardProgressCtx = createContext<(filled: number) => void>(() => {});
export const useBoardProgress = () => useContext(BoardProgressCtx);
export function PreschoolProvider({ children, onBoardProgress }: { children: ReactNode; onBoardProgress?: (filled: number) => void }) {
  return (
    <PreschoolCtx.Provider value>
      <BoardProgressCtx.Provider value={onBoardProgress ?? (() => {})}>{children}</BoardProgressCtx.Provider>
    </PreschoolCtx.Provider>
  );
}

/** Тло рамки — «сторінка книжки». */
export const SKY = '#FFF8EE';
/** Тінь-«підставка» під білими елементами, тон тла. */
const EDGE = '#F1E3CF';
const BIG = { fontFamily: 'var(--font-round)', fontWeight: 900 } as const;

/** Анімації рамки (підключається один раз на екран). Назва лишилась з першої версії. */
export function SkyScene() {
  return (
    <style>{`
      @keyframes pk-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
      @keyframes pk-pop { 0% { transform: scale(1) } 40% { transform: scale(1.18) } 100% { transform: scale(1.08) } }
      @keyframes pk-spark { from { transform: translate(0,0) scale(.6); opacity: 1 } to { transform: translate(var(--dx), var(--dy)) scale(1.1); opacity: 0 } }
      @keyframes pk-shake { 0%,100% { transform: translateX(0) } 25% { transform: translateX(-8px) } 75% { transform: translateX(8px) } }
      @keyframes pk-peek { 0%,100% { transform: rotate(-12deg) translateY(0) } 50% { transform: rotate(-8deg) translateY(-6px) } }
      @media (prefers-reduced-motion: reduce) { .pk-anim { animation: none !important } }
    `}</style>
  );
}

/** Кнопка 🔊 — персиковий кружечок. */
function Speaker({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label="Послухати ще раз"
      style={{ flex: 'none', width: 48, height: 48, borderRadius: '50%', border: 0, background: '#FFE7CF', fontSize: 21, cursor: 'pointer' }}>
      🔊
    </button>
  );
}

/**
 * Завдання + сцена: біла бульбашка з 🔊, під нею бліда сцена місця на всю вільну висоту
 * з картинкою (children); зайчик визирає з кутка. Без картинки — зайчик по центру «слухає».
 */
export function TaskBubble({ text, onSay, children, sceneBg = '#FFE9D2', sceneTop }: { text: string; onSay?: () => void; children?: ReactNode; sceneBg?: string; sceneTop?: ReactNode }) {
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ ...BIG, flex: 1, background: '#fff', borderRadius: 20, padding: '12px 16px', boxShadow: `0 3px 0 ${EDGE}`, fontSize: 19, lineHeight: 1.2, color: 'var(--c-ink)' }}>{text}</div>
        {onSay && <Speaker onClick={onSay} />}
      </div>
      <div style={{ flex: 1, minHeight: 150, borderRadius: 34, background: sceneBg, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
        {sceneTop && <div style={{ position: 'absolute', top: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>{sceneTop}</div>}
        {children ?? <img src="/creatures/zodiac_rabbit_wood.png" alt="" style={{ height: '70%', maxHeight: 200, objectFit: 'contain' }} />}
        {children && (
          <img src="/creatures/zodiac_rabbit_wood.png" alt="" className="pk-anim"
            style={{ position: 'absolute', right: -14, bottom: -18, width: 104, animation: 'pk-peek 3.5s ease-in-out infinite' }} />
        )}
      </div>
    </div>
  );
}

/** Біла картка під картинку в сцені. */
export function PictureCard({ children }: { children: ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 40, boxShadow: `0 8px 0 ${EDGE}`, padding: '14px 26px', display: 'grid', placeItems: 'center', minWidth: 150, minHeight: 150 }}>
      {children}
    </div>
  );
}

const INK = ['#E25B7A', '#7C3AED', '#16A34A', '#F08A24', '#2563EB', '#DB2777'];

/** Варіанти — білі кружечки з кольоровою буквою. Правильна зеленіє й підстрибує, хибна хитається. */
export function Balloons<T extends string | number>({
  options, correct, disabled, answerState, onPick, columns,
}: {
  options: { value: T; node?: ReactNode }[];
  correct: T;
  disabled: boolean;
  answerState: 'idle' | 'correct' | 'incorrect';
  onPick: (v: T) => void;
  /** Сітка в кілька рядків (ігри на кшталт «Знайди такий самий»: 6 / 9 / 12 картинок). */
  columns?: number;
}) {
  const [sel, setSel] = useState<T | null>(null);
  // новий раунд чи повтор після помилки — кружечки знову цілі
  useEffect(() => {
    if (answerState === 'idle') setSel(null);
  }, [answerState]);
  // до 5 варіантів — один ряд (що більше, то менший кружечок); більше або задані колонки — сітка
  const n = options.length;
  const grid = n > 5 || (columns !== undefined && columns < n);
  const cols = columns ?? (n > 9 ? 4 : 3);
  const d = grid ? (cols >= 4 ? 70 : 84) : n <= 3 ? 90 : n === 4 ? 74 : 60;
  const text = options.some((o) => (typeof o.node === 'string' || o.node === undefined) && String(o.node ?? o.value).length > 2);
  return (
    <div style={grid
      ? { display: 'grid', gridTemplateColumns: `repeat(${cols}, ${d}px)`, justifyContent: 'center', gap: 10, padding: '4px 0 10px' }
      : { display: 'flex', flexWrap: 'nowrap', justifyContent: 'center', gap: n <= 3 ? 14 : 8, padding: '4px 0 10px' }}>
      {options.map((o, i) => {
        const picked = sel === o.value;
        const ok = picked && answerState === 'correct';
        const wrong = picked && answerState === 'incorrect';
        const dim = answerState === 'correct' && !picked;
        const hint = answerState === 'incorrect' && o.value === correct;
        return (
          <div key={i} style={{ position: 'relative' }}>
            <motion.button
              type="button"
              disabled={disabled}
              whileTap={{ scale: 0.92 }}
              onClick={() => { if (disabled) return; setSel(o.value); onPick(o.value); }}
              style={{
                ...BIG,
                minWidth: d,
                height: d,
                padding: text ? '0 16px' : 0,
                border: 0,
                borderRadius: d,
                background: ok ? '#22C55E' : '#fff',
                color: ok ? '#fff' : INK[i % INK.length],
                fontSize: text ? 20 : Math.round(d * 0.56),
                boxShadow: `0 6px 0 ${ok ? '#15803d' : '#EED9BF'}${hint ? ', 0 0 0 4px #22C55E' : ''}`,
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
                opacity: dim ? 0.35 : 1,
                animation: ok ? 'pk-pop .45s ease-out forwards' : wrong ? 'pk-shake .4s ease' : undefined,
              }}
            >
              {o.node ?? o.value}
            </motion.button>
            {ok && ['-46px,-34px', '46px,-30px', '-36px,36px', '40px,38px', '0,-54px'].map((p, k) => {
              const [dx, dy] = p.split(',');
              return <span key={k} style={{ position: 'absolute', left: '40%', top: '36%', fontSize: 20, ['--dx' as string]: dx, ['--dy' as string]: dy, animation: 'pk-spark .6s ease-out forwards' }}>⭐</span>;
            })}
          </div>
        );
      })}
    </div>
  );
}

/** 5 морквинок прогресу (угорі гри й на екрані кінця — однаково). */
export function FiveStars({ filled, size = 22 }: { filled: number; size?: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 4, fontSize: size }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} style={{ filter: i < filled ? 'none' : 'grayscale(1)', opacity: i < filled ? 1 : 0.3, transition: 'all .3s' }}>🥕</span>
      ))}
    </div>
  );
}

/** Кнопка ✕ у шапці гри (назад у місце). */
export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label="Назад"
      style={{ width: 42, height: 42, borderRadius: 14, border: 0, background: '#fff', boxShadow: `0 3px 0 ${EDGE}`, fontSize: 18, color: '#B07A3C', cursor: 'pointer', fontWeight: 900 }}>✕</button>
  );
}
