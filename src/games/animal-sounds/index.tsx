import { motion } from 'motion/react';
import type { Difficulty, GameComponentProps, GameDefinition, LevelData } from '../types';
import { shuffle } from '../shared/ui';
import { sayUk, sayUkSeq } from '../shared/uk-audio';
import { SceneTask } from '../shared/count-ui';

/**
 * Музична Поляна (10.10.2026, варіант А): «Хто так співає?» — звучить «Му-у-у!», дитина обирає намальоване звірятко.
 * Фраза — раз на гру; далі щораунду лише звук. Рівні: 3 → 4 варіанти; 3 — схожі звуки поруч (котик і мишка).
 */
export const SINGERS = [
  { id: 'cow', name: 'корівка', sound: 'Му-у-у!' },
  { id: 'cat', name: 'котик', sound: 'Няв-няв!' },
  { id: 'dog', name: 'песик', sound: 'Гав-гав!' },
  { id: 'cyc_hen', name: 'курочка', sound: 'Ко-ко-ко!' },
  { id: 'frog', name: 'жабка', sound: 'Ква-ква!' },
  { id: 'horse', name: 'конячка', sound: 'І-го-го!' },
  { id: 'pig', name: 'свинка', sound: 'Хрю-хрю!' },
  { id: 'mouse', name: 'мишка', sound: 'Пі-пі-пі!' },
];

interface P { target: string; options: string[] }

function generate(d: Difficulty): LevelData<P, string> {
  const targets = shuffle(SINGERS).slice(0, 5);
  const n = d === 1 ? 3 : 4;
  return {
    difficulty: d,
    rounds: targets.map((t, i) => ({ id: `r${i}`, payload: { target: t.id, options: shuffle([t.id, ...shuffle(SINGERS.filter((x) => x.id !== t.id)).slice(0, n - 1).map((x) => x.id)]) }, answer: t.id })),
  };
}

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<P, string>) {
  const t = SINGERS.find((x) => x.id === round.payload.target)!;
  const sound = { key: `snd_${t.id}`, text: t.sound };
  const say = (again?: boolean) => sayUkSeq(again || round.id !== 'r0' ? [sound] : [{ key: 'p_who_sings', text: 'Хто так співає?' }, sound]);
  return (
    <SceneTask question="Хто так співає? 🎵" say={say} sayKey={round.id} peek={false}
      sceneBg="linear-gradient(180deg, #E0F2FE 0%, #F0F9FF 60%, #D9F2C9 60%, #C7E8B0 100%)">
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${round.payload.options.length === 3 ? 3 : 2}, 1fr)`, gap: 12, width: '100%', maxWidth: 340, position: 'relative', zIndex: 1 }}>
        {round.payload.options.map((id) => {
          const s = SINGERS.find((x) => x.id === id)!;
          const right = answerState === 'correct' && id === round.answer;
          return (
            <motion.button key={id} type="button" aria-label={s.name} disabled={disabled} whileTap={{ scale: 0.92 }}
              onClick={() => { if (disabled) return; if (id === round.answer) window.setTimeout(() => sayUk(`snd_${id}`, s.sound), 250); onAnswer(id); }}
              animate={right ? { y: [0, -18, 0, -10, 0] } : { y: 0 }} transition={{ duration: 0.8 }}
              style={{ aspectRatio: '1', border: 0, borderRadius: 26, background: right ? '#DCF7E3' : '#fff', padding: 10, cursor: 'pointer',
                boxShadow: right ? '0 0 0 5px #22C55E, 0 6px 0 #9FDDB0' : '0 6px 0 #F1E3CF', opacity: answerState === 'correct' && !right ? 0.45 : 1 }}>
              <img src={`/count/${id}.webp`} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </motion.button>
          );
        })}
      </div>
    </SceneTask>
  );
}

const animalSounds: GameDefinition<P, string> = {
  id: 'animal-sounds',
  title: 'Хто так співає?',
  subject: 'attention', // слухання; окремого «music» у Subject немає
  levels: ['L0'],
  icon: '🎵',
  image: '/count/cow.webp',
  description: 'Послухай звук — знайди звірятко.',
  accent: '#E0F2FE',
  generate,
  Component,
};

export default animalSounds;
