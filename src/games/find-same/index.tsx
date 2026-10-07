import type { GameDefinition, GameComponentProps } from '../types';
import { PromptCard, ChoiceGrid } from '../shared/ui';
import { generate, type Payload } from './generate';

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, string>) {
  const { target, cells } = round.payload;
  return (
    <>
      <PromptCard question="Знайди такий самий" answerState={answerState}>
        <div style={{ fontSize: 80, lineHeight: 1.1 }}>{target}</div>
      </PromptCard>
      <ChoiceGrid
        options={cells.map((c, i) => ({ value: String(i), node: <span style={{ fontSize: cells.length > 9 ? 40 : 48 }}>{c}</span> }))}
        correct={round.answer}
        disabled={disabled}
        answerState={answerState}
        onPick={onAnswer}
        columns={cells.length > 9 ? 4 : 3}
      />
    </>
  );
}

const findSame: GameDefinition<Payload, string> = {
  id: 'find-same',
  title: 'Знайди такий самий',
  subject: 'attention',
  levels: ['L0', 'L3'],
  icon: '🔍',
  description: 'Серед схожих картинок знайди точно таку, як зразок.',
  accent: '#FCE7F3',
  generate,
  Component,
};

export default findSame;
