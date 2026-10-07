import { useEffect, useState } from 'react';
import type { GameDefinition, GameComponentProps } from '../types';
import { PromptCard } from '../shared/ui';
import Keypad from './Keypad';
import { generate, explainWordProblem, opAnswer, OP_LABEL, type Op, type WordProblemPayload, type Hint } from './generate';

const MAX_INPUT_LEN = 4;
const MAX_HINT_ICONS = 10;

function Icons({ emoji, count, max }: { emoji: string; count: number; max: number }) {
  return (
    <>
      {Array.from({ length: Math.min(count, max) }).map((_, k) => (
        <span key={k} style={{ fontSize: 15 }}>
          {emoji}
        </span>
      ))}
      {count > max && (
        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--c-mut)', alignSelf: 'center' }}>+{count - max}</span>
      )}
    </>
  );
}

const boxStyle = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: 2,
  border: '1.5px solid var(--c-line)',
  borderRadius: 'var(--c-r-sm)',
  padding: '6px 8px',
  background: 'var(--c-primary-soft)',
};

/** CPA-схема: смужки для +/−, однакові групи для ×/÷ (бачиш «по n, k разів»). */
function HintSchema({ hint }: { hint: Hint }) {
  if (hint.kind === 'groups') {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, margin: '4px 0 10px' }}>
        {Array.from({ length: hint.groups }).map((_, g) => (
          <div key={g} style={{ ...boxStyle, maxWidth: 92 }}>
            <Icons emoji={hint.emoji} count={hint.per} max={MAX_HINT_ICONS} />
          </div>
        ))}
        <div style={{ width: '100%', textAlign: 'center', fontSize: 13, fontWeight: 800, color: 'var(--c-mut)' }}>
          {hint.groups} {hint.groups < 5 ? 'групи' : 'груп'} по {hint.per}
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 8, margin: '4px 0 10px' }}>
      {hint.steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {i > 0 && <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--c-primary)' }}>{step.op}</span>}
          <div style={{ ...boxStyle, maxWidth: 128 }}>
            <Icons emoji={step.emoji} count={step.count} max={MAX_HINT_ICONS} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--c-mut)' }}>{step.count}</span>
        </div>
      ))}
      <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--c-mut)' }}>= ?</span>
    </div>
  );
}

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<WordProblemPayload, number>) {
  const { text, emoji, hint, op, ops } = round.payload;
  // Крок «Яка тут дія?» — лише для задач на одну дію; задача на дві дії одразу до обчислення.
  const [phase, setPhase] = useState<'op' | 'compute'>(op ? 'op' : 'compute');
  const [entered, setEntered] = useState('');
  const [showHint, setShowHint] = useState(false);

  // Скидаємо ввід, коли фідбек повертається в idle (новий раунд або повтор після помилки).
  useEffect(() => {
    if (answerState === 'idle') setEntered('');
  }, [answerState]);

  const handleDigit = (digit: string) => {
    if (disabled) return;
    setEntered((prev) => (prev.length >= MAX_INPUT_LEN ? prev : prev + digit));
  };

  const handleSubmit = () => {
    if (disabled || entered === '') return;
    onAnswer(Number(entered));
  };

  const chooseOp = (o: Op) => {
    if (disabled) return;
    // правильна дія — далі обчислення (не рахується як відповідь раунду);
    // хибна — віддаємо оболонці як помилку, вона покаже пояснення з ознакою з тексту
    if (o === op) setPhase('compute');
    else onAnswer(opAnswer(o));
  };

  const displayColor =
    answerState === 'correct' ? 'var(--c-green)' : answerState === 'incorrect' ? 'var(--c-err-ink)' : entered ? 'var(--c-primary)' : 'var(--c-mut)';

  return (
    <>
      <PromptCard question="Розв'яжи задачу" answerState={answerState}>
        <div style={{ fontSize: 38, textAlign: 'center', marginBottom: 6 }}>{emoji}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-ink)', textAlign: 'center', lineHeight: 1.4 }}>{text}</div>
      </PromptCard>

      {hint && (
        <div style={{ textAlign: 'center' }}>
          {showHint ? (
            <HintSchema hint={hint} />
          ) : (
            <button
              type="button"
              className="g-btn soft"
              style={{ width: 'auto', padding: '8px 18px', fontSize: 13, marginBottom: 10 }}
              onClick={() => setShowHint(true)}
            >
              💡 Підказка
            </button>
          )}
        </div>
      )}

      {phase === 'op' ? (
        <>
          <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 800, color: 'var(--c-ink)', margin: '4px 0 10px' }}>
            Яка тут дія?
          </div>
          <div className="g-choices" style={{ ['--g-cols' as string]: 2, marginTop: 0 }}>
            {ops.map((o) => (
              <button key={o} className="g-choice" disabled={disabled} onClick={() => chooseOp(o)} style={{ fontSize: 18 }}>
                {o} {OP_LABEL[o]}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {op && (
            <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, color: 'var(--c-ok-ink)', marginBottom: 4 }}>
              ✓ Дія: {op} {OP_LABEL[op]}
            </div>
          )}
          <div
            style={{
              textAlign: 'center',
              fontSize: 36,
              fontWeight: 900,
              minHeight: 46,
              margin: '4px 0 14px',
              color: displayColor,
              fontFamily: 'var(--font-round)',
            }}
          >
            {entered || '—'}
          </div>
          <Keypad
            value={entered}
            disabled={disabled}
            onDigit={handleDigit}
            onBackspace={() => !disabled && setEntered((prev) => prev.slice(0, -1))}
            onSubmit={handleSubmit}
          />
        </>
      )}
    </>
  );
}

const wordProblems: GameDefinition<WordProblemPayload, number> = {
  id: 'word-problems',
  title: 'Текстові задачі',
  subject: 'math',
  levels: ['L3'],
  icon: '📚',
  description: "Прочитай, обери дію і розв'яжи задачу.",
  accent: '#FFE1EC',
  // skillIds по складності: легша → простіші текстові задачі (нижчий grade_band).
  skillIds: {
    1: ['math.ops.l1.word-problems-simple'],
    2: ['math.ops.l2.word-problems-100'],
    3: ['math.ops.l3.word-problems-1000'],
  },
  generate,
  explain: explainWordProblem,
  Component,
};

export default wordProblems;
