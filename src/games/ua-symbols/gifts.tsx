import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Difficulty, GameComponentProps, LevelData } from '../types';
import { BOARD_DONE } from '../types';
import { sayUk } from '../shared/uk-audio';
import { TaskBubble } from '../shared/preschool';
import { useProfileStore } from '@/stores/useProfileStore';
import { readLog, localDay } from '@/school/game-log';
import { addSticker } from '@/pets/album';
import { PysankaEgg, getPysanky } from '@/pets/pysanka';
import { HUT_SLOTS, getHut } from './hut';
import { KID_SYMBOLS } from './index';

/**
 * «Хатинка друга: Україна» v2 (10.10.2026, вибір Тараса — варіант Б): не тест, а подарунки.
 * Символи приходять за дні занять (прапор — з першого дня, далі соняшник, вишиванка, калина, соловейко),
 * писанка — та, яку дитина сама розписала в Майстерні. Новий подарунок: коробка → символ + розповідь →
 * дитина ставить його на місце, що світиться. Розставлене — тап, і друг розповідає ще раз.
 */
const GIFT_DAYS: [string, number][] = [['flag', 1], ['sunflower', 2], ['vyshyvanka', 3], ['kalyna', 4], ['nightingale', 5]];
const key = (pid: string) => `shk.hut.v1.${pid}`;

export interface GiftsP { kid: true; gifts: true }
export const generateGifts = (d: Difficulty): LevelData<GiftsP, typeof BOARD_DONE> =>
  ({ difficulty: d, rounds: [{ id: `gifts-${Date.now()}`, payload: { kid: true, gifts: true }, answer: BOARD_DONE }] });

