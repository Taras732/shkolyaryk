import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import type { Difficulty, GameComponentProps, GameDefinition, LevelData } from '../types';
import { sayUk } from '../shared/uk-audio';
import { SceneTask } from '../shared/count-ui';
import { ANIMALS, ROUNDS, makePairs, type AnimalId, type Pair } from './core';

type Payload = Pair;

function generate(difficulty: Difficulty): LevelData<Payload, AnimalId> {
  return { difficulty, rounds: makePairs(difficulty).map((p, i) => ({ id: `r${i}`, payload: p, answer: p.heavy })) };
}

const ARM = 118; // від центру коромисла до шальки
const TILT = 16; // градусів, коли терези показали правду
const SIDE = 128; // звірятко однакового розміру — порівнюємо знанням, а не картинкою

/**
 * Терези: до відповіді стоять рівно (інакше відповідь видно), після тапу нахиляються в бік важчого —
 * і на правильній, і на помилковій відповіді: дитина бачить, як насправді.
 */
function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, AnimalId>) {
  const { left, right, heavy } = round.payload;
  const [sel, setSel] = useState<AnimalId | null>(null);
  useEffect(() => {
    if (answerState === 'idle') setSel(null);
  }, [answerState]);
  const say = (again?: boolean) => (again || round.id === 'r0') && sayUk('p_heavy', 'Хто важчий?');
  const shown = answerState !== 'idle';
  const angle = shown ? (heavy === left ? -TILT : TILT) : 0;
  const dy = useMemo(() => ARM * Math.sin((angle * Math.PI) / 180), [angle]);
  const spring = { type: 'spring', stiffness: 300, damping: 16 } as const; // швидко: раунд змінюється через 0.85 с

  const pan = (id: AnimalId, side: -1 | 1) => {
    const picked = sel === id;
    const ok = picked && answerState === 'correct';
    const wrong = picked && answerState === 'incorrect';
    const hint = answerState === 'incorrect' && id === heavy;
    return (
      <motion.button key={id} type="button" disabled={disabled} aria-label={ANIMALS.find((a) => a.id === id)!.name}
        onClick={() => { if (disabled) return; setSel(id); onAnswer(id); }}
        animate={{ y: side * dy }} transition={spring} whileTap={{ scale: 0.95 }}
        style={{ position: 'absolute', left: `calc(50% + ${side * ARM}px - ${SIDE / 2 + 14}px)`, bottom: 128, width: SIDE + 28,
          border: 0, background: 'transparent', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center',
          animation: wrong ? 'pk-shake .4s ease' : ok ? 'pk-pop .45s ease-out forwards' : undefined }}>
        <img src={`/count/${id}.webp`} alt="" draggable={false}
          style={{ width: SIDE, height: SIDE, objectFit: 'contain', marginBottom: -8, position: 'relative', zIndex: 1,
            filter: ok || hint ? 'drop-shadow(0 0 10px #22C55E)' : 'drop-shadow(0 4px 3px rgba(90,60,20,.18))' }} />
        {/* шалька */}
        <div style={{ width: '100%', height: 22, borderRadius: '0 0 70px 70px', background: ok ? '#9FDDB0' : '#E7B66B', boxShadow: '0 5px 0 #C9924A' }} />
        <div style={{ width: 4, height: 40, background: '#B0803F' }} />
      </motion.button>
    );
  };

  return (
    <SceneTask question="Хто важчий?" say={say} sayKey={round.id} peek={false}
      sceneBg="linear-gradient(180deg, #FFF4E3 0%, #FFE9D2 74%, #DDEFC9 74%, #CFE8B8 100%)">
      {/* терези стоять на траві: низ сцени, а не по центру */}
      <div style={{ position: 'absolute', left: '50%', bottom: '14%', transform: 'translateX(-50%)', width: '100%', maxWidth: 380, height: 330 }}>
        {/* стійка */}
        <div style={{ position: 'absolute', left: '50%', bottom: 18, width: 16, height: 104, marginLeft: -8, borderRadius: 8, background: '#B0803F' }} />
        <div style={{ position: 'absolute', left: '50%', bottom: 8, width: 120, height: 22, marginLeft: -60, borderRadius: 12, background: '#C9924A' }} />
        {/* коромисло */}
        <motion.div animate={{ rotate: angle }} transition={spring}
          style={{ position: 'absolute', left: '50%', bottom: 118, width: ARM * 2 + 24, height: 14, marginLeft: -(ARM + 12), borderRadius: 7, background: '#C9924A' }} />
        <div style={{ position: 'absolute', left: '50%', bottom: 113, width: 24, height: 24, marginLeft: -12, borderRadius: '50%', background: '#F08A24' }} />
        {pan(left, -1)}
        {pan(right, 1)}
      </div>
    </SceneTask>
  );
}

const heavyKids: GameDefinition<Payload, AnimalId> = {
  id: 'heavy-kids',
  title: 'Хто важчий?',
  subject: 'logic',
  levels: ['L0'],
  icon: '⚖️',
  image: '/games/pz-heavier.webp',
  description: 'Терези й звірятка: хто з двох важчий?',
  accent: '#E0E7FF',
  generate,
  Component,
};

export { ROUNDS };
export default heavyKids;
