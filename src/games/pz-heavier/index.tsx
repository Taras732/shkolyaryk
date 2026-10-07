import type { GameDefinition, GameComponentProps, GameExplain, Round } from '../types';
import { PromptCard, ChoiceGrid } from '../shared/ui';
import { generate, type Payload } from './generate';

/** Одне зважування: важчий опускається, легший — угорі. */
function Weighing({ heavy, light }: { heavy: string; light: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, transform: 'rotate(10deg)' }}>
        <span style={{ fontSize: 36, borderBottom: '4px solid #64748B', padding: '0 6px' }}>{light}</span>
        <span style={{ fontSize: 36, borderBottom: '4px solid #64748B', padding: '0 6px' }}>{heavy}</span>
      </div>
      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--c-mut)' }}>
        {heavy} важче за {light}
      </span>
    </div>
  );
}

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, string>) {
  const { weighings, ask, options } = round.payload;
  return (
    <>
      <PromptCard question={ask === 'heaviest' ? 'Хто найважчий?' : 'Хто найлегший?'} answerState={answerState}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 6 }}>
          {weighings.map((w, i) => (
            <Weighing key={i} {...w} />
          ))}
        </div>
      </PromptCard>
      <ChoiceGrid
        options={options.map((o) => ({ value: o, node: <span style={{ fontSize: 48 }}>{o}</span> }))}
        correct={round.answer}
        disabled={disabled}
        answerState={answerState}
        onPick={onAnswer}
        columns={options.length === 4 ? 2 : 3}
      />
    </>
  );
}

/** Пояснення: ланцюжок від найважчого до найлегшого. */
function explain(round: Round<Payload, string>): GameExplain {
  const { weighings } = round.payload;
  const next = new Map(weighings.map((w) => [w.heavy, w.light]));
  const lights = new Set(weighings.map((w) => w.light));
  let cur = weighings.map((w) => w.heavy).find((h) => !lights.has(h))!;
  const chain = [cur];
  while (next.has(cur)) {
    cur = next.get(cur)!;
    chain.push(cur);
  }
  return { steps: [`Склади ланцюжок: ${chain.join(' > ')}`, `Найважчий — ${chain[0]}, найлегший — ${chain[chain.length - 1]}`] };
}

const pzHeavier: GameDefinition<Payload, string> = {
  id: 'pz-heavier',
  title: 'Хто важчий?',
  subject: 'logic',
  levels: ['L0', 'L3'],
  icon: '🏋️',
  description: 'За зважуваннями здогадайся, хто найважчий, а хто найлегший.',
  accent: '#E0E7FF',
  generate,
  explain,
  Component,
};

export default pzHeavier;
