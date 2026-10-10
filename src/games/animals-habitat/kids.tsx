import { motion } from 'motion/react';
import type { Difficulty, GameComponentProps, LevelData } from '../types';
import { shuffle } from '../shared/ui';
import { sayUkSeq, hasUkAudio } from '../shared/uk-audio';
import { SceneTask } from '../shared/count-ui';
import { addSticker } from '@/pets/album';
import { useProfileStore } from '@/stores/useProfileStore';

/**
 * Дошкілля (10.10.2026): «Де живе ведмедик?» — намальоване звірятко, відповіді — великі картки-місця.
 * Було: емодзі й шість назв словами (Джунглі, Арктика, Савана). Рівні: 1 — ліс, вода, ферма; 2 — + сніги; 3 — + савана.
 */
export const KID_HABITATS = ['forest', 'water', 'farm', 'snow', 'savanna'] as const;
type Hab = (typeof KID_HABITATS)[number];
export const KID_ANIMALS: { id: string; name: string; hab: Hab }[] = [
  { id: 'bear', name: 'ведмедик', hab: 'forest' },
  { id: 'fox', name: 'лисичка', hab: 'forest' },
  { id: 'hedgehog', name: 'їжачок', hab: 'forest' },
  { id: 'food_fish', name: 'рибка', hab: 'water' },
  { id: 'frog', name: 'жабка', hab: 'water' },
  { id: 'cow', name: 'корівка', hab: 'farm' },
  { id: 'pig', name: 'свинка', hab: 'farm' },
  { id: 'chick', name: 'курчатко', hab: 'farm' },
  { id: 'penguin', name: 'пінгвін', hab: 'snow' },
  { id: 'polar_bear', name: 'білий ведмедик', hab: 'snow' },
  { id: 'lion', name: 'левеня', hab: 'savanna' },
  { id: 'elephant', name: 'слоник', hab: 'savanna' },
];

export interface KidHabP { kid: true; animal: string; options: Hab[] }

export function generateKids(d: Difficulty): LevelData<KidHabP, string> {
  const habs: Hab[] = d === 1 ? ['forest', 'water', 'farm'] : d === 2 ? ['forest', 'water', 'farm', 'snow'] : [...KID_HABITATS];
  const pool = shuffle(KID_ANIMALS.filter((a) => habs.includes(a.hab)));
  // не два звірятка з того самого місця поспіль
  const picked: typeof pool = [];
  for (const a of pool) if (picked.length < 5 && picked[picked.length - 1]?.hab !== a.hab) picked.push(a);
  return {
    difficulty: d,
    rounds: picked.map((a, i) => {
      const opts = shuffle([a.hab, ...shuffle(habs.filter((h) => h !== a.hab)).slice(0, Math.min(3, habs.length - 1))]);
      return { id: `r${i}`, payload: { kid: true, animal: a.id, options: opts }, answer: a.hab };
    }),
  };
}

export function KidsHabitat({ round, disabled, answerState, onAnswer }: GameComponentProps<KidHabP, string>) {
  const a = KID_ANIMALS.find((x) => x.id === round.payload.animal)!;
  const profileId = useProfileStore((s) => s.activeProfile?.id);
  const name = { key: `hab_an_${a.id}`, text: a.name };
  const say = (again?: boolean) => hasUkAudio(name.key) && sayUkSeq(again || round.id !== 'r0' ? [name] : [{ key: 'p_habitat', text: 'Де живе' }, name]);
  return (
    <SceneTask question="Де живе?" say={say} sayKey={round.id} peek={false}>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
        <img src={`/count/${a.id}.webp`} alt={a.name} draggable={false} style={{ height: 130, objectFit: 'contain', filter: 'drop-shadow(0 4px 3px rgba(90,60,20,.18))' }} />
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${round.payload.options.length === 3 ? 3 : 2}, 1fr)`, gap: 10, width: '100%', maxWidth: 340 }}>
          {round.payload.options.map((h) => {
            const right = answerState === 'correct' && h === round.answer;
            return (
              <motion.button key={h} type="button" aria-label={h} disabled={disabled} whileTap={{ scale: 0.95 }} onClick={() => { if (disabled) return; if (h === round.answer) addSticker(profileId, 'animals', a.id); onAnswer(h); }}
                style={{ aspectRatio: '1', border: 0, padding: 0, borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
                  boxShadow: right ? '0 0 0 5px #22C55E, 0 6px 0 #9FDDB0' : '0 6px 0 #F1E3CF', opacity: answerState === 'correct' && !right ? 0.45 : 1 }}>
                <img src={`/count/hab_${h}.webp`} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </motion.button>
            );
          })}
        </div>
      </div>
    </SceneTask>
  );
}
