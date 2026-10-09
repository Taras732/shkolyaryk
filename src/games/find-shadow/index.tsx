import type { GameDefinition, GameComponentProps } from '../types';
import { PromptCard, ChoiceGrid } from '../shared/ui';
import { emojiOf, generate, mirrored, type Payload } from './generate';

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, string>) {
  const { target, options } = round.payload;
  return (
    <>
      <PromptCard question="Чия це тінь? Знайди!" answerState={answerState}>
        <div style={{ fontSize: 96, lineHeight: 1.1 }}>{target}</div>
      </PromptCard>
      <ChoiceGrid
        options={options.map((o) => ({
          value: o,
          // після відповіді тінь «оживає» — дитина бачить, чия вона була
          // дзеркальна тінь — та сама картинка, віддзеркалена (сходинка 3)
          node: <span style={{ display: 'inline-block', fontSize: options.length > 4 ? 52 : 56, transform: mirrored(o) ? 'scaleX(-1)' : 'none', filter: answerState === 'idle' ? 'brightness(0)' : 'none', transition: 'filter .3s' }}>{emojiOf(o)}</span>,
        }))}
        correct={target}
        disabled={disabled}
        answerState={answerState}
        onPick={onAnswer}
        columns={options.length === 4 ? 4 : 3}
      />
    </>
  );
}

const findShadow: GameDefinition<Payload, string> = {
  id: 'find-shadow',
  title: 'Знайди тінь',
  subject: 'attention',
  levels: ['L0'],
  icon: '👤',
  description: 'Чия це тінь? Дивись на форму.',
  accent: '#E5E7EB',
  generate,
  Component,
};

export default findShadow;
