import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Difficulty, GameComponentProps, LevelData } from '../types';
import { shuffle } from '../shared/ui';
import { sayUk } from '../shared/uk-audio';
import { SceneTask } from '../shared/count-ui';

/**
 * Дошкілля (10.10.2026, v2 після рев'ю Тараса): «Що потрібно квіточці?» — три різні рослини
 * (соняшник, помідор, яблунька), кожна стадія намальована разом із горщиком (земля не вилазить).
 * Рівень 1: вода й сонце, 2 зайві предмети. Рівень 2: зайвих більше. Рівень 3: рослинка каже, чого бракує
 * («Мені сухо!» — вода, «Мені темно!» — сонце) — треба дати саме те.
 */
const SEED = 'pot_sunflower_1'; // насінинка в горщику — однакова для всіх: насінини 3-річна не розрізняє
const PLANTS = [
  { id: 'sunflower', stages: [SEED, 'pot_sunflower_2', 'pot_sunflower_3'] },
  { id: 'tomato', stages: [SEED, 'pot_tomato_2', 'pot_tomato_3'] },
  { id: 'apple', stages: [SEED, 'pot_apple_2', 'pot_apple_3'] },
];
const WATER = 'pg_can';
const SUN = 'pg_sun';
const BAD = ['candy', 'sf_ball', 'as_toothbrush', 'sf_key'];
export const GROWN = 'grown';

export interface KidPlantP { kid: true; plant: string; options: string[]; /** рівень 3: що просить на кожній стадії */ asks?: ('water' | 'sun')[] }

export function generateKids(d: Difficulty): LevelData<KidPlantP, string> {
  const bad = d === 1 ? 2 : 4;
  return {
    difficulty: d,
    rounds: shuffle(PLANTS).map((p, i) => ({
      id: `r${i}`,
      payload: {
        kid: true, plant: p.id,
        options: shuffle([WATER, SUN, ...shuffle(BAD).slice(0, bad)]),
        asks: d === 3 ? (shuffle(['water', 'sun']) as ('water' | 'sun')[]) : undefined,
      },
      answer: GROWN,
    })),
  };
}

const ASK = { water: { key: 'plant_dry', text: 'Мені сухо!' }, sun: { key: 'plant_dark', text: 'Мені темно!' } };

export function KidsPlant({ round, disabled, onAnswer, onMistake }: GameComponentProps<KidPlantP, string>) {
  const plant = PLANTS.find((p) => p.id === round.payload.plant)!;
  const asks = round.payload.asks;
  const [stage, setStage] = useState(0);
  const [busy, setBusy] = useState(false); // поки рослина росте, нові дотики не рахуються (повторні тапи 10.10)
  const [shake, setShake] = useState(false);
  const [fx, setFx] = useState<{ id: number; kind: string }[]>([]);
  useEffect(() => { setStage(0); }, [round.id]);
  // рівень 3: рослинка каже, чого бракує, на кожній стадії
  useEffect(() => {
    if (!asks || stage >= plant.stages.length - 1) return;
    const t = window.setTimeout(() => sayUk(ASK[asks[stage]].key, ASK[asks[stage]].text), round.id === 'r0' && stage === 0 ? 1800 : 300);
    return () => window.clearTimeout(t);
  }, [stage, asks, plant.stages.length, round.id]);
  const say = (again?: boolean) => (again || round.id === 'r0') && sayUk('p_plant', 'Що потрібно квіточці?');

  const tap = (id: string) => {
    if (disabled || busy || stage >= plant.stages.length - 1) return;
    const needed = asks ? (asks[stage] === 'water' ? WATER : SUN) : null;
    const ok = needed ? id === needed : id === WATER || id === SUN;
    if (!ok) {
      onMistake();
      setShake(true);
      window.setTimeout(() => setShake(false), 450);
      return;
    }
    const e = { id: Date.now(), kind: id };
    setFx((a) => [...a, e]);
    window.setTimeout(() => setFx((a) => a.filter((x) => x.id !== e.id)), 900);
    const next = stage + 1;
    setBusy(true);
    window.setTimeout(() => { setStage(next); setBusy(false); }, 450);
    if (next === plant.stages.length - 1) window.setTimeout(() => onAnswer(GROWN), 1500);
  };

  const h = [130, 170, 230][stage];
  return (
    <SceneTask question={asks ? ASK[asks[Math.min(stage, asks.length - 1)]].text : 'Що потрібно квіточці?'} say={say} sayKey={round.id} peek={false}
      sceneBg="linear-gradient(180deg, #EAF6FF 0%, #F3FAE8 66%, #DDEFC9 66%)">
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
        <div style={{ position: 'relative', height: 240, width: 240, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <AnimatePresence>
            {fx.map((e) => (
              <motion.span key={e.id} initial={{ y: -30, opacity: 0 }} animate={{ y: 60, opacity: [0, 1, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}
                style={{ position: 'absolute', top: 0, fontSize: 30 }}>{e.kind === WATER ? '💧💧' : '☀️'}</motion.span>
            ))}
          </AnimatePresence>
          <motion.img key={`${round.id}-${stage}`} src={`/count/${plant.stages[stage]}.webp`} alt="" draggable={false}
            initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1, rotate: shake ? [0, -6, 6, -3, 0] : 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 15 }}
            style={{ height: h, maxWidth: '100%', objectFit: 'contain', transformOrigin: '50% 100%', filter: 'drop-shadow(0 6px 4px rgba(90,60,20,.18))' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${round.payload.options.length <= 4 ? 2 : 3}, 72px)`, gap: 10, justifyContent: 'center' }}>
          {round.payload.options.map((id) => (
            <motion.button key={id} type="button" aria-label={id} disabled={disabled} whileTap={{ scale: 0.9 }} onClick={() => tap(id)}
              style={{ width: 72, height: 72, border: 0, borderRadius: 22, background: '#fff', boxShadow: '0 5px 0 #F1E3CF', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 8 }}>
              <img src={`/count/${id}.webp`} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </motion.button>
          ))}
        </div>
      </div>
    </SceneTask>
  );
}
