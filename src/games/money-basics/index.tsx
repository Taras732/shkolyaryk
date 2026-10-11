import { useMemo } from 'react';
import type { GameDefinition, GameComponentProps, Difficulty } from '../types';
import { PromptCard, ChoiceGrid, numberDecoys } from '../shared/ui';
import { generate, correctFor, type Payload, type Unit } from './generate';

/** Стиль монети/купюри: колір + чи це монета (кружечок) чи купюра (прямокутник). */
const MONEY_STYLE: Record<number, { bg: string; coin: boolean }> = {
  1: { bg: '#E8D17E', coin: true },
  2: { bg: '#B79A4C', coin: true },
  5: { bg: '#6EA4BF', coin: true },
  10: { bg: '#C06E6E', coin: true },
  20: { bg: '#8FBF7A', coin: false },
  50: { bg: '#A98363', coin: false },
  100: { bg: '#9F7FBF', coin: false },
  200: { bg: '#7A9BBF', coin: false },
  500: { bg: '#BF8FA9', coin: false },
};

function MoneyChip({ value, unit, size = 64 }: { value: number; unit: Unit; size?: number }) {
  const label = unit === 'kop' ? 'коп' : 'грн';
  const s = MONEY_STYLE[value] ?? { bg: '#D9D9D9', coin: true };
  if (s.coin) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: s.bg,
          border: '2px solid rgba(0,0,0,.15)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-round)',
          color: '#2A1E08',
          boxShadow: 'var(--c-shadow)',
        }}
      >
        <span style={{ fontSize: size * 0.34, lineHeight: 1, fontWeight: 900 }}>{value}</span>
        <span style={{ fontSize: size * 0.16, fontWeight: 800 }}>{label}</span>
      </div>
    );
  }
  return (
    <div
      style={{
        width: size * 1.44,
        height: size * 0.8,
        borderRadius: 8,
        background: s.bg,
        border: '2px solid rgba(0,0,0,.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        fontFamily: 'var(--font-round)',
        color: '#241608',
        boxShadow: 'var(--c-shadow)',
      }}
    >
      <span style={{ fontSize: size * 0.36, fontWeight: 900 }}>{value}</span>
      <span style={{ fontSize: size * 0.17, fontWeight: 800 }}>{label}</span>
    </div>
  );
}

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, string>) {
  const { payload } = round;

  // numberDecoys() кличе Math.random() — рахуємо один раз на round.id для гілок
  // count/change, інакше варіанти тасуються заново при кожному ре-рендері
  // (напр. після невірної відповіді).
  const numericOptions = useMemo(() => {
    if (payload.mode === 'count') {
      const sum = payload.items.reduce((a, b) => a + b, 0);
      const spread = Math.max(3, Math.round(sum * 0.25));
      return numberDecoys(sum, 4, spread, 1).map((v) => ({ value: String(v) }));
    }
    if (payload.mode === 'change') {
      const change = payload.paid - payload.cost;
      const spread = Math.max(3, Math.round(change * 0.3));
      return numberDecoys(change, 4, spread, 0).map((v) => ({ value: String(v) }));
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round.id]);

  if (payload.mode === 'count') {
    const { items, unit } = payload;
    const options = numericOptions!;
    return (
      <>
        <PromptCard question="Порахуй, скільки тут грошей" answerState={answerState}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', margin: '8px auto', maxWidth: 300 }}>
            {items.map((v, i) => (
              <MoneyChip key={i} value={v} unit={unit} />
            ))}
          </div>
        </PromptCard>
        <ChoiceGrid options={options} correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} />
      </>
    );
  }

  if (payload.mode === 'compose') {
    const { target, unit, options } = payload;
    const label = unit === 'kop' ? 'коп' : 'грн';
    const choices = options.map((o) => ({
      value: o.id,
      node: (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
          {o.items.map((v, i) => (
            <MoneyChip key={i} value={v} unit={unit} size={38} />
          ))}
        </div>
      ),
    }));
    return (
      <>
        <PromptCard question={`Обери набір, що дає ${target} ${label}`} answerState={answerState}>
          <div style={{ textAlign: 'center', fontSize: 30, fontWeight: 900, color: 'var(--c-primary)', fontFamily: 'var(--font-round)' }}>
            {target} {label}
          </div>
        </PromptCard>
        <ChoiceGrid options={choices} correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={2} />
      </>
    );
  }

  if (payload.mode === 'change') {
    const { cost, paid } = payload;
    const options = numericOptions!;
    return (
      <>
        <PromptCard question="Скільки решти дати?" answerState={answerState}>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center', margin: '4px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-mut)' }}>Товар коштує</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--c-ink)', fontFamily: 'var(--font-round)' }}>{cost} грн</div>
            </div>
            <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--c-mut)' }}>→</span>
            <MoneyChip value={paid} unit="hrn" size={72} />
          </div>
        </PromptCard>
        <ChoiceGrid options={options} correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} />
      </>
    );
  }

  const { left, right, askCheaper } = payload;
  const choices = [{ value: left.name }, { value: right.name }];
  return (
    <>
      <PromptCard question={askCheaper ? 'Що дешевше?' : 'Що дорожче?'} answerState={answerState}>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', margin: '4px 0' }}>
          {[left, right].map((p) => (
            <div key={p.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 40 }}>{p.emoji}</span>
              <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--c-ink)' }}>{p.name}</span>
              <span style={{ fontWeight: 900, fontSize: 16, color: 'var(--c-primary)', fontFamily: 'var(--font-round)' }}>{p.price} грн</span>
            </div>
          ))}
        </div>
      </PromptCard>
      <ChoiceGrid options={choices} correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={2} />
    </>
  );
}

/** Dev-only self-check: N раундів на складність — відповідь узгоджена з payload. */
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
          console.error(`[money-basics] self-check FAIL: difficulty=${difficulty} mode=${r.payload.mode} answer=${r.answer} !== expect=${expect}`);
        }
        if (r.payload.mode === 'compose') {
          const composePayload = r.payload;
          const matchCount = composePayload.options.filter((o) => o.sum === composePayload.target).length;
          if (matchCount < 1) {
            allOk = false;
            console.error(`[money-basics] self-check FAIL: compose без правильного варіанту`, composePayload);
          }
        }
        if (r.payload.mode === 'change' && r.payload.paid - r.payload.cost <= 0) {
          allOk = false;
          console.error(`[money-basics] self-check FAIL: change недодатна решта`, r.payload);
        }
      }
    }
  }
  if (allOk) console.info(`[money-basics] self-check OK: ${checked} раундів, усі відповіді узгоджені.`);
  return allOk;
}

if (import.meta.env.DEV) {
  selfCheck();
}

const moneyBasics: GameDefinition<Payload, string> = {
  id: 'money-basics',
  title: 'Гроші',
  subject: 'math',
  levels: ['L3'],
  icon: '🪙',
  description: 'Полічи гроші.',
  accent: '#FEF3C7',
  skillIds: {
    1: ['math.measure.l3.money'],
    2: ['math.measure.l3.money'],
    3: ['math.measure.l3.money'],
  },
  // 11.10: 1–2 клас — гроші в грі (гривні без копійок), з 3 класу — дії з грошима
  skillsFor: (d, cl) => (cl === 'grade3' || cl === 'grade4' ? ['math.measure.l3.money'] : cl === 'grade2' && d === 3 ? ['math.measure.l2.money-shop'] : ['math.measure.l1.money-play']),
  generate,
  Component,
};

export default moneyBasics;
