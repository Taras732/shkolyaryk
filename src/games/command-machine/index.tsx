import { useState } from 'react';
import type {
  GameDefinition,
  GameComponentProps,
  Difficulty,
  LevelData,
  Round,
  ProfileLevel,
  ClassLevel,
} from '../types';
import { classBand, gradeBandFor } from '../types';
import { PromptCard, ChoiceGrid } from '../shared/ui';
import {
  buildUsableTask,
  trace,
  commandLabel,
  createRng,
  key,
  type Band,
  type Command,
  type State,
} from './core';

const ROUNDS_PER_LEVEL = 5;

interface Payload {
  start: State;
  commands: Command[];
  options: State[];
}

function bandFor(level: ProfileLevel, difficulty: Difficulty, classLevel?: ClassLevel): Band {
  const b = classLevel ? classBand(classLevel, difficulty) : gradeBandFor(level, difficulty);
  return b === 'L0' ? 'L1' : (b as Band);
}

function generate(difficulty: Difficulty, level: ProfileLevel, classLevel?: ClassLevel): LevelData<Payload, string> {
  const band = bandFor(level, difficulty, classLevel);
  const rng = createRng(0xc0de ^ (difficulty * 7919) ^ band.charCodeAt(1) * 131);
  const rounds: Round<Payload, string>[] = Array.from({ length: ROUNDS_PER_LEVEL }, (_, i) => {
    const t = buildUsableTask(band, rng);
    // відповідь порівнюється як рядок — ChoiceGrid працює зі string
    return { id: `r${i}`, payload: { start: t.start, commands: t.commands, options: t.options }, answer: key(t.correct) };
  });
  return { difficulty, rounds };
}

/** Ряд клітинок. */
function Row({ state, small = false }: { state: State; small?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', gap: 3, justifyContent: 'center' }}>
      {state.map((c, i) => (
        <span key={i} style={{ fontSize: small ? 20 : 26, lineHeight: 1 }}>
          {c}
        </span>
      ))}
    </span>
  );
}

/** Список команд — те, що треба виконати по черзі. */
function CommandList({ commands }: { commands: Command[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '12px auto', maxWidth: 300 }}>
      {commands.map((c, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 9,
            alignItems: 'center',
            background: 'var(--c-primary-soft)',
            borderRadius: 'var(--c-r-sm)',
            padding: '8px 12px',
            textAlign: 'left',
          }}
        >
          <span
            style={{
              flexShrink: 0,
              width: 20,
              height: 20,
              borderRadius: 999,
              background: 'var(--c-primary)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {i + 1}
          </span>
          <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--c-ink)' }}>{commandLabel(c)}</span>
        </div>
      ))}
    </div>
  );
}

/** Розв'язок покроково — видно, як стан міняється після КОЖНОЇ команди. */
function TraceView({ start, commands }: { start: State; commands: Command[] }) {
  const steps = trace(start, commands);
  return (
    <div style={{ marginTop: 10, background: 'var(--c-ok-bg)', border: '1px solid var(--c-ok-line)', borderRadius: 'var(--c-r-sm)', padding: '12px 14px' }}>
      <div style={{ fontWeight: 900, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--c-ok-ink)', marginBottom: 8 }}>
        Крок за кроком
      </div>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--c-mut)', minWidth: 52, textAlign: 'left' }}>
            {i === 0 ? 'початок' : `крок ${i}`}
          </span>
          <Row state={s} small />
        </div>
      ))}
    </div>
  );
}

function RulesIntro({ onStart }: { onStart: () => void }) {
  const demoStart: State = ['🔴', '🔵', '🟢'];
  const demoCmds: Command[] = [{ kind: 'swap-ends' }, { kind: 'remove', cell: '🔵' }];
  return (
    <div className="g-card" style={{ maxWidth: 360, margin: '0 auto' }}>
      <div style={{ fontSize: 34, marginBottom: 4 }}>🤖</div>
      <h2 className="g-title" style={{ fontSize: 19, margin: '0 0 8px' }}>Машина команд</h2>
      <p style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--c-ink)', lineHeight: 1.5, margin: '0 0 4px' }}>
        Машина виконує команди <b>по черзі, зверху вниз</b>. Кожна команда змінює те, що лишила попередня.
      </p>
      <div style={{ margin: '10px 0 2px' }}>
        <Row state={demoStart} />
      </div>
      <CommandList commands={demoCmds} />
      <TraceView start={demoStart} commands={demoCmds} />
      <p style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--c-mut)', lineHeight: 1.45, margin: '12px 0 14px' }}>
        Порядок важливий: якщо переставити команди — вийде інше 🎯
      </p>
      <button type="button" className="g-btn primary" onClick={onStart}>
        Спробувати 🤖
      </button>
    </div>
  );
}

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, string>) {
  const { start, commands, options } = round.payload;
  const [showIntro, setShowIntro] = useState(true);

  if (showIntro) return <RulesIntro onStart={() => setShowIntro(false)} />;

  // при помилці показуємо ВЕСЬ ланцюг станів — розв'язок, а не «невірно»
  const reveal = answerState === 'incorrect';

  return (
    <>
      <PromptCard question="Що буде після всіх команд?" answerState={answerState}>
        <div style={{ margin: '8px 0 2px' }}>
          <Row state={start} />
        </div>
        <CommandList commands={commands} />
        {reveal && <TraceView start={start} commands={commands} />}
      </PromptCard>
      <ChoiceGrid
        options={options.map((o) => ({ value: key(o), node: <Row state={o} small /> }))}
        correct={round.answer}
        disabled={disabled}
        answerState={answerState}
        onPick={onAnswer}
        columns={1}
      />
    </>
  );
}

const commandMachine: GameDefinition<Payload, string> = {
  id: 'command-machine',
  title: 'Машина команд',
  subject: 'logic',
  levels: ['L0', 'L3'],
  icon: '🤖',
  description: 'Виконай команди по черзі — що вийде в кінці?',
  accent: '#EEEBFF',
  generate,
  Component,
  // TODO(skill-граф інформатики/логіки): skills після відповідного seed
};

export default commandMachine;
