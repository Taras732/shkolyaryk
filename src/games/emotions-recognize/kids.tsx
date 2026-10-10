import { motion } from 'motion/react';
import type { Difficulty, GameComponentProps, LevelData } from '../types';
import { shuffle } from '../shared/ui';
import { sayUk } from '../shared/uk-audio';
import { SceneTask } from '../shared/count-ui';
import PetPuppet from '@/pets/PetPuppet';
import { usePet } from '@/pets/pets';
import type { Face } from '@/pages/poc/Bunny';

/**
 * Дошкілля (10.10.2026): «Хто сумує?» — той самий друг дитини з різним настроєм (лялька вміє ці обличчя).
 * Було: «Карта настрою» з двома осями й текстом — для 3-річної заскладно. Кожен раунд — своє питання, воно і є ціль.
 */
export const KID_MOODS: { id: string; face: Face; ask: string }[] = [
  { id: 'joy', face: 'laugh', ask: 'Хто радіє?' },
  { id: 'sad', face: 'sad', ask: 'Хто сумує?' },
  { id: 'wow', face: 'o', ask: 'Хто дивується?' },
  { id: 'sleepy', face: 'sleep', ask: 'Хто хоче спати?' },
];

export interface KidMoodP { kid: true; target: string; options: string[] }

export function generateKids(d: Difficulty): LevelData<KidMoodP, string> {
  const ids = KID_MOODS.map((m) => m.id);
  const n = d === 1 ? 3 : 4;
  // 5 раундів, не те саме питання двічі поспіль
  const targets: string[] = [];
  while (targets.length < 5) {
    const t = shuffle(ids)[0];
    if (t !== targets[targets.length - 1]) targets.push(t);
  }
  return {
    difficulty: d,
    rounds: targets.map((t, i) => ({ id: `r${i}`, payload: { kid: true, target: t, options: shuffle([t, ...shuffle(ids.filter((x) => x !== t)).slice(0, n - 1)]) }, answer: t })),
  };
}

export function KidsMoods({ round, disabled, answerState, onAnswer }: GameComponentProps<KidMoodP, string>) {
  const pet = usePet();
  const target = KID_MOODS.find((m) => m.id === round.payload.target)!;
  const say = () => sayUk(`mood_${target.id}`, target.ask);
  const n = round.payload.options.length;
  return (
    <SceneTask question={target.ask} say={say} sayKey={round.id} peek={false}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${n === 3 ? 3 : 2}, 1fr)`, gap: 10, width: '100%', maxWidth: 360, position: 'relative', zIndex: 1 }}>
        {round.payload.options.map((id) => {
          const m = KID_MOODS.find((x) => x.id === id)!;
          const right = answerState === 'correct' && id === round.answer;
          return (
            <motion.button key={id} type="button" aria-label={m.ask} disabled={disabled} whileTap={{ scale: 0.95 }} onClick={() => !disabled && onAnswer(id)}
              style={{ border: 0, borderRadius: 24, background: right ? '#DCF7E3' : '#fff', padding: 6, cursor: 'pointer',
                boxShadow: right ? '0 0 0 5px #22C55E, 0 6px 0 #9FDDB0' : '0 6px 0 #F1E3CF', opacity: answerState === 'correct' && !right ? 0.45 : 1 }}>
              {/* лялька лише показує настрій — дотики до неї тут вимкнені */}
              <div style={{ pointerEvents: 'none' }}><PetPuppet pet={pet} face={m.face} onZone={() => {}} /></div>
            </motion.button>
          );
        })}
      </div>
    </SceneTask>
  );
}
