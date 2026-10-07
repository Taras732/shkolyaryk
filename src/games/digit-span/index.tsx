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
import Keypad from './Keypad';

interface Payload {
  digits: string;
}

const ROUNDS_PER_LEVEL = 5;
/** Мінімальний час показу ряду + додатковий час на кожну цифру. */
const MIN_SHOW_MS = 1500;
const MS_PER_DIGIT = 700;

/**
 * Скільки показувати ряд: довший ряд — довше. Чиста функція (тестується напряму).
 */
export function showDurationMs(digitCount: number): number {
  return Math.max(MIN_SHOW_MS, digitCount * MS_PER_DIGIT);
}

/** Довжина ряду цифр за рівнем профілю та складністю. */
function lengthFor(level: ProfileLevel, difficulty: Difficulty): number {
  if (level === 'L0') {
    if (difficulty === 1) return 2;
    return 3; // diff2 та diff3
  }
  // L3
  if (difficulty === 1) return 3;
  if (difficulty === 2) return randInt(4, 5);
  return randInt(5, 7);
}

function genDigits(length: number): string {
  let s = '';
  for (let i = 0; i < length; i++) s += String(randInt(0, 9));
  return s;
}

function generate(difficulty: Difficulty, level: ProfileLevel): LevelData<Payload, string> {
  const rounds: Round<Payload, string>[] = Array.from({ length: ROUNDS_PER_LEVEL }, (_, i) => {
    const digits = genDigits(lengthFor(level, difficulty));
    return { id: `r${i}`, payload: { digits }, answer: digits };
  });
  return { difficulty, rounds };
}

type Phase = 'show' | 'input';

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, string>) {
  const { digits } = round.payload;
  const [phase, setPhase] = useState<Phase>('show');
  const [entered, setEntered] = useState('');

  // Показ ряду: через розрахований час переходимо до вводу. Залежність від phase —
  // щоб «Показати ще раз» (Q22) теж запускав відлік, а не лише перше монтування.
  useEffect(() => {
    if (phase !== 'show') return;
    const timer = setTimeout(() => setPhase('input'), showDurationMs(digits.length));
    return () => clearTimeout(timer);
  }, [phase, digits.length]);

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

  // Q22 — вихід із глухого кута: забула ряд → може подивитись знову, а не вгадувати.
  // Ми вчимо, а не міряємо памʼять: дитині без виходу лишалась тільки фрустрація.
  const handleShowAgain = () => {
    if (disabled || phase !== 'input') return;
    setEntered('');
    setPhase('show');
  };

  if (phase === 'show') {
    return (
      <PromptCard question="Запам'ятай!" answerState="idle">
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

  // Підказка «Правильно: X» показується лише при помилці. Це допомога, а не докір,
  // тому зелена — як .reveal у ChoiceGrid. Червоним лишається тільки ввід дитини.
  const revealColor = 'var(--c-ok-ink)';

  return (
    <>
      <PromptCard question="Введи цифри" answerState={answerState}>
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

      <div
        style={{
          textAlign: 'center',
          fontSize: 14,
          fontWeight: 700,
          minHeight: 20,
          margin: '2px 0 12px',
          color: revealColor,
        }}
      >
        {answerState === 'incorrect' ? `Правильно: ${round.answer}` : ' '}
      </div>

      <Keypad
        value={entered}
        disabled={disabled}
        onDigit={handleDigit}
        onBackspace={handleBackspace}
        onSubmit={handleSubmit}
      />

      <button
        className="g-btn ghost"
        style={{ marginTop: 10 }}
        disabled={disabled}
        onClick={handleShowAgain}
      >
        👀 Показати ще раз
      </button>
    </>
  );
}

const digitSpan: GameDefinition<Payload, string> = {
  id: 'digit-span',
  title: "Запам'ятай цифри",
  subject: 'memory',
  levels: ['L0', 'L3'],
  icon: '🔟',
  description: "Запам'ятай ряд цифр і введи його.",
  accent: '#EEEBFF',
  generate,
  Component,
  // TODO(A2-память): skills після seed skill-graph пам'яті
};

export default digitSpan;
