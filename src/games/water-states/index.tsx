import { useMemo } from 'react';
import type { GameDefinition, GameComponentProps, Difficulty, LevelData, Round } from '../types';
import { PromptCard, ChoiceGrid, randInt, shuffle } from '../shared/ui';
import { usePreschool } from '../shared/preschool';
import { KidsIce, generateKids, type IceP } from './kids';

type StateId = 'solid' | 'liquid' | 'gas';

interface Payload {
  emoji: string;
  state: StateId;
}

const STATE_LABEL: Record<StateId, string> = {
  solid: 'Лід',
  liquid: 'Вода',
  gas: 'Пара',
};

interface ItemEntry {
  emoji: string;
  state: StateId;
  basic: boolean;
}

/** Базовий пул — по 1 emoji на стан; розширений — додає менш очевидні предмети. */
const ITEMS: ItemEntry[] = [
  { emoji: '❄️', state: 'solid', basic: true },
  { emoji: '🧊', state: 'solid', basic: false },
  { emoji: '💧', state: 'liquid', basic: true },
  { emoji: '🌊', state: 'liquid', basic: false },
  { emoji: '♨️', state: 'gas', basic: true },
  { emoji: '💨', state: 'gas', basic: false },
];

function poolFor(difficulty: Difficulty): ItemEntry[] {
  return difficulty === 1 ? ITEMS.filter((i) => i.basic) : ITEMS;
}

function generate(difficulty: Difficulty, level?: string): LevelData<Payload, string> {
  if (level === 'L0') return generateKids(difficulty) as unknown as LevelData<Payload, string>;
  const pool = poolFor(difficulty);
  const rounds: Round<Payload, string>[] = [];
  let prev = -1;
  for (let i = 0; i < 5; i++) {
    let idx = randInt(0, pool.length - 1);
    let guard = 0;
    while (idx === prev && guard < 10) {
      idx = randInt(0, pool.length - 1);
      guard++;
    }
    prev = idx;
    const item = pool[idx];
    rounds.push({ id: `r${i}`, payload: { emoji: item.emoji, state: item.state }, answer: STATE_LABEL[item.state] });
  }
  return { difficulty, rounds };
}

function Component(props: GameComponentProps<Payload, string>) {
  const preschool = usePreschool();
  if (preschool && (props.round.payload as unknown as IceP).kid) return <KidsIce {...(props as unknown as GameComponentProps<IceP, string>)} />;
  return <SchoolWater {...props} />;
}

function SchoolWater({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, string>) {
  const { emoji, state } = round.payload;
  // shuffle() кличе Math.random() — рахуємо один раз на round.id, щоб порядок варіантів
  // не мінявся при кожному ре-рендері (напр. після невірної відповіді).
  const options = useMemo(
    () => shuffle((['solid', 'liquid', 'gas'] as StateId[]).map((s) => ({ value: STATE_LABEL[s] }))),
    [round.id],
  );
  return (
    <>
      <PromptCard question="Який це стан води?" answerState={answerState}>
        <div style={{ fontSize: 96, textAlign: 'center', margin: '8px auto' }}>{emoji}</div>
      </PromptCard>
      <ChoiceGrid
        options={options}
        correct={STATE_LABEL[state]}
        disabled={disabled}
        answerState={answerState}
        onPick={onAnswer}
      />
    </>
  );
}

const waterStates: GameDefinition<Payload, string> = {
  id: 'water-states',
  title: 'Морозиво для друга', // дошкільна версія — дослід (10.10); шкільна лишилась «Стани води» в коді
  image: '/count/ice_pop.webp',
  subject: 'science',
  levels: ['L0'],
  icon: '💧',
  description: 'Стани води.',
  accent: '#DBEAFE',
  generate,
  Component,
  // TODO(A2-наука): skills після seed skill-graph науки
};

export default waterStates;
