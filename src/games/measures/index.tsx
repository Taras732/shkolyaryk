import { useMemo } from 'react';
import type { GameDefinition, GameComponentProps, Difficulty } from '../types';
import { PromptCard, ChoiceGrid, numberDecoys } from '../shared/ui';
import { unitByKey, type ObjectFact, type MeasureCategory } from './data';
import { generate, correctFor, type Payload } from './generate';

const MULTISTEP_NOUNS: Record<'length' | 'mass' | 'volume', { noun: string; emoji: string }> = {
  length: { noun: 'мотузки', emoji: '🧵' },
  mass: { noun: 'борошна', emoji: '🌾' },
  volume: { noun: 'води', emoji: '🚰' },
};

const CATEGORY_QUESTION: Record<MeasureCategory, string> = {
  length: 'Що довше?',
  mass: 'Що важче?',
  volume: 'Де більше?',
  temp: 'Що тепліше?',
};

function ObjectCard({ obj }: { obj: ObjectFact }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: '14px 16px',
        borderRadius: 16,
        border: '1.5px solid var(--c-line)',
        background: 'var(--c-card)',
        minWidth: 110,
      }}
    >
      <span style={{ fontSize: 40 }}>{obj.emoji}</span>
      <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--c-ink)', textAlign: 'center' }}>{obj.name}</span>
      <span style={{ fontWeight: 900, fontSize: 16, color: 'var(--c-primary)', fontFamily: 'var(--font-round)' }}>
        {obj.value} {unitByKey(obj.unitKey).label}
      </span>
    </div>
  );
}

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, string>) {
  const { payload } = round;

  // numberDecoys() кличе Math.random() — рахуємо один раз на round.id для гілок
  // convert/multistep, інакше варіанти тасуються заново при кожному ре-рендері
  // (напр. після невірної відповіді).
  const numericOptions = useMemo(() => {
    if (payload.mode === 'convert' || payload.mode === 'multistep') {
      const decoys = numberDecoys(payload.result, 4, Math.max(2, Math.round(payload.result * 0.4)), 0);
      return decoys.map((v) => ({ value: String(v) }));
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round.id]);

  if (payload.mode === 'unit') {
    const { obj, options } = payload;
    const choices = options.map((label) => ({ value: label }));
    return (
      <>
        <PromptCard question="Чим це виміряти?" answerState={answerState}>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '8px auto' }}>
            <ObjectCard obj={obj} />
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

  if (payload.mode === 'convert') {
    const fromUnit = unitByKey(payload.fromKey);
    const toUnit = unitByKey(payload.toKey);
    const options = numericOptions!;
    return (
      <>
        <PromptCard question="Скільки це?" answerState={answerState}>
          <div style={{ textAlign: 'center', fontSize: 32, fontWeight: 900, color: 'var(--c-ink)', fontFamily: 'var(--font-round)' }}>
            {payload.value} {fromUnit.label} = ? {toUnit.label}
          </div>
        </PromptCard>
        <ChoiceGrid options={options} correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={2} />
      </>
    );
  }

  if (payload.mode === 'multistep') {
    const { category, smallKey, bigKey, a, b } = payload;
    const noun = MULTISTEP_NOUNS[category];
    const smallUnit = unitByKey(smallKey);
    const bigUnit = unitByKey(bigKey);
    const options = numericOptions!;
    return (
      <>
        <PromptCard question={`Скільки всього ${bigUnit.label} ${noun.noun}?`} answerState={answerState}>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', alignItems: 'center', margin: '4px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 34 }}>{noun.emoji}</div>
              <div style={{ fontWeight: 900, fontSize: 18, color: 'var(--c-primary)', fontFamily: 'var(--font-round)' }}>
                {a} {smallUnit.label}
              </div>
            </div>
            <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--c-mut)' }}>+</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 34 }}>{noun.emoji}</div>
              <div style={{ fontWeight: 900, fontSize: 18, color: 'var(--c-primary)', fontFamily: 'var(--font-round)' }}>
                {b} {smallUnit.label}
              </div>
            </div>
          </div>
        </PromptCard>
        <ChoiceGrid options={options} correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={2} />
      </>
    );
  }

  const { left, right } = payload;
  const choices = [{ value: left.name }, { value: right.name }];
  return (
    <>
      <PromptCard question={CATEGORY_QUESTION[left.category]} answerState={answerState}>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', margin: '4px 0' }}>
          <ObjectCard obj={left} />
          <ObjectCard obj={right} />
        </div>
      </PromptCard>
      <ChoiceGrid
        options={choices}
        correct={round.answer}
        disabled={disabled}
        answerState={answerState}
        onPick={onAnswer}
        columns={2}
      />
    </>
  );
}

/** Dev-only self-check: N раундів на складність — відповідь узгоджена з payload, значення коректні. */
function selfCheck(roundsPerDifficulty = 20): boolean {
  const difficulties: Difficulty[] = [1, 2, 3];
  let allOk = true;
  let checked = 0;
  for (const difficulty of difficulties) {
    for (let i = 0; i < roundsPerDifficulty; i++) {
      const { rounds } = generate(difficulty);
      for (const r of rounds) {
        checked++;
        const expect = correctFor(r.payload);
        if (expect !== r.answer) {
          allOk = false;
          console.error(`[measures] self-check FAIL: difficulty=${difficulty} mode=${r.payload.mode} answer=${r.answer} !== expect=${expect}`);
        }
        if (r.payload.mode === 'compare' && difficulty < 3 && r.payload.left.category === 'temp') {
          allOk = false;
          console.error(`[measures] self-check FAIL: температура поза Hard`, r.payload);
        }
        if ((r.payload.mode === 'convert' || r.payload.mode === 'multistep') && (!Number.isInteger(r.payload.result) || r.payload.result < 1)) {
          allOk = false;
          console.error(`[measures] self-check FAIL: результат не натуральне число`, r.payload);
        }
      }
    }
  }
  if (allOk) console.info(`[measures] self-check OK: ${checked} раундів, усі відповіді узгоджені.`);
  return allOk;
}

if (import.meta.env.DEV) {
  selfCheck();
}

const measures: GameDefinition<Payload, string> = {
  id: 'measures',
  title: 'Виміри',
  subject: 'math',
  levels: ['L3'],
  icon: '📏',
  description: 'Виміри та величини.',
  accent: '#E0F2FE',
  // Гра тренує довжину/масу/об'єм (ml/l) + перетворення одиниць та температуру (Hard);
  // seed skill-graph нема окремого skill для об'єму/температури — ці раунди лишаються
  // непокритими в skillIds (успадковано з A3, не розширюємо тут).
  skillIds: {
    1: ['math.measure.l1.length-units', 'math.measure.l1.mass-units'],
    2: ['math.measure.l1.length-units', 'math.measure.l1.mass-units', 'math.measure.l3.named-numbers-convert'],
    3: ['math.measure.l3.named-numbers-convert'],
  },
  // 11.10: одиниці за класом (CLASS_UNIT_KEYS); d2 — переведення одиниць
  skillsFor: (d, cl) => {
    // 11.10: з літром і дециметром — і в 1 класі (програма Савченко)
    const units = cl === 'preschool'
      ? ['math.measure.l1.length-units', 'math.measure.l1.mass-units']
      : ['math.measure.l1.length-units', 'math.measure.l1.mass-units', 'math.measure.l1.capacity-litre'];
    if (d === 2) return [...units, 'math.measure.l3.named-numbers-convert'];
    return d === 1 && cl === 'grade1' ? [...units, 'math.measure.l1.measure-intro'] : units;
  },
  generate,
  Component,
};

export default measures;
