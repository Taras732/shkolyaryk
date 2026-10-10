import { useMemo } from 'react';
import type { GameDefinition, GameComponentProps, Difficulty, LevelData, Round } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { usePreschool } from '../shared/preschool';
import { KidsSink, type KidSinkP } from './kids';
import { RaftBoard, generateRaft, type RaftP } from './raft';
import { BOARD_DONE } from '../types';

type Behavior = 'sink' | 'float';

interface Payload {
  emoji: string;
  behavior: Behavior;
}

const BEHAVIOR_LABEL: Record<Behavior, string> = {
  sink: 'Тоне',
  float: 'Плаває',
};

interface ItemEntry {
  emoji: string;
  behavior: Behavior;
  basic: boolean;
}

const ITEMS: ItemEntry[] = [
  { emoji: '🪨', behavior: 'sink', basic: true },
  { emoji: '⚓', behavior: 'sink', basic: true },
  { emoji: '🔑', behavior: 'sink', basic: false },
  { emoji: '🍃', behavior: 'float', basic: true },
  { emoji: '🦆', behavior: 'float', basic: true },
  { emoji: '🍎', behavior: 'float', basic: false },
  { emoji: '🪵', behavior: 'float', basic: false },
  { emoji: '🧽', behavior: 'float', basic: false },
];

function poolFor(difficulty: Difficulty): ItemEntry[] {
  return difficulty === 1 ? ITEMS.filter((i) => i.basic) : ITEMS;
}

function generate(difficulty: Difficulty, level?: string): LevelData<Payload, string> {
  // дошкілля: «Пліт для друга» (10.10); акваріум «тоне чи плаває» (kids.tsx) лишився, не підключений
  if (level === 'L0') return generateRaft(difficulty) as unknown as LevelData<Payload, string>;
  const pool = shuffle(poolFor(difficulty));
  const rounds: Round<Payload, string>[] = [];
  for (let i = 0; i < 5; i++) {
    const item = pool[i % pool.length];
    rounds.push({
      id: `r${i}`,
      payload: { emoji: item.emoji, behavior: item.behavior },
      answer: BEHAVIOR_LABEL[item.behavior],
    });
  }
  return { difficulty, rounds };
}

function Component(props: GameComponentProps<Payload, string>) {
  const preschool = usePreschool();
  if (preschool && (props.round.payload as unknown as RaftP).raft) return <RaftBoard {...(props as unknown as GameComponentProps<RaftP, typeof BOARD_DONE>)} />;
  if (preschool && (props.round.payload as unknown as KidSinkP).kid) return <KidsSink {...(props as unknown as GameComponentProps<KidSinkP, string>)} />;
  return <SchoolSink {...props} />;
}

function SchoolSink({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, string>) {
  const { emoji, behavior } = round.payload;
  // shuffle() кличе Math.random() — рахуємо один раз на round.id, щоб порядок варіантів
  // не мінявся при кожному ре-рендері (напр. після невірної відповіді).
  const options = useMemo(
    () => shuffle((['sink', 'float'] as Behavior[]).map((b) => ({ value: BEHAVIOR_LABEL[b] }))),
    [round.id],
  );
  return (
    <>
      <PromptCard question="Тоне чи плаває?" answerState={answerState}>
        <div style={{ fontSize: 96, textAlign: 'center', margin: '8px auto' }}>{emoji}</div>
      </PromptCard>
      <ChoiceGrid
        options={options}
        correct={BEHAVIOR_LABEL[behavior]}
        disabled={disabled}
        answerState={answerState}
        onPick={onAnswer}
        columns={2}
      />
    </>
  );
}

const sinkFloat: GameDefinition<Payload, string> = {
  id: 'sink-float',
  title: 'Пліт для друга',
  subject: 'science',
  levels: ['L0'],
  image: '/count/sf_boat.webp',
  isCorrect: (r, a) => a === r.answer || (r.payload as unknown as RaftP).raft === true,
  icon: '🛟',
  description: 'Тоне чи плаває?',
  accent: '#CFFAFE',
  generate,
  Component,
  // TODO(A2-наука): skills після seed skill-graph науки
};

export default sinkFloat;
