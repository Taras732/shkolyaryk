import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Difficulty, GameComponentProps, LevelData } from '../types';
import { BOARD_DONE } from '../types';
import { sayUk } from '../shared/uk-audio';
import { TaskBubble } from '../shared/preschool';
import { useProfileStore } from '@/stores/useProfileStore';
import { readLog, localDay } from '@/school/game-log';
import { resolvePlan } from '@/school/plan-resolve';
import { tummyToday } from '@/pets/food';
import { RIPE, SEEDS, care, harvest, loadGarden, plant, saveGarden, unlockedSeeds, waterLeft, type Garden, type SeedId } from '@/pets/garden';

/**
 * «Город друга» (10.10.2026, модель «результат живе»): замість «Що потрібно квіточці?» на один раз.
 * Три горщики; посадити → раз на день полити й дати сонця → підростає; на сходинці 2 — урожай у комору друга.
 * Вода — 1 щодня + по одній за крок «На сьогодні». Ріст не прискорити тапами — привід прийти завтра.
 */
export interface GardenP { kid: true; garden: true }
export const generateGarden = (d: Difficulty): LevelData<GardenP, typeof BOARD_DONE> =>
  ({ difficulty: d, rounds: [{ id: `garden-${Date.now()}`, payload: { kid: true, garden: true }, answer: BOARD_DONE }] });

