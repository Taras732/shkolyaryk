import type { GameDefinition, GameComponentProps } from '../types';
import { PromptCard, ChoiceGrid } from '../shared/ui';
import { generate, type Payload, type Sign } from './generate';

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Sign>) {
  const { left, right, leftDisplay, rightDisplay } = round.payload;
  const leftText = leftDisplay ?? String(left);
  const rightText = rightDisplay ?? String(right);
  const sideFontSize = (text: string) => (text.length > 3 ? 32 : 56);
  const options = (['<', '=', '>'] as Sign[]).map((s) => ({
    value: s,
    node: <span style={{ fontSize: 36 }}>{s}</span>,
  }));

  return (
    <>
      <PromptCard question="Який знак?" answerState={answerState}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 18,
            margin: '10px 0',
          }}
        >
          <span
            style={{
              fontSize: sideFontSize(leftText),
              fontWeight: 900,
              color: 'var(--c-ink)',
              fontFamily: 'var(--font-round)',
            }}
          >
            {leftText}
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 60,
              height: 60,
              borderRadius: 14,
              border: '2px dashed var(--c-primary)',
              color: 'var(--c-primary)',
              fontSize: 28,
              fontWeight: 900,
            }}
          >
            ?
          </span>
          <span
            style={{
              fontSize: sideFontSize(rightText),
              fontWeight: 900,
              color: 'var(--c-ink)',
              fontFamily: 'var(--font-round)',
            }}
          >
            {rightText}
          </span>
        </div>
      </PromptCard>
      <ChoiceGrid
        options={options}
        correct={round.answer}
        disabled={disabled}
        answerState={answerState}
        onPick={onAnswer}
        columns={3}
      />
    </>
  );
}

const mathCompare: GameDefinition<Payload, Sign> = {
  id: 'math-compare',
  title: 'Порівняй числа',
  subject: 'math',
  levels: ['L0', 'L3'],
  icon: '⚖️',
  description: 'Постав знак: <, = чи >.',
  accent: '#E0F2FE',
  // Гра спільна для L0 (межа завжди 10, без масштабування складністю) і L3
  // (diff1 → до 100, diff2-3 → до 1000); skillIds відображає L3-масштаб.
  skillIds: {
    1: ['math.count.l1.compare-100'],
    2: ['math.count.l3.compare-1000'],
    3: ['math.count.l3.compare-1000'],
  },
  // 11.10: навички за класом × складністю (що реально генерує CLASS_COMPARE_CFG)
  skillsFor: (d, cl) => {
    if (cl === 'grade1' || cl === 'preschool') return d === 1 ? ['math.count.l1.compare-numbers-20'] : ['math.ops.l1.expressions'];
    if (cl === 'grade2' || cl === 'grade3') return d === 1 ? ['math.count.l1.compare-100'] : ['math.ops.l1.expressions'];
    return d === 1 ? ['math.count.l1.compare-100'] : ['math.ops.l2.order-of-operations'];
  },
  // 11.10: «чому так» — за 💡 після відповіді
  explain: (round) => {
    const { left, right, leftDisplay, rightDisplay } = round.payload;
    const steps: string[] = [];
    if (leftDisplay) steps.push(`${leftDisplay} = ${left}`);
    if (rightDisplay) steps.push(`${rightDisplay} = ${right}`);
    const word = left === right ? 'дорівнює' : left > right ? 'більше за' : 'менше за';
    steps.push(`${left} ${word} ${right}, тому «${round.answer}».`);
    return { steps, why: left === right ? undefined : 'Гострий кінчик знака дивиться на менше число.' };
  },
  generate,
  Component,
};

export default mathCompare;