export function GiftsBoard({ onAnswer }: GameComponentProps<GiftsP, typeof BOARD_DONE>) {
  const pid = useProfileStore((s) => s.activeProfile?.id) ?? 'none';
  const days = useMemo(() => new Set(readLog(pid).map((e) => localDay(e.at))).size, [pid]);
  const eggs = useMemo(() => getPysanky(pid), [pid]);
  const [placed, setPlaced] = useState<string[]>(() => getHut(pid).filter((x) => x !== 'pysanka'));
  const earned = [...GIFT_DAYS.filter(([, d]) => days >= d).map(([id]) => id)];
  const next = earned.find((id) => !placed.includes(id)) ?? null;
  const [stage, setStage] = useState<'box' | 'show' | 'place' | 'idle'>(next ? 'box' : 'idle');
  const nextDay = GIFT_DAYS.find(([id]) => !earned.includes(id));

  useEffect(() => {
    const t = window.setTimeout(() => (next
      ? sayUk('gift.hello', 'Тобі подарунок! Відкрий коробку.')
      : sayUk('gift.none', 'Подивись, яка в нас гарна хатинка! Новий подарунок — після наступних занять.')), 400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = () => { if (!next) return; setStage('show'); sayUk(`hut.fact_${next}`, HUT_SLOTS[next].fact); window.setTimeout(() => setStage('place'), 2600); };
  const place = (id: string) => {
    if (stage === 'place' && id === next) {
      const np = [...placed, id];
      setPlaced(np);
      try { localStorage.setItem(key(pid), JSON.stringify(np)); } catch { /* до перезавантаження */ }
      addSticker(pid, 'symbols', id);
      sayUk('gift.placed', 'Як гарно стало!');
      setStage(np.length < earned.length ? 'box' : 'idle');
      return;
    }
    if (placed.includes(id)) sayUk(`hut.fact_${id}`, HUT_SLOTS[id].fact);
  };
  const sym = (id: string) => KID_SYMBOLS.find((s) => s.id === id)!;
  const draw = (id: string, w: number) => (id === 'pysanka' && eggs.length
    ? <PysankaEgg p={eggs[eggs.length - 1]} size={w * 0.7} uid="hut-egg" />
    : sym(id).node ? <div style={{ transform: `scale(${w / 80})` }}>{sym(id).node}</div> : <img src={sym(id).img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />);

  return (
    <TaskBubble text="Хатинка друга" onSay={() => sayUk('gift.none', 'Подивись, яка в нас гарна хатинка! Новий подарунок — після наступних занять.')} peek={false} sceneBg="#FFF6EA">
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
        <svg viewBox="0 0 360 290" style={{ width: '100%', maxWidth: 400, borderRadius: 22, background: '#FDF1DC', boxShadow: '0 5px 0 #F1E3CF' }}>
          <rect x="0" y="222" width="360" height="68" fill="#D9A86C" />
          <rect x="30" y="58" width="90" height="84" rx="6" fill="#BFE6FF" stroke="#8B5A2B" strokeWidth="6" />
          <line x1="75" y1="58" x2="75" y2="142" stroke="#8B5A2B" strokeWidth="4" /><line x1="30" y1="100" x2="120" y2="100" stroke="#8B5A2B" strokeWidth="4" />
          <rect x="22" y="142" width="106" height="10" rx="3" fill="#A86E33" />
          <rect x="270" y="108" width="62" height="114" rx="6" fill="#B07A3C" stroke="#7A4E22" strokeWidth="4" /><circle cx="320" cy="168" r="4" fill="#F5D07A" />
          <circle cx="190" cy="60" r="5" fill="#7A4E22" />
          <rect x="140" y="200" width="110" height="12" rx="4" fill="#A86E33" />
          <path d="M156 200 Q150 180 160 172 L176 172 Q186 180 180 200 Z" fill="#7DB7E8" stroke="#3A7BB8" strokeWidth="3" />
          {Object.entries(HUT_SLOTS).map(([id, s]) => {
            const on = placed.includes(id) || (id === 'pysanka' && eggs.length > 0);
            const target = stage === 'place' && id === next;
            if (!on) return (
              <motion.circle key={id} cx={s.x} cy={s.y} r={s.w / 3} fill={target ? 'rgba(250,204,21,.35)' : 'none'} stroke={target ? '#F59E0B' : '#E0B57C'} strokeWidth={target ? 5 : 3} strokeDasharray="5 5"
                animate={target ? { r: [s.w / 3, s.w / 2.4, s.w / 3] } : {}} transition={{ duration: 1, repeat: Infinity }}
                onClick={() => place(id)} style={{ cursor: target ? 'pointer' : 'default' }} />
            );
            return (
              <foreignObject key={id} x={s.x - s.w / 2} y={s.y - s.w / 2} width={s.w} height={s.w} onClick={() => place(id)} style={{ cursor: 'pointer' }}>
                <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>{draw(id, s.w)}</div>
              </foreignObject>
            );
          })}
        </svg>

        <AnimatePresence mode="wait">
          {stage === 'box' && (
            <motion.button key="box" type="button" aria-label="Подарунок" onClick={open} initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, -6, 6, -4, 0] }} exit={{ scale: 0 }}
              transition={{ rotate: { duration: 1.2, repeat: Infinity } }}
              style={{ border: 0, background: 'transparent', fontSize: 84, cursor: 'pointer', lineHeight: 1 }}>🎁</motion.button>
          )}
          {(stage === 'show' || stage === 'place') && next && (
            <motion.div key="show" initial={{ scale: 0.3, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 14 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 110, height: 110, background: '#fff', borderRadius: 26, display: 'grid', placeItems: 'center', boxShadow: '0 6px 0 #F1E3CF', padding: 10 }}>{draw(next, 90)}</div>
              <div style={{ fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: 15, color: '#8a6a4a', textAlign: 'center', maxWidth: 300 }}>
                {stage === 'show' ? HUT_SLOTS[next].fact : 'Торкнись місця, що світиться!'}
              </div>
            </motion.div>
          )}
          {stage === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontFamily: 'var(--font-round)', fontWeight: 800, fontSize: 14, color: '#8a6a4a', textAlign: 'center', maxWidth: 300 }}>
              {nextDay ? 'Новий подарунок — після наступних занять. Торкнись будь-чого в хатинці — друг розкаже.' : 'Хатинка зовсім українська! Торкнись будь-чого — друг розкаже.'}
              {!eggs.length && <div style={{ marginTop: 6 }}>А писанку можна розписати в Майстерні 🥚</div>}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={() => onAnswer(BOARD_DONE)}
          style={{ border: 0, borderRadius: 20, padding: '10px 26px', background: '#F08A24', color: '#fff', fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: 18, boxShadow: '0 5px 0 #C2620A', cursor: 'pointer' }}>
          Готово ✓
        </motion.button>
      </div>
    </TaskBubble>
  );
}
