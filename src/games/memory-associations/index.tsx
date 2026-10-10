import { useEffect, useState } from 'react';
import type { GameDefinition, GameComponentProps, Difficulty, LevelData, Round, ProfileLevel } from '../types';
import type { Choice } from '../shared/ui';
import { PromptCard, ChoiceGrid, shuffle, randInt } from '../shared/ui';
import { usePreschool } from '../shared/preschool';
import { KidsAssoc, generateKids, type KidAssocP } from './kids';

interface PairItem {
  key: string;
  a: string;
  b: string;
}

interface Payload {
  pairs: PairItem[];
  query: string;
  queryIsA: boolean;
}

const ROUNDS_PER_LEVEL = 5;

const SEMANTIC_PAIRS: PairItem[] = [
  { key: 'dog-bone', a: '🐶', b: '🦴' },
  { key: 'bee-flower', a: '🐝', b: '🌸' },
  { key: 'cow-milk', a: '🐄', b: '🥛' },
  { key: 'hen-egg', a: '🐔', b: '🥚' },
  { key: 'rabbit-carrot', a: '🐰', b: '🥕' },
  { key: 'key-lock', a: '🔑', b: '🔒' },
  { key: 'rain-umbrella', a: '🌧️', b: '☂️' },
  { key: 'sun-glasses', a: '☀️', b: '🕶️' },
  { key: 'fish-hook', a: '🐟', b: '🎣' },
  { key: 'thread-needle', a: '🧵', b: '🪡' },
  { key: 'tooth-brush', a: '🦷', b: '🪥' },
  { key: 'snow-sled', a: '❄️', b: '🛷' },
];

/** Скільки пар запам'ятовувати за рівнем профілю та складністю. */
function pairsFor(level: ProfileLevel, difficulty: Difficulty): number {
  if (level === 'L0') return difficulty === 1 ? 3 : difficulty === 2 ? 4 : 5;
  return difficulty === 1 ? 4 : difficulty === 2 ? 5 : 6;
}

function generate(difficulty: Difficulty, level: ProfileLevel): LevelData<Payload, string> {
  if (level === 'L0') return generateKids(difficulty) as unknown as LevelData<Payload, string>;
  const n = pairsFor(level, difficulty);
  const rounds: Round<Payload, string>[] = Array.from({ length: ROUNDS_PER_LEVEL }, (_, i) => {
    const pairs = shuffle(SEMANTIC_PAIRS).slice(0, n);
    const target = pairs[randInt(0, pairs.length - 1)];
    const queryIsA = Math.random() < 0.5;
    const query = queryIsA ? target.a : target.b;
    const answer = queryIsA ? target.b : target.a;
    return { id: `r${i}`, payload: { pairs, query, queryIsA }, answer };
  });
  return { difficulty, rounds };
}

function Component(props: GameComponentProps<Payload, string>) {
  const preschool = usePreschool();
  if (preschool && (props.round.payload as unknown as KidAssocP).kid)
    return <KidsAssoc {...(props as unknown as GameComponentProps<KidAssocP, string>)} />;
  return <SchoolAssoc {...props} />;
}

function SchoolAssoc({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, string>) {
  const { pairs, query, queryIsA } = round.payload;
  const [phase, setPhase] = useState<'memorize' | 'answer'>('memorize');

  // Показ пар: через розрахований час переходимо до фази відповіді.
  // (Скидання фаз між раундами відбувається через key={round.id} у GameShell — перемонтування.)
  useEffect(() => {
    const showMs = Math.max(1800, pairs.length * 900);
    const timer = setTimeout(() => setPhase('answer'), showMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === 'memorize') {
    return (
      <PromptCard question="Запам'ятай пари!" answerState="idle">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', margin: '8px auto' }}>
          {pairs.map((p) => (
            <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 40 }}>
              <span>{p.a}</span>
              <span style={{ fontSize: 20, color: 'var(--c-mut)' }}>↔</span>
              <span>{p.b}</span>
            </div>
          ))}
        </div>
      </PromptCard>
    );
  }

  const options: Choice<string>[] = shuffle(pairs.map((p) => (queryIsA ? p.b : p.a))).map((v) => ({ value: v }));

  return (
    <>
      <PromptCard question="Хто в парі з цим?" answerState={answerState}>
        <div style={{ textAlign: 'center', fontSize: 64, margin: '8px auto' }}>{query}</div>
      </PromptCard>
      <ChoiceGrid options={options} correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} />
    </>
  );
}

const memoryAssociations: GameDefinition<Payload, string> = {
  id: 'memory-associations',
  title: 'Асоціації',
  subject: 'memory',
  levels: ['L0', 'L3'],
  icon: '🔗',
  description: "Запам'ятай пари.",
  accent: '#FCE7F3',
  generate,
  Component,
  // TODO(A2-память): skills після seed skill-graph пам'яті
};

export default memoryAssociations;
