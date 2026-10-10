import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { Difficulty, GameComponentProps, GameDefinition, LevelData } from '../types';
import { BOARD_DONE } from '../types';
import { sayUk } from '../shared/uk-audio';
import { TaskBubble } from '../shared/preschool';
import { useProfileStore } from '@/stores/useProfileStore';

/**
 * Майстерня (10.10.2026, варіант А): розмальовка — обрати колір, торкнутись частини малюнка.
 * Малюнки — SVG-області кодом (не картинки), тож заливка точна. Розфарбоване запамʼятовується
 * (модель «результат живе»): той самий малюнок відкривається таким, яким дитина його лишила.
 */
const PALETTE = ['#EF4444', '#F97316', '#FACC15', '#22C55E', '#3B82F6', '#A855F7', '#EC4899', '#8B5A2B', '#FFFFFF'];

interface Region { id: string; d: string }
const PICTURES: { id: string; title: string; regions: Region[] }[] = [
  {
    id: 'house', title: 'Будиночок', regions: [
      { id: 'sky', d: 'M0 0 H300 V200 H0 Z' },
      { id: 'sun', d: 'M250 50 m-28 0 a28 28 0 1 0 56 0 a28 28 0 1 0 -56 0' },
      { id: 'grass', d: 'M0 200 H300 V300 H0 Z' },
      { id: 'wall', d: 'M70 140 H230 V250 H70 Z' },
      { id: 'roof', d: 'M55 140 L150 70 L245 140 Z' },
      { id: 'door', d: 'M135 190 H170 V250 H135 Z' },
      { id: 'window', d: 'M88 160 H122 V192 H88 Z' },
      { id: 'window2', d: 'M182 160 H216 V192 H182 Z' },
    ],
  },
  {
    id: 'fish', title: 'Рибка', regions: [
      { id: 'water', d: 'M0 0 H300 V300 H0 Z' },
      { id: 'body', d: 'M60 150 Q140 70 220 150 Q140 230 60 150 Z' },
      { id: 'tail', d: 'M215 150 L275 105 L265 150 L275 195 Z' },
      { id: 'fin', d: 'M120 112 Q145 80 170 108 Z' },
      { id: 'eye', d: 'M100 140 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0' },
      { id: 'sand', d: 'M0 260 Q75 245 150 262 Q225 278 300 258 V300 H0 Z' },
    ],
  },
  {
    id: 'flower', title: 'Квіточка', regions: [
      { id: 'bg', d: 'M0 0 H300 V300 H0 Z' },
      { id: 'stem', d: 'M145 160 H155 V290 H145 Z' },
      { id: 'leaf', d: 'M155 230 Q200 200 215 240 Q180 255 155 240 Z' },
      { id: 'p1', d: 'M150 70 m-26 0 a26 34 0 1 0 52 0 a26 34 0 1 0 -52 0' },
      { id: 'p2', d: 'M200 115 m-34 0 a34 26 0 1 0 68 0 a34 26 0 1 0 -68 0' },
      { id: 'p3', d: 'M150 160 m-26 0 a26 34 0 1 0 52 0 a26 34 0 1 0 -52 0' },
      { id: 'p4', d: 'M100 115 m-34 0 a34 26 0 1 0 68 0 a34 26 0 1 0 -68 0' },
      { id: 'center', d: 'M150 115 m-24 0 a24 24 0 1 0 48 0 a24 24 0 1 0 -48 0' },
    ],
  },
];

const key = (pid: string, pic: string) => `shk.coloring.v1.${pid}.${pic}`;
interface P { board: true; pic: string }
function generate(d: Difficulty): LevelData<P, typeof BOARD_DONE> {
  const pic = PICTURES[Math.floor(Math.random() * PICTURES.length)].id;
  return { difficulty: d, rounds: [{ id: `color-${pic}-${Date.now()}`, payload: { board: true, pic }, answer: BOARD_DONE }] };
}

function Component({ round, onAnswer }: GameComponentProps<P, typeof BOARD_DONE>) {
  const profileId = useProfileStore((s) => s.activeProfile?.id) ?? 'none';
  const [picId, setPicId] = useState(round.payload.pic);
  const pic = PICTURES.find((p) => p.id === picId)!;
  const [fill, setFill] = useState<Record<string, string>>({});
  const [color, setColor] = useState(PALETTE[0]);
  useEffect(() => {
    try { setFill(JSON.parse(localStorage.getItem(key(profileId, picId)) ?? '{}')); } catch { setFill({}); }
  }, [profileId, picId]);
  useEffect(() => {
    const t = window.setTimeout(() => sayUk('color.hello', 'Обери фарбу й торкнись малюнка!'), 400);
    return () => window.clearTimeout(t);
  }, []);
  const paint = (rid: string) => {
    const next = { ...fill, [rid]: color };
    setFill(next);
    try { localStorage.setItem(key(profileId, picId), JSON.stringify(next)); } catch { /* до перезавантаження */ }
  };
  return (
    <TaskBubble text="Розмальовка" onSay={() => sayUk('color.hello', 'Обери фарбу й торкнись малюнка!')} peek={false} sceneBg="#FFF7FB">
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {PICTURES.map((p) => (
            <button key={p.id} type="button" onClick={() => setPicId(p.id)} aria-label={p.title}
              style={{ border: 0, borderRadius: 12, padding: '6px 10px', fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: 13, background: p.id === picId ? '#F08A24' : '#fff', color: p.id === picId ? '#fff' : '#8a6a4a', cursor: 'pointer' }}>
              {p.title}
            </button>
          ))}
        </div>
        <svg viewBox="0 0 300 300" style={{ width: 'min(100%, 320px)', aspectRatio: '1', background: '#fff', borderRadius: 22, boxShadow: '0 5px 0 #F1E3CF', touchAction: 'none' }}>
          {pic.regions.map((r) => (
            <path key={r.id} d={r.d} fill={fill[r.id] ?? '#FFFFFF'} stroke="#3a2a35" strokeWidth={3} strokeLinejoin="round" onClick={() => paint(r.id)} style={{ cursor: 'pointer' }} />
          ))}
        </svg>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 330 }}>
          {PALETTE.map((c) => (
            <motion.button key={c} type="button" aria-label={`Колір ${c}`} whileTap={{ scale: 0.88 }} onClick={() => setColor(c)}
              style={{ width: 40, height: 40, borderRadius: '50%', border: c === '#FFFFFF' ? '2px solid #E5D7C3' : 0, background: c, cursor: 'pointer',
                boxShadow: color === c ? `0 0 0 4px #fff, 0 0 0 7px ${c === '#FFFFFF' ? '#B9A88F' : c}` : '0 3px 0 rgba(0,0,0,.15)' }} />
          ))}
        </div>
        <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={() => onAnswer(BOARD_DONE)}
          style={{ border: 0, borderRadius: 20, padding: '10px 26px', background: '#F08A24', color: '#fff', fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: 18, boxShadow: '0 5px 0 #C2620A', cursor: 'pointer' }}>
          Готово ✓
        </motion.button>
      </div>
    </TaskBubble>
  );
}

const coloring: GameDefinition<P, typeof BOARD_DONE> = {
  id: 'coloring',
  title: 'Розмальовка',
  subject: 'life',
  levels: ['L0'],
  icon: '🖍️',
  description: 'Обери фарбу — розфарбуй малюнок.',
  accent: '#FCE7F3',
  generate,
  isCorrect: () => true,
  Component,
};

export default coloring;
