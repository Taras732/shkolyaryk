/**
 * Писанка (10.10.2026): яйце з п'ятьма поясками, на кожному — орнамент і колір. Малюється кодом (SVG),
 * тож однаково в грі «Розпиши писанку», в колекції й у хатинці друга.
 */
export const ORNAMENTS = ['solid', 'wave', 'sun', 'tree', 'dots', 'rhomb'] as const;
export type Ornament = (typeof ORNAMENTS)[number];
export interface Band { o: Ornament; c: string }
export interface Pysanka { base: string; bands: (Band | null)[] }
export const BANDS = 5;
export const emptyPysanka = (): Pysanka => ({ base: '#FFF8EE', bands: Array(BANDS).fill(null) });

const EGG = 'M100 8 C 150 8 188 90 188 160 C 188 220 150 252 100 252 C 50 252 12 220 12 160 C 12 90 50 8 100 8 Z';
const bandY = (i: number) => 20 + i * 46; // верх пояска

/** Візерунок орнаменту поверх кольору пояска: темний штрих — як віск на справжній писанці. */
function Pattern({ id, o, c, y = 0 }: { id: string; o: Ornament; c: string; /** верх пояска: плитка візерунка починається з нього */ y?: number }) {
  const ink = '#3a2026';
  return (
    <pattern id={id} y={y} width={o === 'dots' ? 16 : 24} height="46" patternUnits="userSpaceOnUse">
      <rect width="100%" height="46" fill={c} />
      {o === 'wave' && <path d="M0 23 Q6 11 12 23 T24 23" stroke={ink} strokeWidth="3.5" fill="none" />}
      {o === 'sun' && <g><circle cx="12" cy="23" r="5" fill="#FACC15" stroke={ink} strokeWidth="2" />{[0, 60, 120, 180, 240, 300].map((a) => <line key={a} x1={12 + 7 * Math.cos((a * Math.PI) / 180)} y1={23 + 7 * Math.sin((a * Math.PI) / 180)} x2={12 + 10 * Math.cos((a * Math.PI) / 180)} y2={23 + 10 * Math.sin((a * Math.PI) / 180)} stroke={ink} strokeWidth="2" />)}</g>}
      {o === 'tree' && <path d="M12 8 L20 20 H15 L21 30 H15 L19 38 H5 L9 30 H3 L9 20 H4 Z" fill="#166534" stroke={ink} strokeWidth="1.5" />}
      {o === 'dots' && <circle cx="8" cy="23" r="3.5" fill={ink} />}
      {o === 'rhomb' && <path d="M12 9 L22 23 L12 37 L2 23 Z" fill="none" stroke={ink} strokeWidth="3" />}
      <line x1="0" y1="1" x2="24" y2="1" stroke={ink} strokeWidth="2" />
    </pattern>
  );
}

export function PysankaEgg({ p, size = 200, onBand, uid = 'egg' }: { p: Pysanka; size?: number; onBand?: (i: number) => void; uid?: string }) {
  return (
    <svg viewBox="0 0 200 260" width={size} height={(size * 260) / 200} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <clipPath id={`${uid}-clip`}><path d={EGG} /></clipPath>
        {p.bands.map((b, i) => b && <Pattern key={i} id={`${uid}-p${i}`} o={b.o} c={b.c} y={bandY(i)} />)}
      </defs>
      <path d={EGG} fill={p.base} />
      <g clipPath={`url(#${uid}-clip)`}>
        {Array.from({ length: BANDS }, (_, i) => {
          const b = p.bands[i];
          return (
            <rect key={i} x="0" y={bandY(i)} width="200" height="46" fill={b ? `url(#${uid}-p${i})` : i % 2 ? '#FBEFDF' : '#FFF8EE'}
              stroke={b ? 'none' : '#E5CDA8'} strokeDasharray={b ? undefined : '6 6'} strokeWidth="2"
              onClick={onBand ? () => onBand(i) : undefined} style={{ cursor: onBand ? 'pointer' : 'default' }} />
          );
        })}
      </g>
      <path d={EGG} fill="none" stroke="#3a2026" strokeWidth="4" />
      <ellipse cx="70" cy="70" rx="14" ry="24" fill="#fff" opacity=".35" transform="rotate(-20 70 70)" pointerEvents="none" />
    </svg>
  );
}

/** Ornament-іконка для кнопки вибору. */
export function OrnamentIcon({ o, c }: { o: Ornament; c: string }) {
  return (
    <svg viewBox="0 0 48 46" width="44" height="42">
      <defs><Pattern id={`oi-${o}-${c.slice(1)}`} o={o} c={c} /></defs>
      <rect x="0" y="0" width="48" height="46" rx="10" fill={`url(#oi-${o}-${c.slice(1)})`} stroke="#3a2026" strokeWidth="2" />
    </svg>
  );
}

const key = (pid: string) => `shk.pysanky.v1.${pid}`;
export function getPysanky(pid: string): Pysanka[] { try { return JSON.parse(localStorage.getItem(key(pid)) ?? '[]'); } catch { return []; } }
export function savePysanka(pid: string, p: Pysanka) {
  try { localStorage.setItem(key(pid), JSON.stringify([...getPysanky(pid), p].slice(-12))); } catch { /* до перезавантаження */ }
}
