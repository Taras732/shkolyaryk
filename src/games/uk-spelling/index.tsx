import type { GameDefinition, GameComponentProps } from '../types';
import { PromptCard, ChoiceGrid } from '../shared/ui';
import { TOPICS } from './data';
import { explainSpelling, generate, type Payload } from './generate';

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, string>) {
  const { item, options } = round.payload;
  return (
    <>
      <PromptCard question="Як правильно написати?" answerState={answerState}>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--c-primary)' }}>{TOPICS[item.topic].title}</div>
      </PromptCard>
      <ChoiceGrid
        options={options.map((o) => ({ value: o, node: <span style={{ fontSize: 30, fontWeight: 900, textTransform: 'none' }}>{o}</span> }))}
        correct={round.answer}
        disabled={disabled}
        answerState={answerState}
        onPick={onAnswer}
      />
    </>
  );
}

const ukSpelling: GameDefinition<Payload, string> = {
  id: 'uk-spelling',
  title: 'Правопис',
  subject: 'language',
  levels: ['L3'],
  icon: '✍️',
  description: 'Обери, як правильно написати слово, — і запам’ятай правило.',
  accent: '#FEF9C3',
  // теми різняться за класом — тут навички 2 класу на «Легко/Середньо» і 3 класу на «Складно»
  skillIds: {
    1: ['language.orth.l2.zhy-shy-cha-shcha', 'language.orth.l2.soft-sign'],
    2: ['language.orth.l2.capital-geo-names', 'language.orth.l3.final-consonant-check'],
    3: ['language.orth.l3.apostrophe', 'language.sounds.l3.doubled-consonants', 'language.sounds.l3.unstressed-e-y-check', 'language.orth.l3.prefix-roz-bez'],
  },
  generate,
  explain: (round) => explainSpelling(round),
  Component,
};

export default ukSpelling;
