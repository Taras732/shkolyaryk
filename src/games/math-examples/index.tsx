import { useEffect, useState } from 'react';
import type { GameDefinition, GameComponentProps } from '../types';
import { PromptCard } from '../shared/ui';
import Keypad from './Keypad';
import { generate, type Payload } from './generate';

const MAX_INPUT_LEN = 4;

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, number>) {
  const { a, b, op } = round.payload;
  const [entered, setEntered] = useState('');

  // Скидаємо ввід, коли фідбек повертається в idle (новий раунд або повтор після помилки).
  useEffect(() => {
    if (answerState === 'idle') setEntered('');
  }, [answerState]);

  const handleDigit = (digit: string) => {
    if (disabled) return;
    setEntered((prev) => (prev.length >= MAX_INPUT_LEN ? prev : prev + digit));
  };

  const handleBackspace = () => {
    if (disabled) return;
    setEntered((prev) => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (disabled || entered === '') return;
    onAnswer(Number(entered));
  };

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
      <PromptCard question="Розв'яжи приклад" answerState={answerState}>
        <div style={{ fontSize: 44, fontWeight: 900, color: 'var(--c-ink)', fontFamily: 'var(--font-round)' }}>
          {a} {op} {b} = ?
        </div>
      </PromptCard>

      <div
        style={{
          textAlign: 'center',
          fontSize: 40,
          fontWeight: 900,
          minHeight: 52,
          margin: '4px 0 18px',
          color: displayColor,
          fontFamily: 'var(--font-round)',
        }}
      >
        {entered || '—'}
      </div>

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
    </>
  );
}

const mathExamples: GameDefinition<Payload, number> = {
  id: 'math-examples',
  title: 'Приклади',
  subject: 'math',
  levels: ['L0', 'L3'],
  icon: '➕',
  description: "Розв'яжи приклад — введи відповідь.",
  accent: '#EEEBFF',
  // Гра спільна для L0 (лише +, межа 10) і L3 (+,−,×,÷ залежно від складності, межа 100);
  // skillIds не розрізняє рівень профілю, тож відображає складніший L3-контент.
  skillIds: {
    1: ['math.ops.l2.add-sub-no-carry-100', 'math.ops.l2.mult-table-2-3'],
    2: ['math.ops.l2.add-sub-carry-100', 'math.ops.l3.mult-table-4-9', 'math.ops.l2.division-table'],
    3: ['math.ops.l2.add-sub-carry-100', 'math.ops.l2.mult-table-2-3'],
  },
  // 11.10: навички за класом × складністю (CLASS_BAND, програма Савченко)
  skillsFor: (d, cl) => {
    if (cl === 'grade1' || cl === 'preschool') return d === 1 ? ['math.ops.l1.add-sub-10'] : ['math.ops.l1.add-sub-no-carry-20'];
    if (cl === 'grade2') {
      if (d === 1) return ['math.ops.l2.add-sub-no-carry-100', 'math.ops.l2.add-sub-carry-100', 'math.ops.l2.add-sub-carry-20'];
      if (d === 2) return ['math.ops.l2.add-sub-carry-100', 'math.ops.l2.mult-table-2-3'];
      return ['math.ops.l2.add-sub-carry-100', 'math.ops.l2.mult-table-2-3', 'math.ops.l2.division-table'];
    }
    return ['math.ops.l3.add-sub-1000', 'math.ops.l3.mult-table-4-9', 'math.ops.l2.division-table'];
  },

  // 11.10: «чому так» — за 💡 після відповіді
  explain: (round) => {
    const { a, b, op, correct } = round.payload;
    const line = `${a} ${op} ${b} = ${correct}`;
    if (op === '+') return { steps: [line, `${a} і ще ${b} — це ${correct}.`] };
    if (op === '−') return { steps: [line, `Від ${a} забрали ${b} — лишилось ${correct}.`, `Перевір: ${correct} + ${b} = ${a}.`] };
    if (op === '×') return { steps: [line, `${a} × ${b} — це ${b} разів по ${a}.`] };
    return { steps: [line, `Бо ${correct} × ${b} = ${a}.`] };
  },
  generate,
  Component,
};

export default mathExamples;
