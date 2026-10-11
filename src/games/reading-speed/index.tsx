import type { GameDefinition, GameComponentProps } from '../types';
import { PromptCard, ChoiceGrid } from '../shared/ui';
import { generate, type Payload } from './generate';

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, string>) {
  const { mode, text, question, options } = round.payload;
  const isPicture = mode === 'picture';
  const choices = options.map((o) => ({
    value: o,
    node: <span style={{ fontSize: isPicture ? 40 : 18, fontWeight: isPicture ? 400 : 700 }}>{o}</span>,
  }));

  return (
    <>
      <PromptCard question={question} answerState={answerState}>
        <div
          style={{
            fontSize: isPicture ? 40 : 22,
            fontWeight: 800,
            color: 'var(--c-primary)',
            textAlign: 'center',
            lineHeight: 1.4,
            margin: '8px auto',
            maxWidth: 320,
          }}
        >
          {text}
        </div>
      </PromptCard>
      <ChoiceGrid
        options={choices}
        correct={round.answer}
        disabled={disabled}
        answerState={answerState}
        onPick={onAnswer}
        columns={choices.length === 3 ? 3 : 2}
      />
    </>
  );
}

const readingSpeed: GameDefinition<Payload, string> = {
  id: 'reading-speed',
  title: 'Читаю і розумію',
  subject: 'language',
  levels: ['L3'],
  icon: '📖',
  description: 'Читай уважно і розумій зміст: обери слово чи картинку за змістом, а не за схожістю літер.',
  accent: '#EEEBFF',
  // TODO: мапінг на мовні skills коли зʼявляться
  // 11.10: читання на швидкість з розумінням — плавне свідоме читання (2 клас)
  skillsFor: () => ['language.reading.l2.fluent-reading'],
  generate,
  Component,
};

export default readingSpeed;
