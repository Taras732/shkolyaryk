import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Difficulty, GameComponentProps, LevelData } from '../types';
import { shuffle } from '../shared/ui';
import { sayUk } from '../shared/uk-audio';
import { SceneTask } from '../shared/count-ui';
import { useProfileStore } from '@/stores/useProfileStore';
import { loadGarden, saveGarden } from '@/pets/garden';

/**
 * «Морозиво для друга» (10.10.2026, замість «Стани води» з трьома значками): дослід руками —
 * сік у формочку → у морозилку → морозиво (воно йде другові в кошик); «що буде на сонці?» → калюжка;
 * «як знову зробити морозиво?» → морозилка. Причина й наслідок замість назв станів.
 */
type Kind = 'make' | 'predict' | 'refreeze';
export interface IceP { kid: true; kind: Kind; options?: string[] }
export const OK = 'ok';

export function generateKids(d: Difficulty): LevelData<IceP, string> {
  const plan: Kind[] = d === 1 ? ['make', 'predict', 'make'] : d === 2 ? ['make', 'predict', 'refreeze'] : ['predict', 'refreeze', 'make', 'predict'];
  return {
    difficulty: d,
    rounds: plan.map((kind, i) => ({
      id: `r${i}`,
      payload: { kid: true, kind, options: kind === 'predict' ? shuffle(['ice_puddle', 'ice_pop']) : kind === 'refreeze' ? shuffle(['ice_freezer', 'pg_sun']) : undefined },
      answer: kind === 'make' ? OK : kind === 'predict' ? 'ice_puddle' : 'ice_freezer',
    })),
  };
}

const ASK: Record<Kind, { key: string; text: string }> = {
  make: { key: 'ice.make', text: 'Зробимо морозиво для друга! Налий сік у формочку.' },
  predict: { key: 'ice.predict', text: 'Що буде з морозивом на сонечку?' },
  refreeze: { key: 'ice.refreeze', text: 'Як знову зробити морозиво?' },
};

const pic = (id: string, h: number) => <img src={`/count/${id}.webp`} alt="" draggable={false} style={{ height: h, objectFit: 'contain', display: 'block' }} />;

export function KidsIce({ round, disabled, answerState, onAnswer }: GameComponentProps<IceP, string>) {
  const { kind, options } = round.payload;
  const profileId = useProfileStore((s) => s.activeProfile?.id);
  // «зробити»: 0 — сік і порожня формочка, 1 — формочка повна, 2 — у морозилці, 3 — морозиво
  const [step, setStep] = useState(0);
  const [melt, setMelt] = useState(false);
  useEffect(() => { setStep(0); setMelt(false); }, [round.id]);
  useEffect(() => { if (answerState === 'correct' && kind === 'predict') setMelt(true); }, [answerState, kind]);
  const say = () => sayUk(ASK[kind].key, ASK[kind].text);

  const pour = () => { if (step !== 0) return; setStep(1); window.setTimeout(() => sayUk('ice.freeze', 'Тепер — у морозилку!'), 500); };
  const freeze = () => {
    if (step !== 1) return;
    setStep(2);
    window.setTimeout(() => {
      setStep(3);
      sayUk('ice.ready', 'Дзинь! Морозиво готове — для друга!');
      if (profileId) { const g = loadGarden(profileId); saveGarden(profileId, { ...g, pantry: [...g.pantry, 'ice_pop'] }); }
      window.setTimeout(() => onAnswer(OK), 1500);
    }, 2200);
  };

  return (
    <SceneTask question={kind !== 'make' ? ASK[kind].text : ['Налий сік у формочку!', 'Тепер — у морозилку!', 'Мороземо… ❄️', 'Морозиво готове — для друга!'][step]} say={say} sayKey={round.id} peek={false} sceneBg="linear-gradient(180deg, #EAF6FF 0%, #F5FBFF 100%)">
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
        {kind === 'make' && (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 14, minHeight: 220 }}>
            {step === 0 && (
              <motion.button type="button" aria-label="Сік" onClick={pour} whileTap={{ scale: 0.92, rotate: -25 }} animate={{ y: [0, -6, 0] }} transition={{ duration: 1.4, repeat: Infinity }}
                style={{ border: 0, background: 'transparent', cursor: 'pointer' }}>{pic('ice_juice', 140)}</motion.button>
            )}
            {step <= 1 && (
              <motion.button type="button" aria-label="Формочка" onClick={() => (step === 0 ? pour() : freeze())} whileTap={{ scale: 0.92 }}
                animate={step === 1 ? { y: [0, -8, 0] } : { y: 0 }} transition={step === 1 ? { duration: 1.2, repeat: Infinity } : undefined}
                style={{ border: 0, background: 'transparent', cursor: 'pointer' }}>{pic(step === 0 ? 'ice_mold' : 'ice_mold_full', 130)}</motion.button>
            )}
            {step >= 1 && step <= 2 && (
              <motion.button type="button" aria-label="Морозилка" onClick={freeze} whileTap={{ scale: 0.95 }} style={{ position: 'relative', border: 0, background: 'transparent', cursor: 'pointer' }}>
                {pic('ice_freezer', 180)}
                <AnimatePresence>
                  {step === 2 && [0, 1, 2, 3, 4].map((k) => (
                    <motion.span key={k} initial={{ opacity: 0, y: 0 }} animate={{ opacity: [0, 1, 0], y: [-10, 40] }} transition={{ duration: 1.1, delay: k * 0.3, repeat: 1 }}
                      style={{ position: 'absolute', left: `${20 + k * 14}%`, top: '20%', fontSize: 22 }}>❄️</motion.span>
                  ))}
                </AnimatePresence>
              </motion.button>
            )}
            {step === 3 && <motion.div initial={{ scale: 0.3, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 12 }}>{pic('ice_pop', 190)}</motion.div>}
          </div>
        )}
        {kind !== 'make' && (
          <>
            <div style={{ position: 'relative', height: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              {kind === 'predict' && <span style={{ position: 'absolute', right: -70, top: -10, fontSize: 56 }}>☀️</span>}
              <AnimatePresence mode="wait">
                <motion.div key={kind === 'predict' ? (melt ? 'p' : 'i') : 'puddle'} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scaleY: 0.3 }} transition={{ duration: 0.9 }}>
                  {pic(kind === 'predict' ? (melt ? 'ice_puddle' : 'ice_pop') : 'ice_puddle', 170)}
                </motion.div>
              </AnimatePresence>
            </div>
            <div style={{ display: 'flex', gap: 14 }}>
              {options!.map((id) => {
                const right = answerState === 'correct' && id === round.answer;
                return (
                  <motion.button key={id} type="button" aria-label={id} disabled={disabled} whileTap={{ scale: 0.92 }} onClick={() => !disabled && onAnswer(id)}
                    style={{ width: 110, height: 110, border: 0, borderRadius: 26, background: right ? '#DCF7E3' : '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer', padding: 10,
                      boxShadow: right ? '0 0 0 5px #22C55E, 0 6px 0 #9FDDB0' : '0 6px 0 #F1E3CF' }}>
                    {pic(id, 86)}
                  </motion.button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </SceneTask>
  );
}
