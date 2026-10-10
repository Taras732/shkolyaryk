import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { Difficulty, GameComponentProps, LevelData } from '../types';
import { shuffle } from '../shared/ui';
import { sayUk } from '../shared/uk-audio';
import { TaskBubble } from '../shared/preschool';
import { useProfileStore } from '@/stores/useProfileStore';
import { addSticker } from '@/pets/album';
import { KID_SYMBOLS } from './index';

/**
 * «Прикрась хатинку друга» (10.10.2026, вибір Тараса, варіант А): друг просить «Повісь вишиванку!» —
 * дитина обирає символ із трьох, він летить на своє місце в хатинці й там лишається (модель «результат живе»).
 * Після кожного — коротке речення про символ. Кімната намальована кодом, тож місця точні.
 */
const SLOTS: Record<string, { x: number; y: number; w: number; ask: string; fact: string }> = {
  flag: { x: 300, y: 82, w: 58, ask: 'Повісь прапор над дверима!', fact: 'Прапор України — синій, як небо, і жовтий, як пшениця.' },
  vyshyvanka: { x: 190, y: 98, w: 74, ask: 'Повісь вишиванку на гачок!', fact: 'Вишиванка — сорочка з вишитим візерунком.' },
  kalyna: { x: 168, y: 178, w: 50, ask: 'Постав калину у вазу!', fact: 'Калина — червона ягідка, символ України.' },
  sunflower: { x: 75, y: 150, w: 48, ask: 'Постав соняшник на підвіконня!', fact: 'Соняшник завжди тягнеться до сонечка.' },
  pysanka: { x: 228, y: 190, w: 34, ask: 'Поклади писанку на стіл!', fact: 'Писанка — розписане яєчко на Великдень.' },
  nightingale: { x: 75, y: 100, w: 44, ask: 'Поклич соловейка у віконце!', fact: 'Соловейко співає найкрасивіше.' },
};
const key = (pid: string) => `shk.hut.v1.${pid}`;
export const getHut = (pid: string): string[] => { try { return JSON.parse(localStorage.getItem(key(pid)) ?? '[]'); } catch { return []; } };

export interface HutP { kid: true; hut: true; target: string; options: string[] }

export function generateHut(d: Difficulty, placed: string[]): LevelData<HutP, string> {
  const ids = KID_SYMBOLS.map((s) => s.id);
  const todo = shuffle(ids.filter((i) => !placed.includes(i)));
  const targets = (todo.length ? todo : shuffle(ids)).slice(0, d === 1 ? 2 : 3);
  const n = d === 1 ? 2 : 3;
  return {
    difficulty: d,
    rounds: targets.map((t, i) => ({ id: `r${i}`, payload: { kid: true, hut: true, target: t, options: shuffle([t, ...shuffle(ids.filter((x) => x !== t)).slice(0, n - 1)]) }, answer: t })),
  };
}

