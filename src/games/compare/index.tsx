import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { GameDefinition, GameComponentProps } from '../types';
import { PromptCard, ChoiceGrid } from '../shared/ui';
import { sayUk } from '../shared/uk-audio';
import { usePreschool } from '../shared/preschool';
import { Objects, SceneTask } from '../shared/count-ui';
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
 * Дошкілля (10.10.2026): тицяєш саму купку, де більше, — без чисел.
 * Порівняти «на око» малюк уміє раніше, ніж знає цифри.
 */
function PreschoolCompare({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, number>) {
  const { l, r, emoji } = round.payload;
  const correct = Math.max(l, r);
  const [sel, setSel] = useState<number | null>(null);
  useEffect(() => {
    if (answerState === 'idle') setSel(null);
  }, [answerState]);
  const say = (again?: boolean) => (again || round.id === 'r0') && sayUk('p_more', 'Де більше?');
  const m = Math.max(l, r);
  const size = m <= 3 ? 42 : m <= 5 ? 32 : m <= 8 ? 26 : 21;
  return (
    <SceneTask question="Де більше?" say={say} sayKey={round.id}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', position: 'relative', zIndex: 1 }}>
        {[l, r].map((n, i) => {
          const picked = sel === i;
          const ok = picked && answerState === 'correct';
          const wrong = picked && answerState === 'incorrect';
          const hint = answerState === 'incorrect' && n === correct;
          return (
            <motion.button key={i} type="button" disabled={disabled} whileTap={{ scale: 0.94 }}
              onClick={() => { if (disabled) return; setSel(i); onAnswer(n); }}
              style={{ border: 0, cursor: 'pointer', background: ok ? '#DCF7E3' : '#fff', borderRadius: 30, padding: '16px 12px', minWidth: 150, minHeight: 210,
                display: 'grid', placeItems: 'center', boxShadow: `0 7px 0 ${ok ? '#9FDDB0' : '#EED9BF'}${ok || hint ? ', 0 0 0 4px #22C55E' : ''}`,
                opacity: answerState === 'correct' && !picked ? 0.45 : 1, animation: ok ? 'pk-pop .45s ease-out forwards' : wrong ? 'pk-shake .4s ease' : undefined }}>
              <Objects n={n} emoji={emoji} size={size} />
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