export function GardenBoard({ onAnswer }: GameComponentProps<GardenP, typeof BOARD_DONE>) {
  const profile = useProfileStore((s) => s.activeProfile)!;
  const { planDone, days } = useMemo(() => {
    const log = readLog(profile.id);
    return { planDone: tummyToday(log, resolvePlan(profile).slice(0, 3).map((s) => s.gameId)), days: new Set(log.map((e) => localDay(e.at))).size };
  }, [profile]);
  const [g, setG] = useState<Garden>(() => loadGarden(profile.id));
  const [choosing, setChoosing] = useState<number | null>(null);
  const [fx, setFx] = useState<{ id: number; pot: number; kind: string }[]>([]);
  const today = localDay(Date.now());
  const water = waterLeft(g, planDone);
  const seeds = unlockedSeeds(days);

  useEffect(() => {
    const t = window.setTimeout(() => sayUk('garden.hello', 'Посади насінинку, полий і дай сонечка. Завтра підросте!'), 400);
    return () => window.clearTimeout(t);
  }, []);
  const update = (ng: Garden) => { setG(ng); saveGarden(profile.id, ng); };
  const burst = (pot: number, kind: string) => {
    const e = { id: Date.now() + Math.random(), pot, kind };
    setFx((a) => [...a, e]);
    window.setTimeout(() => setFx((a) => a.filter((x) => x.id !== e.id)), 900);
  };

  const doCare = (i: number, kind: 'water' | 'sun') => {
    const r = care(g, i, kind, planDone);
    if (!r.ok) {
      if (kind === 'water' && water === 0) sayUk('garden.nowater', 'Водичка закінчилась. Пограй у «На сьогодні» — і буде ще!');
      return;
    }
    burst(i, kind);
    update(r.garden);
    if (r.grew) window.setTimeout(() => sayUk('garden.grew', 'Ура, підросло! Завтра — ще більше!'), 500);
  };
  const doHarvest = (i: number) => {
    burst(i, 'harvest');
    update(harvest(g, i));
    sayUk('garden.harvest', 'Урожай! Віднесемо другу в кошик.');
  };

  return (
    <TaskBubble text="Город друга" onSay={() => sayUk('garden.hello', 'Посади насінинку, полий і дай сонечка. Завтра підросте!')} peek={false}
      sceneBg="linear-gradient(180deg, #EAF6FF 0%, #F3FAE8 62%, #CFE8B8 62%, #BFDDA5 100%)">
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: 8, fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: 16 }}>
          <span style={{ background: '#fff', borderRadius: 99, padding: '5px 12px', boxShadow: '0 3px 0 #F1E3CF' }}>💧 {water}</span>
          {g.pantry.length > 0 && <span style={{ background: '#fff', borderRadius: 99, padding: '5px 12px', boxShadow: '0 3px 0 #F1E3CF' }}>🧺 {g.pantry.length}</span>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', justifyContent: 'center', width: '100%' }}>
          {g.pots.map((p, i) => {
            const seed = SEEDS.find((s) => s.id === p.seed);
            const ripe = !!seed && p.grown >= RIPE;
            const cared = p.caredDay === today;
            return (
              <div key={i} style={{ position: 'relative', width: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <AnimatePresence>
                  {fx.filter((e) => e.pot === i).map((e) => (
                    <motion.span key={e.id} initial={{ y: -10, opacity: 0 }} animate={{ y: e.kind === 'harvest' ? -60 : 50, opacity: [0, 1, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}
                      style={{ position: 'absolute', top: 0, fontSize: 26, zIndex: 2 }}>{e.kind === 'water' ? '💧💧' : e.kind === 'sun' ? '☀️' : '🧺'}</motion.span>
                  ))}
                </AnimatePresence>
                <motion.button type="button" aria-label={seed ? (ripe ? 'Зібрати урожай' : seed.name) : 'Посадити'} whileTap={{ scale: 0.95 }}
                  onClick={() => (!seed ? setChoosing(i) : ripe ? doHarvest(i) : undefined)}
                  animate={ripe ? { y: [0, -6, 0] } : { y: 0 }} transition={ripe ? { duration: 1.2, repeat: Infinity } : undefined}
                  style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', height: 170, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                    filter: ripe ? 'drop-shadow(0 0 10px #FACC15)' : undefined }}>
                  {seed
                    ? <img src={`/count/${seed.stages[Math.min(p.grown, RIPE)]}.webp`} alt="" draggable={false} style={{ height: [90, 125, 165][Math.min(p.grown, RIPE)], maxWidth: 108, objectFit: 'contain' }} />
                    : <div style={{ width: 92, height: 92, borderRadius: 24, border: '3px dashed #B9A88F', display: 'grid', placeItems: 'center', fontSize: 40, color: '#B9A88F', background: 'rgba(255,255,255,.6)' }}>＋</div>}
                </motion.button>
                {/* догляд: двічі на день не росте; дозріле — тапни горщик */}
                {seed && !ripe && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <CareBtn label="Полити" done={p.watered === today || cared} off={water === 0} onClick={() => doCare(i, 'water')}>💧</CareBtn>
                    <CareBtn label="Дати сонечка" done={p.sunned === today || cared} onClick={() => doCare(i, 'sun')}>☀️</CareBtn>
                  </div>
                )}
                {ripe && <div style={{ fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: 12, color: '#B07A3C' }}>Зібрати!</div>}
                {cared && !ripe && <div style={{ fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: 11, color: '#6FBF88' }}>завтра підросте</div>}
              </div>
            );
          })}
        </div>
        <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={() => onAnswer(BOARD_DONE)}
          style={{ border: 0, borderRadius: 20, padding: '12px 26px', background: '#F08A24', color: '#fff', fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: 18, boxShadow: '0 5px 0 #C2620A', cursor: 'pointer' }}>
          Готово ✓
        </motion.button>
      </div>
      {choosing !== null && (
        <div onClick={() => setChoosing(null)} style={{ position: 'absolute', inset: 0, zIndex: 5, background: 'rgba(60,40,20,.25)', display: 'grid', placeItems: 'center', borderRadius: 34 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#FFF8EE', borderRadius: 26, padding: 14, display: 'flex', gap: 10 }}>
            {SEEDS.map((s) => {
              const open = seeds.some((x) => x.id === s.id);
              return (
                <motion.button key={s.id} type="button" aria-label={s.name} disabled={!open} whileTap={{ scale: 0.92 }}
                  onClick={() => { update(plant(g, choosing, s.id as SeedId)); setChoosing(null); sayUk('garden.planted', 'Посадили! Тепер полий і дай сонечка.'); }}
                  style={{ width: 84, height: 100, border: 0, borderRadius: 18, background: '#fff', boxShadow: '0 4px 0 #F1E3CF', cursor: open ? 'pointer' : 'default', opacity: open ? 1 : 0.35, display: 'grid', placeItems: 'center', padding: 4 }}>
                  <img src={`/count/${s.stages[2]}.webp`} alt="" draggable={false} style={{ height: 70, objectFit: 'contain', filter: open ? undefined : 'grayscale(1)' }} />
                  {!open && <span style={{ fontSize: 16 }}>🔒</span>}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}
    </TaskBubble>
  );
}

function CareBtn({ label, done, off, onClick, children }: { label: string; done: boolean; off?: boolean; onClick: () => void; children: string }) {
  return (
    <motion.button type="button" aria-label={label} title={label} whileTap={{ scale: 0.88 }} onClick={onClick} disabled={done}
      style={{ width: 46, height: 46, borderRadius: 16, border: 0, fontSize: 22, cursor: done ? 'default' : 'pointer',
        background: done ? '#DCF7E3' : '#fff', boxShadow: done ? '0 0 0 3px #6FBF88' : '0 4px 0 #F1E3CF', opacity: off && !done ? 0.4 : 1 }}>
      {done ? '✓' : children}
    </motion.button>
  );
}
