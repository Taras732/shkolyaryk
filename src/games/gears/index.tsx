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
  generateChain,
  allDirections,
  lastDirection,
  wheelCount,
  createRng,
  DIRECTION_LABEL,
  DIRECTION_ARROW,
  type Chain,
  type Band,
  type Direction,
  type LinkKind,
} from './core';

const ROUNDS_PER_LEVEL = 5;

interface Payload {
  chain: Chain;
}

function bandFor(level: ProfileLevel, difficulty: Difficulty, classLevel?: ClassLevel): Band {
  const b = classLevel ? classBand(classLevel, difficulty) : gradeBandFor(level, difficulty);
  return b === 'L0' ? 'L1' : (b as Band);
}

function generate(difficulty: Difficulty, level: ProfileLevel, classLevel?: ClassLevel): LevelData<Payload, string> {
  const band = bandFor(level, difficulty, classLevel);
  const rng = createRng(0x9ea7 ^ (difficulty * 7919) ^ band.charCodeAt(1) * 131);
  const rounds: Round<Payload, string>[] = Array.from({ length: ROUNDS_PER_LEVEL }, (_, i) => {
    const chain = generateChain(band, rng);
    return { id: `r${i}`, payload: { chain }, answer: DIRECTION_LABEL[lastDirection(chain)] };
  });
  return { difficulty, rounds };
}

/** З'єднання між колесами. Пас видно — інакше правило виглядало б порушеним. */
function Link({ kind }: { kind: LinkKind }) {
  const text = kind === 'gear' ? '' : kind === 'belt' ? '═══' : '═╳═';
  return (
    <span
      style={{
        fontSize: 13,
        fontWeight: 900,
        color: kind === 'belt-crossed' ? 'var(--c-primary)' : 'var(--c-mut)',
        alignSelf: 'center',
        minWidth: kind === 'gear' ? 4 : 30,
        textAlign: 'center',
      }}
    >
      {text}
    </span>
  );
}

/** Колесо: показує напрямок, «?» або нічого. */
function Wheel({ dir, ask = false }: { dir?: Direction; ask?: boolean }) {
  return (
    <span style={{ textAlign: 'center', minWidth: 52 }}>
      <span style={{ fontSize: 38, lineHeight: 1, display: 'block', opacity: ask ? 1 : 0.9 }}>⚙️</span>
      <span
        style={{
          display: 'block',
          fontSize: ask ? 22 : 20,
          fontWeight: 900,
          color: ask ? 'var(--c-primary)' : 'var(--c-ink)',
          marginTop: 2,
        }}
      >
        {ask ? '?' : dir ? DIRECTION_ARROW[dir] : ''}
      </span>
    </span>
  );
}

/** Ланцюг. `reveal` — показати напрямки всіх коліс (розв'язок після відповіді). */
function ChainView({ chain, reveal = false }: { chain: Chain; reveal?: boolean }) {
  const dirs = allDirections(chain);
  const last = wheelCount(chain) - 1;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, margin: '12px auto', flexWrap: 'wrap' }}>
      {dirs.map((d, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center' }}>
          {i > 0 && <Link kind={chain.links[i - 1]} />}
          <Wheel dir={reveal || i === 0 ? d : undefined} ask={!reveal && i === last} />
        </span>
      ))}
    </div>
  );
}

/** Правило перед грою: спершу ЧОМУ, потім застосування. */
function RulesIntro({ onStart }: { onStart: () => void }) {
  return (
    <div className="g-card" style={{ maxWidth: 360, margin: '0 auto' }}>
      <div style={{ fontSize: 34, marginBottom: 4 }}>⚙️</div>
      <h2 className="g-title" style={{ fontSize: 19, margin: '0 0 8px' }}>Куди крутиться?</h2>
      <p style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--c-ink)', lineHeight: 1.5, margin: '0 0 6px' }}>
        Коли дві шестерні зчеплені зубцями — вони крутяться в <b>різні боки</b>. Одна за годинниковою ↻, друга проти ↺.
      </p>

      <ChainView chain={{ start: 'cw', links: ['gear', 'gear'] }} reveal />

      <div
        style={{
          background: 'var(--c-primary-soft)',
          borderRadius: 'var(--c-r-sm)',
          padding: '12px 14px',
          margin: '4px 0 10px',
          textAlign: 'left',
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--c-primary)', marginBottom: 6 }}>
          Правило
        </div>
        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--c-ink)', lineHeight: 1.45 }}>
          Кожна наступна шестерня крутиться навпаки. Тож через одну — знову так само, як перша.
        </div>
      </div>

      <p style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--c-mut)', lineHeight: 1.45, margin: '0 0 14px' }}>
        Це не треба запам’ятовувати — це можна <b>простежити</b> 🎯
      </p>

      <button type="button" className="g-btn primary" onClick={onStart}>
        Спробувати ⚙️
      </button>
    </div>
  );
}

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, string>) {
  const { chain } = round.payload;
  const [showIntro, setShowIntro] = useState(true);

  // Розв'язок показуємо, коли дитина помилилась: видно ВЕСЬ ланцюг причин,
  // а не просто «невірно» — це і є різниця між уроком і тестом.
  const reveal = answerState === 'incorrect';

  if (showIntro) return <RulesIntro onStart={() => setShowIntro(false)} />;

  return (
    <>
      <PromptCard question="Перша крутиться так. Куди крутиться остання?" answerState={answerState}>
        <ChainView chain={chain} reveal={reveal} />
        {reveal && (
          <div style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 800, color: 'var(--c-ok-ink)', marginTop: 4 }}>
            Простеж ланцюг: кожна наступна — навпаки
          </div>
        )}
      </PromptCard>
      <ChoiceGrid
        options={[{ value: DIRECTION_LABEL.cw }, { value: DIRECTION_LABEL.ccw }]}
        correct={round.answer}
        disabled={disabled}
        answerState={answerState}
        onPick={onAnswer}
        columns={1}
      />
    </>
  );
}

const gears: GameDefinition<Payload, string> = {
  id: 'gears',
  title: 'Куди крутиться?',
  subject: 'science',
  levels: ['L0', 'L3'],
  icon: '⚙️',
  description: 'Простеж ланцюг шестерень: куди повернеться остання?',
  accent: '#E3F1FE',
  generate,
  Component,
  // TODO(skill-граф природознавства): skills після відповідного seed
};

export default gears;
