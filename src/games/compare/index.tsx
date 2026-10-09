import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { GameDefinition, GameComponentProps } from '../types';
import { PromptCard, ChoiceGrid } from '../shared/ui';
import { sayUk } from '../shared/uk-audio';
import { usePreschool } from '../shared/preschool';
import { Objects, SceneTask, itemFor } from '../shared/count-ui';
import { generate, type Payload } from './generate';

function Bunch({ n, emoji }: { n: number; emoji: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 3,
        justifyContent: 'center',
        maxWidth: 120,
        padding: 12,
        border: '1.5px solid var(--c-line)',
        borderRadius: 16,
        background: '#F6F7FB',
      }}
    >
      {Array.from({ length: n }).map((_, k) => (
        <span key={k} style={{ fontSize: 24 }}>
          {emoji}
        </span>
      ))}
    </div>
  );
}

/**
 * Дошкілля (10.10.2026): «У кого більше?» — зайчик і ведмедик, у кожного на килимку купка.
 * Тицяєш героя (чи його купку), без чисел: порівняти «на око» малюк уміє раніше, ніж знає цифри.
 */
const HEROES = [
  { img: '/count/bunny.webp', rug: '#FFE1EC', edge: '#F5B8CE' },
  { img: '/count/bear.webp', rug: '#E3F0FF', edge: '#B5D2F5' },
];

function PreschoolCompare({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, number>) {
  const { l, r } = round.payload;
  const correct = Math.max(l, r);
  const item = itemFor(l * 5 + r);
  const [sel, setSel] = useState<number | null>(null);
  useEffect(() => {
    if (answerState === 'idle') setSel(null);
  }, [answerState]);
  const say = (again?: boolean) => (again || round.id === 'r0') && sayUk('p_more_who', 'У кого більше?');
  const m = Math.max(l, r);
  const size = m <= 3 ? 40 : m <= 5 ? 30 : m <= 8 ? 26 : 21;
  return (
    <SceneTask question="У кого більше?" say={say} sayKey={round.id} peek={false} sceneBg="linear-gradient(180deg, #FFF4E3 0%, #FFE9D2 55%, #DDEFC9 55%, #CFE8B8 100%)">
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
        {[l, r].map((n, i) => {
          const h = HEROES[i];
          const picked = sel === i;
          const ok = picked && answerState === 'correct';
          const wrong = picked && answerState === 'incorrect';
          const hint = answerState === 'incorrect' && n === correct;
          return (
            <motion.button key={i} type="button" disabled={disabled} whileTap={{ scale: 0.95 }}
              onClick={() => { if (disabled) return; setSel(i); onAnswer(n); }}
              style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', width: 158,
                opacity: answerState === 'correct' && !picked ? 0.4 : 1, animation: ok ? 'pk-pop .45s ease-out forwards' : wrong ? 'pk-shake .4s ease' : undefined }}>
              <img src={h.img} alt="" draggable={false} style={{ height: 138, objectFit: 'contain', marginBottom: -14, position: 'relative', zIndex: 1,
                filter: ok || hint ? 'drop-shadow(0 0 10px #22C55E)' : 'drop-shadow(0 4px 3px rgba(90,60,20,.18))' }} />
              <div style={{ width: '100%', minHeight: 132, borderRadius: 26, background: ok ? '#DCF7E3' : h.rug, display: 'grid', placeItems: 'center', padding: '20px 8px 12px',
                boxShadow: `0 6px 0 ${ok ? '#9FDDB0' : h.edge}${ok || hint ? ', 0 0 0 4px #22C55E' : ''}` }}>
                <Objects n={n} img={item} size={size} />
              </div>
            </motion.button>
          );
        })}
      </div>
    </SceneTask>
  );
}

function Component(props: GameComponentProps<Payload, number>) {
  const preschool = usePreschool();
  if (preschool) return <PreschoolCompare {...props} />;
  const { round, disabled, answerState, onAnswer } = props;
  const { l, r, emoji } = round.payload;
  const correct = Math.max(l, r);
  // Варіанти = дві кількості (обери більше число).
  const options = (l < r ? [l, r] : [r, l]).map((v) => ({ value: v }));
  return (
    <>
      <PromptCard question="Де більше? Обери більше число" answerState={answerState}>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center', margin: '4px 0' }}>
          <Bunch n={l} emoji={emoji} />
          <Bunch n={r} emoji={emoji} />
        </div>
      </PromptCard>
      <ChoiceGrid options={options} correct={correct} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={2} />
    </>
  );
}

const compare: GameDefinition<Payload, number> = {
  id: 'compare',
  title: 'Більше-менше',
  subject: 'math',
  levels: ['L0'],
  icon: '⚖️',
  description: 'Де більше предметів? Порівнюємо кількість.',
  accent: '#FFEDD5',
  skillIds: {
    1: ['math.count.l0.compare-qty'],
    2: ['math.count.l1.compare-numbers-20'],
    3: ['math.count.l1.compare-numbers-20'],
  },
  generate,
  Component,
};

export default compare;
