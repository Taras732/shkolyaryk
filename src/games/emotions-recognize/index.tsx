import { useState } from 'react';
import type { GameDefinition, GameComponentProps, Difficulty, LevelData, Round } from '../types';
import { PromptCard, ChoiceGrid } from '../shared/ui';
import { usePreschool } from '../shared/preschool';
import { KidsMoods, generateKids, type KidMoodP } from './kids';
import {
  QUADRANTS,
  QUADRANT_IDS,
  kindFor,
  buildRounds,
  createRng,
  type TaskKind,
  type Emotion,
} from './core';

const ROUNDS_PER_LEVEL = 5;

interface Payload {
  kind: TaskKind;
  emotion: Emotion;
  question: string;
  options: string[];
}

/**
 * Уся випадковість — ТУТ, у generate. Раніше варіанти будувались у тілі
 * компонента (pickCandidates), тож кожен ре-рендер перемішував їх наново — це
 * баг Q2: дитина тисне туди, де щойно бачила відповідь, і отримує «помилку».
 * Раніше difficulty ще й ігнорувалась — тепер вона задає крок навчання.
 */
function generate(difficulty: Difficulty, level?: string): LevelData<Payload, string> {
  if (level === 'L0') return generateKids(difficulty) as unknown as LevelData<Payload, string>;
  const kind = kindFor(difficulty);
  const rng = createRng(0x5eed ^ (difficulty * 7919));
  const tasks = buildRounds(kind, ROUNDS_PER_LEVEL, rng);
  const rounds: Round<Payload, string>[] = tasks.map((t) => ({
    id: t.id,
    payload: { kind: t.kind, emotion: t.emotion, question: t.question, options: t.options },
    answer: t.correct,
  }));
  return { difficulty, rounds };
}

/** Карта настрою 2×2: угорі — багато сили, ліворуч — неприємне. */
function MoodMap({ highlight }: { highlight?: string }) {
  const cell = (id: (typeof QUADRANT_IDS)[number]) => {
    const q = QUADRANTS[id];
    const on = highlight === q.id;
    return (
      <div
        key={id}
        style={{
          padding: '8px 6px',
          borderRadius: 10,
          border: on ? '2px solid var(--c-primary)' : '1px solid var(--c-line)',
          background: on ? 'var(--c-primary-soft)' : 'var(--c-card)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 20 }}>{q.mark}</div>
        <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--c-mut)', lineHeight: 1.25, marginTop: 2 }}>
          {q.label}
        </div>
      </div>
    );
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, maxWidth: 300, margin: '10px auto' }}>
      {cell('red')}
      {cell('yellow')}
      {cell('blue')}
      {cell('green')}
    </div>
  );
}

/**
 * Правило перед грою: спершу дитина дізнається, ЯК думати про емоцію (дві осі),
 * і лише потім застосовує. Без цього лишався б тест «вгадай ярлик до смайла».
 */
function RulesIntro({ onStart }: { onStart: () => void }) {
  return (
    <div className="g-card" style={{ maxWidth: 360, margin: '0 auto' }}>
      <div style={{ fontSize: 34, marginBottom: 4 }}>🧭</div>
      <h2 className="g-title" style={{ fontSize: 19, margin: '0 0 8px' }}>Карта настрою</h2>
      <p style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--c-ink)', lineHeight: 1.5, margin: '0 0 4px' }}>
        Будь-який настрій можна знайти за <b>двома питаннями</b>:
      </p>
      <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--c-ink)', lineHeight: 1.6, margin: '6px 0 0', textAlign: 'left' }}>
        1. Скільки в ньому <b>сили</b> — багато чи мало?
        <br />
        2. Він <b>приємний</b> чи ні?
      </p>

      <MoodMap />

      <p style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--c-mut)', lineHeight: 1.45, margin: '0 0 14px' }}>
        Злість і страх — обидва «багато сили, неприємно», тому вони поруч. Спершу шукай місце, а вже тоді добирай точне слово 🎯
      </p>

      <button type="button" className="g-btn primary" onClick={onStart}>
        Спробувати 🧭
      </button>
    </div>
  );
}

function Component(props: GameComponentProps<Payload, string>) {
  const preschool = usePreschool();
  if (preschool && (props.round.payload as unknown as KidMoodP).kid) return <KidsMoods {...(props as unknown as GameComponentProps<KidMoodP, string>)} />;
  return <SchoolMoods {...props} />;
}

function SchoolMoods({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, string>) {
  const { kind, emotion, question, options } = round.payload;
  const [showIntro, setShowIntro] = useState(true);

  if (showIntro) return <RulesIntro onStart={() => setShowIntro(false)} />;

  return (
    <>
      <PromptCard question={question} answerState={answerState}>
        <div style={{ textAlign: 'center', margin: '10px auto' }}>
          <span style={{ fontSize: 84, lineHeight: 1 }}>{emotion.emoji}</span>
        </div>
        {/* на кроці «точне слово» карта показує квадрант — уточнюємо всередині нього */}
        {kind === 'word' && <MoodMap highlight={emotion.quadrant} />}
      </PromptCard>
      <ChoiceGrid
        options={options.map((o) => ({ value: o }))}
        correct={round.answer}
        disabled={disabled}
        answerState={answerState}
        onPick={onAnswer}
        columns={2}
      />
    </>
  );
}

const emotionsRecognize: GameDefinition<Payload, string> = {
  id: 'emotions-recognize',
  title: 'Карта настрою',
  subject: 'life',
  levels: ['L0'],
  icon: '🧭',
  description: 'Знайди настрій за двома питаннями: скільки сили і чи приємно.',
  accent: '#FCE7F3',
  generate,
  Component,
  // TODO(A2-життя): skills після seed skill-graph життя
};

export default emotionsRecognize;
