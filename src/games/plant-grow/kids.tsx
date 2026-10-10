import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Difficulty, GameComponentProps, LevelData } from '../types';
import { shuffle } from '../shared/ui';
import { sayUk } from '../shared/uk-audio';
import { SceneTask } from '../shared/count-ui';

/**
 * Дошкілля (10.10.2026): «Що потрібно квіточці?» — насінинка в горщику; тап по воді чи сонцю —
 * квіточка підростає (насінинка → паросток → соняшник), цукерка й мʼячик не допомагають — квітка хитається.
 * Було: «тапай стадії по порядку» емодзі — те саме, що «Сортування», рівень 3.
 */
const GOOD = ['pg_can', 'pg_sun'];
const BAD = ['candy', 'sf_ball'];
const STAGES = ['cyc_seed', 'cyc_sprout', 'cyc_sunflower'];
export const GROWN = 'grown';

export interface KidPlantP { kid: true; options: string[] }

export function generateKids(d: Difficulty): LevelData<KidPlantP, string> {
  return { difficulty: d, rounds: [0, 1, 2].map((i) => ({ id: `r${i}`, payload: { kid: true, options: shuffle([...GOOD, ...BAD]) }, answer: GROWN })) };
}

export function KidsPlant({ round, disabled, onAnswer, onMistake }: GameComponentProps<KidPlantP, string>) {
  const [stage, setStage] = useState(0);
  const [shake, setShake] = useState(false);
  const [drops, setDrops] = useState<{ id: number; kind: string }[]>([]);
  useEffect(() => { setStage(0); }, [round.id]);
  const say = (again?: boolean) => (again || round.id === 'r0') && sayUk('p_plant', 'Що потрібно квіточці?');
  const tap = (id: string) => {
    if (disabled || stage >= STAGES.length - 1) return;
    if (GOOD.includes(id)) {
      const d = { id: Date.now(), kind: id };
      setDrops((a) => [...a, d]);
      window.setTimeout(() => setDrops((a) => a.filter((x) => x.id !== d.id)), 900);
      const next = stage + 1;
      window.setTimeout(() => setStage(next), 450);
      if (next === STAGES.length - 1) window.setTimeout(() => onAnswer(GROWN), 1300);
    } else {
      onMistake();
      setShake(true);
      window.setTimeout(() => setShake(false), 450);
    }
  };
  return (
    <SceneTask question="Що потрібно квіточці?" say={say} sayKey={round.id} peek={false} sceneBg="linear-gradient(180deg, #EAF6FF 0%, #F3FAE8 70%, #DDEFC9 70%)">
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, position: 'relative', zIndex: 1 }}>
        {/* горщик з рослиною */}
        <div style={{ position: 'relative', width: 200, height: 230, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
          <AnimatePresence>
            {drops.map((d) => (
              <motion.span key={d.id} initial={{ y: -40, opacity: 0 }} animate={{ y: 40, opacity: [0, 1, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}
                style={{ position: 'absolute', top: 0, fontSize: 30 }}>{d.kind === 'pg_can' ? '💧' : '✨'}</motion.span>
            ))}
          </AnimatePresence>
          <motion.img key={stage} src={`/count/${STAGES[stage]}.webp`} alt="" draggable={false}
            initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1, rotate: shake ? [0, -8, 8, -4, 0] : 0 }} transition={{ type: 'spring', stiffness: 220, damping: 14 }}
            style={{ height: stage === 2 ? 170 : stage === 1 ? 110 : 70, objectFit: 'contain', marginBottom: -10, transformOrigin: '50% 100%' }} />
          <div style={{ width: 120, height: 70, background: 'linear-gradient(#E08A5A, #C2683F)', clipPath: 'polygon(0 0, 100% 0, 85% 100%, 15% 100%)', borderTop: '10px solid #F0A070' }} />
        </div>
        {/* що можна дати */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, width: '100%', maxWidth: 360 }}>
          {round.payload.options.map((id) => (
            <motion.button key={id} type="button" aria-label={id} disabled={disabled} whileTap={{ scale: 0.9 }} onClick={() => tap(id)}
              style={{ aspectRatio: '1', border: 0, borderRadius: 22, background: '#fff', boxShadow: '0 5px 0 #F1E3CF', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 6 }}>
              <img src={`/count/${id}.webp`} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </motion.button>
          ))}
        </div>
      </div>
    </SceneTask>
  );
}