function Room({ placed, flying }: { placed: string[]; flying: string | null }) {
  const node = (id: string) => KID_SYMBOLS.find((s) => s.id === id)!;
  return (
    <svg viewBox="0 0 360 290" style={{ width: '100%', maxWidth: 380, borderRadius: 22, background: '#FDF1DC', boxShadow: '0 5px 0 #F1E3CF' }}>
      <rect x="0" y="222" width="360" height="68" fill="#D9A86C" />
      {[0, 1, 2, 3, 4, 5].map((k) => <line key={k} x1={k * 72} y1="222" x2={k * 72 - 20} y2="290" stroke="#C89458" strokeWidth="3" />)}
      {/* вікно з підвіконням */}
      <rect x="30" y="58" width="90" height="84" rx="6" fill="#BFE6FF" stroke="#8B5A2B" strokeWidth="6" />
      <line x1="75" y1="58" x2="75" y2="142" stroke="#8B5A2B" strokeWidth="4" />
      <line x1="30" y1="100" x2="120" y2="100" stroke="#8B5A2B" strokeWidth="4" />
      <rect x="22" y="142" width="106" height="10" rx="3" fill="#A86E33" />
      {/* двері */}
      <rect x="270" y="108" width="62" height="114" rx="6" fill="#B07A3C" stroke="#7A4E22" strokeWidth="4" />
      <circle cx="320" cy="168" r="4" fill="#F5D07A" />
      {/* гачок для вишиванки */}
      <circle cx="190" cy="60" r="5" fill="#7A4E22" />
      {/* стіл і ваза */}
      <rect x="140" y="200" width="110" height="12" rx="4" fill="#A86E33" />
      <rect x="150" y="212" width="8" height="12" fill="#8B5A2B" /><rect x="232" y="212" width="8" height="12" fill="#8B5A2B" />
      <path d="M156 200 Q150 180 160 172 L176 172 Q186 180 180 200 Z" fill="#7DB7E8" stroke="#3A7BB8" strokeWidth="3" />
      {/* розставлені символи */}
      {Object.entries(SLOTS).map(([id, s]) => {
        const on = placed.includes(id) || flying === id;
        if (!on) return <circle key={id} cx={s.x} cy={s.y} r={s.w / 3} fill="none" stroke="#E0B57C" strokeWidth="3" strokeDasharray="5 5" />;
        const it = node(id);
        return (
          <motion.foreignObject key={id} x={s.x - s.w / 2} y={s.y - s.w / 2} width={s.w} height={s.w}
            initial={flying === id ? { opacity: 0, scale: 0.2 } : false} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 14 }}
            style={{ transformOrigin: `${s.x}px ${s.y}px` }}>
            <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
              {it.node ? <div style={{ transform: `scale(${s.w / 80})` }}>{it.node}</div> : <img src={it.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
            </div>
          </motion.foreignObject>
        );
      })}
    </svg>
  );
}

export function HutBoard({ round, disabled, answerState, onAnswer }: GameComponentProps<HutP, string>) {
  const pid = useProfileStore((s) => s.activeProfile?.id) ?? 'none';
  const [placed, setPlaced] = useState(() => getHut(pid));
  const [flying, setFlying] = useState<string | null>(null);
  const t = SLOTS[round.payload.target];
  useEffect(() => { setFlying(null); setPlaced(getHut(pid)); }, [round.id, pid]);
  useEffect(() => {
    const tm = window.setTimeout(() => sayUk(`hut.ask_${round.payload.target}`, t.ask), round.id === 'r0' ? 400 : 200);
    return () => window.clearTimeout(tm);
  }, [round.id, round.payload.target, t.ask]);
  const pick = (id: string) => {
    if (disabled) return;
    if (id === round.answer) {
      setFlying(id);
      const next = placed.includes(id) ? placed : [...placed, id];
      try { localStorage.setItem(key(pid), JSON.stringify(next)); } catch { /* до перезавантаження */ }
      addSticker(pid, 'symbols', id);
      window.setTimeout(() => sayUk(`hut.fact_${id}`, t.fact), 300);
    }
    onAnswer(id);
  };
  return (
    <TaskBubble text={t.ask} onSay={() => sayUk(`hut.ask_${round.payload.target}`, t.ask)} peek={false} sceneBg="#FFF6EA">
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
        <Room placed={placed} flying={flying} />
        <div style={{ display: 'flex', gap: 12 }}>
          {round.payload.options.map((id) => {
            const it = KID_SYMBOLS.find((s) => s.id === id)!;
            const right = answerState === 'correct' && id === round.answer;
            return (
              <motion.button key={id} type="button" aria-label={it.say} disabled={disabled} whileTap={{ scale: 0.92 }} onClick={() => pick(id)}
                style={{ width: 92, height: 92, border: 0, borderRadius: 24, background: right ? '#DCF7E3' : '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer', padding: 8,
                  boxShadow: right ? '0 0 0 5px #22C55E, 0 6px 0 #9FDDB0' : '0 6px 0 #F1E3CF' }}>
                {it.node ?? <img src={it.img} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
              </motion.button>
            );
          })}
        </div>
      </div>
    </TaskBubble>
  );
}

export const HUT_SLOTS = SLOTS;
