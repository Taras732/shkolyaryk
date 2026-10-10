import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { Difficulty, GameComponentProps, GameDefinition, LevelData } from '../types';
import { BOARD_DONE } from '../types';
import { sayUk } from '../shared/uk-audio';
import { TaskBubble } from '../shared/preschool';
import PetPuppet from '@/pets/PetPuppet';
import { usePet } from '@/pets/pets';
import { useProfileStore } from '@/stores/useProfileStore';
import { getWardrobe } from '@/pets/wardrobe';
import type { Face } from '@/pages/poc/Bunny';

/**
 * Майстерня (10.10.2026, варіант Б): «Одягни друга» — речі з шафи друга (виграні в «Що вдягнути?»)
 * сідають на своє місце: шапка на голову, окуляри на очі, шарф на шию… Вбрання запамʼятовується.
 * Порожня шафа — дві стартові речі й підказка, де взяти ще.
 */
type Slot = 'head' | 'eyes' | 'neck' | 'body' | 'feet' | 'hand';
const ITEMS: Record<string, { slot: Slot; w: number }> = {
  wear_sunhat: { slot: 'head', w: 0.62 },
  wear_winterhat: { slot: 'head', w: 0.5 },
  wear_sunglasses: { slot: 'eyes', w: 0.5 },
  wear_scarf: { slot: 'neck', w: 0.5 },
  wear_jacket: { slot: 'body', w: 0.5 },
  wear_boots: { slot: 'feet', w: 0.45 },
  as_umbrella: { slot: 'hand', w: 0.5 },
};
const STARTER = ['wear_sunhat', 'wear_scarf'];
const okey = (id: string) => `shk.outfit.v1.${id}`;

interface P { board: true }
const generate = (d: Difficulty): LevelData<P, typeof BOARD_DONE> => ({ difficulty: d, rounds: [{ id: `dress-${Date.now()}`, payload: { board: true }, answer: BOARD_DONE }] });

function Component({ onAnswer }: GameComponentProps<P, typeof BOARD_DONE>) {
  const pet = usePet();
  const profileId = useProfileStore((s) => s.activeProfile?.id) ?? 'none';
  const own = getWardrobe(profileId);
  const items = own.length ? own : STARTER;
  const [outfit, setOutfit] = useState<Record<Slot, string | undefined>>(() => {
    try { return JSON.parse(localStorage.getItem(okey(profileId)) ?? '{}'); } catch { return {} as Record<Slot, string | undefined>; }
  });
  const [face, setFace] = useState<Face>('smile');
  useEffect(() => {
    const t = window.setTimeout(() => sayUk(own.length ? 'dress.hello' : 'dress.hello_empty', own.length ? 'Одягни мене!' : 'Одягни мене! Ще речі — у грі «Що вдягнути?»'), 400);
    return () => window.clearTimeout(t);
  }, [own.length]);

  // де на ілюстрації голова, очі, шия (частки ширини/висоти) — з розмітки обличчя, для зайчика — наближено
  const eyeY = pet.face ? pet.face.eyes.reduce((a, e) => a + e[1], 0) / pet.face.eyes.length / 1024 : 0.5;
  const eyeX = pet.face ? pet.face.eyes.reduce((a, e) => a + e[0], 0) / pet.face.eyes.length / 1024 : 0.52;
  const pos: Record<Slot, { x: number; y: number }> = {
    head: { x: eyeX, y: eyeY - 0.2 },
    eyes: { x: eyeX, y: eyeY },
    neck: { x: eyeX, y: eyeY + 0.2 },
    body: { x: 0.5, y: 0.8 },
    feet: { x: 0.5, y: 0.9 },
    hand: { x: 0.86, y: 0.55 },
  };

  const toggle = (id: string) => {
    const slot = ITEMS[id].slot;
    const next = { ...outfit, [slot]: outfit[slot] === id ? undefined : id };
    setOutfit(next);
    try { localStorage.setItem(okey(profileId), JSON.stringify(next)); } catch { /* без пам'яті — до перезавантаження */ }
    setFace('laugh');
    window.setTimeout(() => setFace('smile'), 900);
  };

  return (
    <TaskBubble text="Одягни друга" onSay={() => sayUk('dress.hello', 'Одягни мене!')} peek={false} sceneBg="linear-gradient(180deg, #FCE7F3 0%, #FFF4F9 100%)">
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
        <div style={{ position: 'relative', width: 230, height: 230 }}>
          <div style={{ pointerEvents: 'none' }}><PetPuppet pet={pet} face={face} onZone={() => {}} /></div>
          {(Object.keys(outfit) as Slot[]).map((slot) => {
            const id = outfit[slot];
            if (!id) return null;
            const p = pos[slot];
            const w = ITEMS[id].w * 230;
            return (
              <motion.img key={slot} src={`/count/${id}.webp`} alt="" draggable={false} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 16 }}
                style={{ position: 'absolute', left: p.x * 230 - w / 2, top: p.y * 230 - w / 2, width: w, height: w, objectFit: 'contain', pointerEvents: 'none', zIndex: slot === 'body' ? 0 : 2 }} />
            );
          })}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 340 }}>
          {items.map((id) => {
            const on = outfit[ITEMS[id]?.slot] === id;
            return ITEMS[id] ? (
              <motion.button key={id} type="button" aria-label={id} whileTap={{ scale: 0.9 }} onClick={() => toggle(id)}
                style={{ width: 64, height: 64, border: 0, borderRadius: 18, background: on ? '#DCF7E3' : '#fff', boxShadow: on ? '0 0 0 3px #6FBF88' : '0 4px 0 #F1E3CF', padding: 6, cursor: 'pointer' }}>
                <img src={`/count/${id}.webp`} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </motion.button>
            ) : null;
          })}
        </div>
        {!own.length && <div style={{ fontFamily: 'var(--font-round)', fontWeight: 800, fontSize: 13, color: '#B07A3C', textAlign: 'center' }}>Ще речі — у грі «Що вдягнути?» у Чарівному Саду</div>}
        <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={() => onAnswer(BOARD_DONE)}
          style={{ border: 0, borderRadius: 20, padding: '11px 26px', background: '#F08A24', color: '#fff', fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: 18, boxShadow: '0 5px 0 #C2620A', cursor: 'pointer' }}>
          Готово ✓
        </motion.button>
      </div>
    </TaskBubble>
  );
}

const dressFriend: GameDefinition<P, typeof BOARD_DONE> = {
  id: 'dress-friend',
  title: 'Одягни друга',
  subject: 'life',
  levels: ['L0'],
  icon: '👒',
  image: '/count/wear_sunhat.webp',
  description: 'Речі з шафи друга — на друга.',
  accent: '#FCE7F3',
  generate,
  isCorrect: () => true,
  Component,
};

export default dressFriend;
