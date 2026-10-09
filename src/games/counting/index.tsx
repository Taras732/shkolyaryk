import { useMemo } from 'react';
import type { GameDefinition, GameComponentProps } from '../types';
import { PromptCard, ChoiceGrid, numberDecoys } from '../shared/ui';
import { hasUkAudio, sayUk } from '../shared/uk-audio';
import { Objects, objSize } from '../shared/count-ui';
import { generate, type Payload } from './generate';

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, number>) {
  const { n, emoji } = round.payload;
  // numberDecoys() кличе Math.random() — рахуємо один раз на round.id, щоб варіанти
  // не тасувались заново при кожному ре-рендері (напр. після невірної відповіді).
  const options = useMemo(() => numberDecoys(n, 4, 3, 1).sort((x, y) => x - y).map((v) => ({ value: v })), [round.id]);
  // завдання звучить раз на гру (перший раунд) і з кнопки 🔊
  const say = (again?: boolean) => (again || round.id === 'r0') && sayUk('p_count', 'Скільки тут?');
  const pick = (v: number) => {
    // правильна відповідь — число звучить уголос: «пʼять»
    if (v === n && hasUkAudio(`d_${n}`)) sayUk(`d_${n}`, String(n));
    onAnswer(v);
  };
  return (
    <>
      <PromptCard question="Скільки тут?" answerState={answerState} say={say} sayKey={round.id}>
        <Objects n={n} emoji={emoji} size={objSize(n)} />
      </PromptCard>
      <ChoiceGrid options={options} correct={n} disabled={disabled} answerState={answerState} onPick={pick} />
    </>
  );
}

const counting: GameDefinition<Payload, number> = {
  id: 'counting',
  title: 'Лічба',
  subject: 'math',
  levels: ['L0'],
  icon: '🔢',
  description: 'Рахуємо предмети від 1 до 10.',
  accent: '#E0F2FE',
  skillIds: {
    1: ['math.count.l0.forward-1-5'],
    2: ['math.count.l1.forward-back-1-10'],
    3: ['math.count.l1.forward-back-1-10'],
  },
  generate,
  Component,
};

export default counting;
