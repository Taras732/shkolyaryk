import { useEffect, useRef, useState } from 'react';

/**
 * Доріжка злиття — спільна для «Зливаємо склади» (буква → буква) і «Склади → слово» (склад → склад).
 * Тап по картці — вона звучить; тягни ліву до правої — на зустрічі «бум», зірочки, звучить результат.
 * Злиття спрацьовує рівно раз (запобіжник arrived).
 */
const BIG = { fontFamily: 'var(--font-round)', fontWeight: 900 } as const;

export const TILE = (color: string) => ({
  ...BIG,
  minWidth: 78,
  height: 86,
  padding: '0 12px',
  borderRadius: 24,
  background: '#fff',
  color,
  fontSize: 56,
  display: 'grid',
  placeItems: 'center',
  boxShadow: '0 6px 0 #EED9BF',
  userSelect: 'none' as const,
  touchAction: 'none' as const,
});

/**
 * Доріжка: дві букви. Тап по букві — вона звучить. Тягни ліву до правої — на зустрічі
 * картки зливаються з «бум» і зірочками, і лише тоді звучить склад (рішення 09.10).
 * Злиття спрацьовує рівно раз (запобіжник arrived) — інакше звук і перехід множились.
 */
export function Track({ left, right, onTapLeft, onTapRight, onMerge }: { left: string; right: string; onTapLeft: () => void; onTapRight: () => void; onMerge: () => void }) {
  const rail = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(0);
  const [max, setMax] = useState(180);
  const [merged, setMerged] = useState(false);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x0: number; startX: number; moved: boolean } | null>(null);
  const arrived = useRef(false);

  useEffect(() => {
    const w = rail.current?.clientWidth ?? 280;
    setMax(Math.max(80, w - 86 - 86 - 8));
  }, []);

  const merge = () => {
    if (arrived.current) return;
    arrived.current = true;
    drag.current = null;
    setDragging(false);
    setX(max);
    window.setTimeout(() => setMerged(true), 120);
    onMerge();
  };

  const sparks = ['-70px,-50px', '70px,-46px', '-60px,48px', '64px,52px', '0,-74px', '0,70px'];

  return (
    <div ref={rail} style={{ width: '100%', maxWidth: 320, position: 'relative', height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {merged ? (
        <div style={{ position: 'relative' }}>
          <div style={{ ...TILE('#16A34A'), fontSize: 64, minWidth: 150, height: 96, animation: 'pk-pop .5s ease-out forwards' }}>{left + right}</div>
          {sparks.map((p, k) => {
            const [dx, dy] = p.split(',');
            return <span key={k} style={{ position: 'absolute', left: '44%', top: '36%', fontSize: 24, ['--dx' as string]: dx, ['--dy' as string]: dy, animation: 'pk-spark .7s ease-out forwards' }}>⭐</span>;
          })}
        </div>
      ) : (
        <>
          <div style={{ position: 'absolute', left: 64, right: 64, top: '50%', height: 6, marginTop: -3, borderRadius: 6, background: 'repeating-linear-gradient(90deg,#F2C79B 0 10px,transparent 10px 20px)' }} />
          <div
            onPointerDown={(e) => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); drag.current = { x0: e.clientX, startX: x, moved: false }; }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (!d) return;
              const dx = e.clientX - d.x0;
              if (Math.abs(dx) > 6) { d.moved = true; setDragging(true); }
              if (!d.moved) return;
              const nx = Math.max(0, Math.min(max, d.startX + dx));
              setX(nx);
              if (nx >= max * 0.85) merge();
            }}
            onPointerUp={() => {
              const d = drag.current;
              drag.current = null;
              setDragging(false);
              if (!d || arrived.current) return;
              if (!d.moved) onTapLeft();
              else setX(0); // не дотягнули — буква повертається
            }}
            style={{ ...TILE('#2563EB'), position: 'absolute', left: 0, transform: `translateX(${x}px) scale(${dragging ? 1.08 : 1})`, cursor: 'grab', zIndex: 2, transition: dragging ? 'none' : 'transform .25s ease' }}
          >
            {left}
          </div>
          <div onClick={onTapRight} style={{ ...TILE('#DC2626'), position: 'absolute', right: 0, cursor: 'pointer' }}>{right}</div>
          {x === 0 && !dragging && (
            <div className="pk-anim" style={{ position: 'absolute', left: 64, top: 104, fontSize: 30, animation: 'pk-float 1.4s ease-in-out infinite', pointerEvents: 'none' }}>👆</div>
          )}
        </>
      )}
    </div>
  );
}

