import { useEffect, useState } from 'react';
import type {
  GameDefinition,
  GameComponentProps,
  Difficulty,
  LevelData,
  Round,
  ProfileLevel,
} from '../types';
import { PromptCard, randInt } from '../shared/ui';

interface Payload {
  digits: string;
}

const ROUNDS_PER_LEVEL = 5;
/** Мінімальний час показу ряду + додатковий час на кожну цифру. */
const MIN_SHOW_MS = 1500;
const MS_PER_DIGIT = 700;

/** Довжина ряду цифр за рівнем профілю та складністю. */
function lengthFor(level: ProfileLevel, difficulty: Difficulty): number {
  if (level === 'L0') return difficulty === 1 ? 2 : 3;
  // L3
  if (difficulty === 1) return 3;
  if (difficulty === 2) return 4;
  return 5;
}

function genDigits(length: number): string {
  let s = '';
  for (let i = 0; i < length; i++) s += String(randInt(0, 9));
  return s;
}

function generate(difficulty: Difficulty, level: ProfileLevel): LevelData<Payload, string> {
  const rounds: Round<Payload, string>[] = Array.from({ length: ROUNDS_PER_LEVEL }, (_, i) => {
    const digits = genDigits(lengthFor(level, difficulty));
    const answer = digits.split('').reverse().join('');
    return { id: `r${i}`, payload: { digits }, answer };
  });
  return { difficulty, rounds };
}

type Phase = 'show' | 'input';

/** Числова клавіатура: 0-9 + стерти, і окрема кнопка підтвердження (власна копія digit-span/Keypad). */
function Keypad({
  value,
  maxLen,
  disabled,
  onDigit,
  onBackspace,
  onSubmit,
}: {
  value: string;
  maxLen: number;
  disabled: boolean;
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
}) {
  const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const full = value.length >= maxLen;
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {DIGITS.map((d) => (
          <button key={d} className="g-choice" disabled={disabled || full} onClick={() => onDigit(d)}>
            {d}
          </button>
        ))}
        <button className="g-choice" disabled={disabled || value === ''} aria-label="Стерти" onClick={onBackspace}>
          ⌫
        </button>
        <button className="g-choice" disabled={disabled || full} onClick={() => onDigit('0')}>
          0
        </button>
      </div>
      <button
        className="g-btn primary"
        style={{ marginTop: 14 }}
        disabled={disabled || value === ''}
        onClick={onSubmit}
      >
        Перевірити
      </button>
    </div>
  );
}

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, string>) {
  const { digits } = round.payload;
  const [phase, setPhase] = useState<Phase>('show');
  const [entered, setEntered] = useState('');

  // Показ ряду: через розрахований час переходимо до вводу.
  useEffect(() => {
    const showMs = Math.max(MIN_SHOW_MS, digits.length * MS_PER_DIGIT);
    const timer = setTimeout(() => setPhase('input'), showMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Скидаємо ввід, коли фідбек повертається в idle (повтор після помилки).
  useEffect(() => {
    if (answerState === 'idle') setEntered('');
  }, [answerState]);

  const handleDigit = (digit: string) => {
    if (disabled || phase !== 'input') return;
    setEntered((prev) => (prev.length >= digits.length ? prev : prev + digit));
  };

  const handleBackspace = () => {
    if (disabled || phase !== 'input') return;
    setEntered((prev) => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (disabled || phase !== 'input' || entered === '') return;
    onAnswer(entered);
  };

  if (phase === 'show') {
    return (
      <PromptCard question="Запам'ятай ряд!" answerState="idle">
        <div
          style={{
            textAlign: 'center',
            fontSize: 64,
            fontWeight: 900,
            letterSpacing: 10,
            color: 'var(--c-ink)',
            fontFamily: 'var(--font-round)',
          }}
        >
          {digits}
        </div>
      </PromptCard>
    );
  }

  const displayColor =
    answerState === 'correct'
      ? 'var(--c-green)'
      : answerState === 'incorrect'
        ? 'var(--c-err-ink)'
        : entered
          ? 'var(--c-primary)'
          : 'var(--c-mut)';

  return (
    <>
      <PromptCard question="Введи ряд навпаки" answerState={answerState}>
        <div
          style={{
            textAlign: 'center',
            fontSize: 40,
            fontWeight: 900,
            minHeight: 52,
            letterSpacing: 4,
            color: displayColor,
            fontFamily: 'var(--font-round)',
          }}
        >
          {entered || '—'}
        </div>
      </PromptCard>

      <Keypad
        value={entered}
        maxLen={digits.length}
        disabled={disabled}
        onDigit={handleDigit}
        onBackspace={handleBackspace}
        onSubmit={handleSubmit}
      />
    </>
  );
}

const reverseSequence: GameDefinition<Payload, string> = {
  id: 'reverse-sequence',
  title: 'Ряд навпаки',
  subject: 'memory',
  levels: ['L0', 'L3'],
  icon: '🔁',
  description: 'Введи ряд навпаки.',
  accent: '#FCE7F3',
  generate,
  Component,
  // TODO(A2-память): skills після seed skill-graph пам'яті
};

export default reverseSequence;
