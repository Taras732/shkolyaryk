import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { Difficulty, GameComponentProps, GameDefinition, LevelData } from '../types';
import { BOARD_DONE } from '../types';
import { sayUk } from '../shared/uk-audio';
import { TaskBubble } from '../shared/preschool';
import { useProfileStore } from '@/stores/useProfileStore';
import { ORNAMENTS, OrnamentIcon, PysankaEgg, emptyPysanka, getPysanky, savePysanka, type Ornament, type Pysanka } from '@/pets/pysanka';
import { addSticker } from '@/pets/album';

/**
 * «Розпиши писанку» (Майстерня, 10.10.2026, вибір Тараса): обрати орнамент і колір → торкнутись пояска.
 * Готова писанка йде в колекцію друга й лежить у його хатинці (модель «результат живе»). Щоразу інша.
 */
const COLORS = ['#DC2626', '#F59E0B', '#FACC15', '#16A34A', '#2563EB', '#111827', '#FFF8EE'];

interface P { board: true }
const generate = (d: Difficulty): LevelData<P, typeof BOARD_DONE> => ({ difficulty: d, rounds: [{ id: `pys-${Date.now()}`, payload: { board: true }, answer: BOARD_DONE }] });

function Component({ onAnswer }: GameComponentProps<P, typeof BOARD_DONE>) {
  const pid = useProfileStore((s) => s.activeProfile?.id) ?? 'none';
  const [egg, setEgg] = useState<Pysanka>(emptyPysanka);
  const [o, setO] = useState<Ornament>('wave');
  const [c, setC] = useState(COLORS[0]);
  const count = getPysanky(pid).length;
  useEffect(() => {
    const t = window.setTimeout(() => sayUk('pys.hello', 'Розпишемо писанку! Обери візерунок і торкнись пояска.'), 400);
    return () => window.clearTimeout(t);
  }, []);
  const paint = (i: number) => setEgg((e) => ({ ...e, bands: e.bands.map((b, k) => (k === i ? { o, c } : b)) }));
  const filled = egg.bands.filter(Boolean).length;
  const done = () => {
    if (filled) { savePysanka(pid, egg); addSticker(pid, 'symbols', 'pysanka'); sayUk('pys.done', 'Яка гарна писанка! Покладемо в хатинку друга.'); }
    window.setTimeout(() => onAnswer(BOARD_DONE), filled ? 1600 : 0);
  };
  return (
    <TaskBubble text="Розпиши писанку" onSay={() => sayUk('pys.hello', 'Розпишемо писанку! Обери візерунок і торкнись пояска.')} peek={false} sceneBg="#FFF4E8">
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
        <motion.div animate={filled === 5 ? { rotate: [0, -4, 4, 0] } : {}} transition={{ duration: 0.8 }}>
          <PysankaEgg p={egg} size={230} onBand={paint} uid="paint" />
        </motion.div>
        <div style={{ display: 'flex', gap: 6 }}>
          {ORNAMENTS.map((x) => (
            <button key={x} type="button" aria-label={`Візерунок ${x}`} onClick={() => setO(x)}
              style={{ border: 0, padding: 3, borderRadius: 14, background: o === x ? '#F08A24' : '#fff', boxShadow: '0 3px 0 #F1E3CF', cursor: 'pointer' }}>
              <OrnamentIcon o={x} c={c} />
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {COLORS.map((x) => (
            <button key={x} type="button" aria-label={`Колір ${x}`} onClick={() => setC(x)}
              style={{ width: 36, height: 36, borderRadius: '50%', border: x === '#FFF8EE' ? '2px solid #E5D7C3' : 0, background: x, cursor: 'pointer',
                boxShadow: c === x ? `0 0 0 3px #fff, 0 0 0 6px ${x === '#FFF8EE' ? '#B9A88F' : x}` : '0 3px 0 rgba(0,0,0,.15)' }} />
          ))}
        </div>
        <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={done}
          style={{ border: 0, borderRadius: 20, padding: '10px 26px', background: '#F08A24', color: '#fff', fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: 18, boxShadow: '0 5px 0 #C2620A', cursor: 'pointer' }}>
          Готово ✓
        </motion.button>
        {count > 0 && <div style={{ fontFamily: 'var(--font-round)', fontWeight: 800, fontSize: 13, color: '#8a6a4a' }}>У кошику друга вже {count} {count === 1 ? 'писанка' : count < 5 ? 'писанки' : 'писанок'}</div>}
      </div>
    </TaskBubble>
  );
}

const pysanka: GameDefinition<P, typeof BOARD_DONE> = {
  id: 'pysanka',
  title: 'Розпиши писанку',
  subject: 'world',
  levels: ['L0'],
  icon: '🥚',
  image: '/count/sym_pysanka.webp',
  description: 'Візерунки на поясках — своя писанка.',
  accent: '#FFF4E8',
  generate,
  isCorrect: () => true,
  Component,
};

export default pysanka;
