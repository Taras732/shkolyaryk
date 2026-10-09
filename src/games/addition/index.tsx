import { useMemo } from 'react';
import type { GameDefinition, GameComponentProps } from '../types';
import { PromptCard, ChoiceGrid, numberDecoys } from '../shared/ui';
import { hasUkAudio, sayUk } from '../shared/uk-audio';
import { usePreschool } from '../shared/preschool';
import { Objects, SceneTask } from '../shared/count-ui';
import { generate, type Payload } from './generate';

/** Обидві купки — ті самі предмети: «3 яблука і ще 2 яблука», а не кольорові кружечки. */
const EMOJI = ['🍎', '🍓', '🐤', '🎈', '🍪', '🐞'];

const Pile = ({ n, e, white }: { n: number; e: string; white: boolean }) => (
  <div style={white ? { background: '#fff', borderRadius: 28, boxShadow: '0 6px 0 #EED9BF', padding: '14px 12px', minWidth: 96, minHeight: 96, display: 'grid', placeItems: 'center' } : undefined}>
    <Objects n={n} emoji={e} size={n > 3 ? 30 : 36} />
  </div>
);

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, number>) {
  const { a, b } = round.payload;
  const sum = a + b;
  const preschool = usePreschool();
  const e = EMOJI[(a * 3 + b) % EMOJI.length];
  // numberDecoys() кличе Math.random() — рахуємо один раз на round.id, щоб варіанти
  // не тасувались заново при кожному ре-рендері (напр. після невірної відповіді).
  const options = useMemo(() => numberDecoys(sum, 4, 3, 1).sort((x, y) => x - y).map((v) => ({ value: v })), [round.id]);
  const say = (again?: boolean) => (again || round.id === 'r0') && sayUk('p_sum', 'Скільки разом?');
  const pick = (v: number) => {
    if (v === sum && hasUkAudio(`d_${sum}`)) sayUk(`d_${sum}`, String(sum));
    onAnswer(v);
  };
  const scene = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
      <Pile n={a} e={e} white={!!preschool} />
      <span style={{ fontSize: 40, fontWeight: 900, color: '#F08A24', fontFamily: 'var(--font-round)' }}>+</span>
      <Pile n={b} e={e} white={!!preschool} />
    </div>
  );
  return (
    <>
      {preschool ? (
        // у дошкільній рамці дві купки — окремими картками в сцені, без спільної рамки
        <SceneTask question="Скільки разом?" say={say} sayKey={round.id}>{scene}</SceneTask>
      ) : (
        <PromptCard question="Скільки разом?" answerState={answerState}>{scene}</PromptCard>
      )}
      <ChoiceGrid options={options} correct={sum} disabled={disabled} answerState={answerState} onPick={pick} />
    </>
  );
}

const addition: GameDefinition<Payload, number> = {
  id: 'addition',
  title: 'Додавання',
  subject: 'math',
  levels: ['L0'],
  icon: '➕',
  description: 'Скільки разом? Додаємо маленькі числа.',
  accent: '#DCFCE7',
  skillIds: {
    1: ['math.count.l1.compose-10'],
    2: ['math.ops.l1.add-sub-objects-10'],
    3: ['math.ops.l1.add-sub-objects-10'],
  },
  generate,
  Component,
};

export default addition;
