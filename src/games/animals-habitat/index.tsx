import { useMemo } from 'react';
import type { GameDefinition, GameComponentProps, Difficulty, LevelData, Round } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { usePreschool } from '../shared/preschool';
import { KidsHabitat, generateKids, type KidHabP } from './kids';

type HabitatId = 'savanna' | 'water' | 'forest' | 'arctic' | 'desert' | 'jungle';

interface Payload {
  emoji: string;
  habitat: HabitatId;
}

const HABITAT_LABEL: Record<HabitatId, string> = {
  savanna: 'Савана',
  water: 'Вода',
  forest: 'Ліс',
  arctic: 'Арктика',
  desert: 'Пустеля',
  jungle: 'Джунглі',
};

/** Порядок для ChoiceGrid — усі 6 середовищ завжди присутні як варіанти. */
const HABITAT_ORDER: HabitatId[] = ['savanna', 'water', 'forest', 'arctic', 'desert', 'jungle'];

interface AnimalEntry {
  emoji: string;
  habitat: HabitatId;
  basic: boolean;
}

const ANIMALS: AnimalEntry[] = [
  { emoji: '🦁', habitat: 'savanna', basic: true },
  { emoji: '🦒', habitat: 'savanna', basic: false },
  { emoji: '🐘', habitat: 'savanna', basic: false },

  { emoji: '🐟', habitat: 'water', basic: true },
  { emoji: '🐬', habitat: 'water', basic: false },
  { emoji: '🦀', habitat: 'water', basic: false },

  { emoji: '🐻', habitat: 'forest', basic: true },
  { emoji: '🦊', habitat: 'forest', basic: false },
  { emoji: '🦉', habitat: 'forest', basic: false },

  { emoji: '🐧', habitat: 'arctic', basic: true },
  { emoji: '🦭', habitat: 'arctic', basic: false },

  { emoji: '🐪', habitat: 'desert', basic: true },
  { emoji: '🦎', habitat: 'desert', basic: false },

  { emoji: '🐒', habitat: 'jungle', basic: true },
  { emoji: '🦜', habitat: 'jungle', basic: false },
];

function poolFor(difficulty: Difficulty): AnimalEntry[] {
  return difficulty === 1 ? ANIMALS.filter((a) => a.basic) : ANIMALS;
}

function generate(difficulty: Difficulty, level?: string): LevelData<Payload, string> {
  if (level === 'L0') return generateKids(difficulty) as unknown as LevelData<Payload, string>;
  const pool = shuffle(poolFor(difficulty));
  const rounds: Round<Payload, string>[] = [];
  for (let i = 0; i < 5; i++) {
    const item = pool[i % pool.length];
    rounds.push({
      id: `r${i}`,
      payload: { emoji: item.emoji, habitat: item.habitat },
      answer: HABITAT_LABEL[item.habitat],
    });
  }
  return { difficulty, rounds };
}

function Component(props: GameComponentProps<Payload, string>) {
  const preschool = usePreschool();
  if (preschool && (props.round.payload as unknown as KidHabP).kid) return <KidsHabitat {...(props as unknown as GameComponentProps<KidHabP, string>)} />;
  return <SchoolHabitat {...props} />;
}

function SchoolHabitat({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, string>) {
  const { emoji, habitat } = round.payload;
  // shuffle() кличе Math.random() — рахуємо один раз на round.id, щоб порядок варіантів
  // не мінявся при кожному ре-рендері (напр. після невірної відповіді).
  const options = useMemo(
    () => shuffle(HABITAT_ORDER.map((h) => ({ value: HABITAT_LABEL[h] }))),
    [round.id],
  );
  return (
    <>
      <PromptCard question="Де живе ця тварина?" answerState={answerState}>
        <div style={{ fontSize: 96, textAlign: 'center', margin: '8px auto' }}>{emoji}</div>
      </PromptCard>
      <ChoiceGrid
        options={options}
        correct={HABITAT_LABEL[habitat]}
        disabled={disabled}
        answerState={answerState}
        onPick={onAnswer}
        columns={3}
      />
    </>
  );
}

const animalsHabitat: GameDefinition<Payload, string> = {
  id: 'animals-habitat',
  title: 'Де живе тварина?',
  subject: 'science',
  levels: ['L0'],
  icon: '🦁',
  description: 'Де живе тварина?',
  accent: '#DCFCE7',
  generate,
  Component,
  // TODO(A2-наука): skills після seed skill-graph науки
};

export default animalsHabitat;
