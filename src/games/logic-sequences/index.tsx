import { useMemo, type CSSProperties } from 'react';
import type { GameDefinition, GameComponentProps, Difficulty, LevelData, Round, ProfileLevel } from '../types';
import { PromptCard, ChoiceGrid, randInt, numberDecoys } from '../shared/ui';

interface Payload {
  sequence: number[];
  hidden: number;
}

type PatternKind = 'linear' | 'triangular' | 'doubling';

interface Config {
  /** Загальна довжина ряду (видимі елементи + 1 схований). */
  length: number;
  max: number;
  steps: number[];
  kinds: PatternKind[];
  descending: boolean;
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function configFor(difficulty: Difficulty, level: ProfileLevel): Config {
  if (level === 'L0') {
    if (difficulty === 1) return { length: 4, max: 10, steps: [1], kinds: ['linear'], descending: false };
    if (difficulty === 2) return { length: 4, max: 15, steps: [1, 2], kinds: ['linear'], descending: false };
    return { length: 5, max: 20, steps: [1, 2], kinds: ['linear'], descending: false };
  }
  // L3
  if (difficulty === 1) return { length: 4, max: 60, steps: [2, 3, 5], kinds: ['linear'], descending: false };
  if (difficulty === 2) return { length: 4, max: 100, steps: [3], kinds: ['linear', 'doubling'], descending: true };
  return { length: 5, max: 200, steps: [2, 3, 4], kinds: ['triangular', 'doubling', 'linear'], descending: true };
}

/** Лінійний ряд (крок +N/-N), гарантовано в межах [0, max]. */
function buildLinear(length: number, max: number, steps: number[], allowDescending: boolean): number[] {
  const step = pick(steps);
  const descending = allowDescending && Math.random() < 0.5;
  const signedStep = descending ? -step : step;
  const neededRange = Math.abs(signedStep) * (length - 1);

  let start: number;
  if (descending) {
    const minStart = neededRange + 1;
    const maxStart = Math.max(minStart, max);
    start = randInt(minStart, maxStart);
  } else {
    const maxStart = Math.max(0, max - neededRange);
    start = randInt(0, maxStart);
  }

  const seq: number[] = [];
  for (let i = 0; i < length; i++) seq.push(start + signedStep * i);
  return seq;
}

/** Трикутний ряд: крок зростає на 1 щоразу (1,3,6,10,15…). */
function buildTriangular(length: number, max: number): number[] {
  const startStep = randInt(1, 3);
  const startVal = randInt(0, 5);
  const seq: number[] = [startVal];
  let step = startStep;
  for (let i = 0; i < length - 1; i++) {
    seq.push(seq[i] + step);
    step += 1;
  }
  if (seq[seq.length - 1] > max) return buildLinear(length, max, [2, 3, 5], false);
  return seq;
}

/** Подвоєння: кожен наступний елемент удвічі більший. */
function buildDoubling(length: number, max: number): number[] {
  const start = pick([1, 2, 3]);
  const seq: number[] = [start];
  for (let i = 0; i < length - 1; i++) seq.push(seq[i] * 2);
  if (seq[seq.length - 1] > max) return buildLinear(length, max, [2, 3, 5], false);
  return seq;
}

function buildSequence(cfg: Config): number[] {
  const kind = pick(cfg.kinds);
  if (kind === 'triangular') return buildTriangular(cfg.length, cfg.max);
  if (kind === 'doubling') return buildDoubling(cfg.length, cfg.max);
  return buildLinear(cfg.length, cfg.max, cfg.steps, cfg.descending);
}

function generate(difficulty: Difficulty, level: ProfileLevel): LevelData<Payload, number> {
  const cfg = configFor(difficulty, level);
  const rounds: Round<Payload, number>[] = [];
  // без повторів: на L0 рядів мало (крок +1 до 10 — лише 7), і той самий ряд випадав кілька разів за гру
  const seen = new Set<string>();
  for (let i = 0; i < 5; i++) {
    let sequence = buildSequence(cfg);
    const prevAnswer = rounds[i - 1]?.answer;
    for (let t = 0; t < 50 && (seen.has(sequence.join(',')) || sequence[sequence.length - 1] === prevAnswer); t++) sequence = buildSequence(cfg);
    seen.add(sequence.join(','));
    const hidden = sequence.length - 1;
    rounds.push({
      id: `r${i}`,
      payload: { sequence, hidden },
      answer: sequence[hidden],
    });
  }
  return { difficulty, rounds };
}

const cardStyle: CSSProperties = {
  minWidth: 56,
  padding: '10px 14px',
  textAlign: 'center',
  fontWeight: 800,
  fontSize: 28,
  fontFamily: 'var(--font-round)',
  border: '1px solid var(--c-line)',
  borderRadius: 14,
  background: 'var(--c-card)',
  color: 'var(--c-ink)',
};

const hiddenCardStyle: CSSProperties = {
  ...cardStyle,
  background: 'var(--c-primary-soft)',
  color: 'var(--c-primary)',
  border: '1.5px dashed var(--c-primary)',
};

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, number>) {
  const { sequence, hidden } = round.payload;
  const answer = round.answer;
  // numberDecoys() кличе Math.random() — рахуємо один раз на round.id, щоб варіанти
  // не тасувались заново при кожному ре-рендері (напр. після невірної відповіді).
  const options = useMemo(() => {
    const lastDiff = hidden > 0 ? Math.abs(sequence[hidden] - sequence[hidden - 1]) : 1;
    const spread = Math.max(3, lastDiff * 2);
    return numberDecoys(answer, 4, spread, 0).map((v) => ({ value: v }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round.id]);

  return (
    <>
      <PromptCard question="Продовж ряд: яке число наступне?" answerState={answerState}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 10,
            margin: '8px auto',
            maxWidth: 340,
          }}
        >
          {sequence.map((n, idx) => (
            <div key={idx} style={idx === hidden ? hiddenCardStyle : cardStyle}>
              {idx === hidden ? '?' : n}
            </div>
          ))}
        </div>
      </PromptCard>
      <ChoiceGrid options={options} correct={answer} disabled={disabled} answerState={answerState} onPick={onAnswer} />
    </>
  );
}

const logicSequences: GameDefinition<Payload, number> = {
  id: 'logic-sequences',
  title: 'Послідовності',
  subject: 'logic',
  levels: ['L0', 'L3'],
  icon: '🧩',
  description: 'Продовж ряд: яке число наступне?',
  accent: '#DCFCE7',
  generate,
  Component,
  // TODO(A2-логіка): skills після seed skill-graph логіки
};

export default logicSequences;
