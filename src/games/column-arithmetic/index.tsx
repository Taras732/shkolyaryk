import { useEffect, useState } from 'react';
import type { GameDefinition, GameComponentProps } from '../types';
import { PromptCard } from '../shared/ui';
import Keypad from './Keypad';
import { generate, type Payload } from './generate';
import { addDigit, removeDigit, activeCellIndex, inputCells, enteredValue } from './input-core';

/** Один рядок стовпчика: опційний знак дії зліва + вирівняні праворуч розряди. */
function DigitRow({ text, digitCount, prefix = ' ' }: { text: string; digitCount: number; prefix?: string }) {
  const padded = text.padStart(digitCount, ' ');
  const cells = [prefix, ...padded.split('')];
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
      {cells.map((ch, i) => (
        <span
          key={i}
          style={{
            width: 28,
            textAlign: 'center',
            fontSize: 28,
            fontWeight: 900,
            fontFamily: 'var(--font-round)',
            color: 'var(--c-ink)',
          }}
        >
          {ch === ' ' ? '' : ch}
        </span>
      ))}
    </div>
  );
}

/**
 * Q16 — рядок ВІДПОВІДІ: порожні розряди видно як клітинки, активна (куди піде
 * наступна цифра) підсвічена. Раніше поле вводу було невидиме — дитина не
 * розуміла, куди вписує.
 */
function InputRow({ entered, digitCount }: { entered: string; digitCount: number }) {
  const cells = inputCells(entered, digitCount);
  const active = activeCellIndex(entered, digitCount);
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
      {/* порожня клітинка під знак дії — щоб рядок збігався з рештою стовпчика */}
      <span style={{ width: 28 }} />
      {cells.map((ch, i) => (
        <span
          key={i}
          style={{
            width: 28,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            fontWeight: 900,
            fontFamily: 'var(--font-round)',
            color: 'var(--c-ink)',
            borderRadius: 6,
            border: i === active ? '2px solid var(--c-primary)' : '2px dashed var(--c-line)',
            background: i === active ? 'var(--c-primary-soft)' : 'transparent',
          }}
        >
          {ch}
        </span>
      ))}
    </div>
  );
}

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, number>) {
  const { a, b, op } = round.payload;
  const [entered, setEntered] = useState('');

  useEffect(() => {
    if (answerState === 'idle') setEntered('');
  }, [answerState]);

  const digitCount = Math.max(String(a).length, String(b).length, String(round.answer).length);

  // Q17: цифри йдуть З ОДИНИЦЬ (справа наліво) — як реально рахують стовпчиком.
  const handleDigit = (d: string) => {
    if (disabled) return;
    setEntered((prev) => addDigit(prev, d, digitCount));
  };

  const handleBackspace = () => {
    if (disabled) return;
    setEntered((prev) => removeDigit(prev));
  };

  const handleSubmit = () => {
    if (disabled) return;
    const value = enteredValue(entered);
    if (value === null) return;
    onAnswer(value);
  };

  // Підказка «Правильно: X» показується лише при помилці. Це допомога, а не докір,
  // тому зелена — як .reveal у ChoiceGrid. Червоним лишається тільки ввід дитини.
  const revealColor = 'var(--c-ok-ink)';

  return (
    <>
      <PromptCard question="Порахуй стовпчиком" answerState={answerState}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, margin: '8px auto' }}>
          <DigitRow text={String(a)} digitCount={digitCount} />
          <DigitRow text={String(b)} digitCount={digitCount} prefix={op} />
          <div style={{ width: (digitCount + 1) * 32, height: 3, background: 'var(--c-ink)', margin: '2px 0' }} />
          <InputRow entered={entered} digitCount={digitCount} />
        </div>
        {/* Методика проговорена вголос: стовпчиком рахують з одиниць (правий стовпчик). */}
        <div style={{ textAlign: 'center', color: 'var(--c-mut)', fontWeight: 700, fontSize: 12.5, marginTop: 8 }}>
          Починай з одиниць — це правий стовпчик
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
        {answerState === 'incorrect' ? `Правильно: ${round.answer}` : ' '}
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

const columnArithmetic: GameDefinition<Payload, number> = {
  id: 'column-arithmetic',
  title: 'Стовпчик',
  subject: 'math',
  levels: ['L3'],
  icon: '🧮',
  description: 'Додавання та віднімання стовпчиком.',
  accent: '#E0F2FE',
  skillIds: {
    1: ['math.ops.l3.add-sub-1000'],
    2: ['math.ops.l3.add-sub-1000'],
    3: ['math.ops.l3.add-sub-1000'],
  },
  generate,
  Component,
};

export default columnArithmetic;
