import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GameDefinition, GameComponentProps, GameExplain, Round, Difficulty, LevelData } from '../types';
import { BOARD_DONE } from '../types';
import { PromptCard } from '../shared/ui';
import Keypad from '../math-examples/Keypad';
import { useProfileStore } from '@/stores/useProfileStore';
import type { Payload } from './generate';
import {
  TABLES,
  SESSION_LEN,
  buildSession,
  explainMultiply,
  explainQuestion,
  recommendedTable,
  recordAnswer,
  requeue,
  tableProgress,
  weakFacts,
  type FactStats,
  type Mode,
  type Question,
} from './core';
import { loadStats, saveStats } from './storage';

/**
 * EP1 — чому саме так (контракт збережено для тестів і сумісності).
 * Множення як ПОВТОРЮВАНЕ ДОДАВАННЯ, для великих множників — «від п'ятірки».
 */
export function explainMultiplication(round: Round<Payload, number>, answer: number): GameExplain | null {
  return explainMultiply(round.payload.a, round.payload.b, answer);
}

interface BoardPayload {
  difficulty: Difficulty;
}
type Answer = typeof BOARD_DONE;

const MAX_INPUT_LEN = 3;
const CORRECT_MS = 700;
const GREEN = '#15803D';

/**
 * Board-based: уся сесія живе всередині компонента (вибір таблиці → 10 питань →
 * повтор помилок), GameShell лише рахує помилки й зірки. Так не довелось
 * міняти оболонку під екран вибору.
 */
function generate(difficulty: Difficulty): LevelData<BoardPayload, Answer> {
  // SESSION_LEN однакових раундів — щоб зірки рахувались від 10 питань, а не від 1.
  // id однаковий: оболонка не перемонтовує компонент (roundIndex у board-режимі не росте).
  const round: Round<BoardPayload, Answer> = { id: 'tt-board', payload: { difficulty }, answer: BOARD_DONE };
  return { difficulty, rounds: Array.from({ length: SESSION_LEN }, () => round) };
}

function Dots({ known, total }: { known: number; total: number }) {
  return (
    <span style={{ display: 'flex', gap: 3, justifyContent: 'center', marginTop: 6 }} aria-label={`вивчено ${known} з ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          style={{ width: 6, height: 6, borderRadius: 3, background: i < known ? 'var(--c-green)' : 'var(--c-line)' }}
        />
      ))}
    </span>
  );
}

function Picker({ stats, onPick }: { stats: FactStats; onPick: (m: Mode) => void }) {
  const rec = recommendedTable(stats);
  const weakCount = weakFacts(stats).length;
  return (
    <>
      <PromptCard question="Яку таблицю тренуємо?" answerState="idle">
        <div style={{ fontSize: 14, color: 'var(--c-mut)', fontWeight: 600 }}>
          {rec ? `Радимо: ×${rec}` : 'Уся таблиця вивчена! Тренуй «Мікс»'}
        </div>
      </PromptCard>
      <div className="g-choices" style={{ ['--g-cols' as string]: 4, marginTop: 0 }}>
        {TABLES.map((n) => {
          const p = tableProgress(stats, n);
          return (
            <button
              key={n}
              className="g-choice"
              style={n === rec ? { borderColor: 'var(--c-primary)', borderWidth: 2.5 } : undefined}
              onClick={() => onPick({ kind: 'table', n })}
            >
              ×{n}
              <Dots known={p.known} total={p.total} />
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
        <button className="g-btn soft" onClick={() => onPick({ kind: 'mix' })}>
          🎲 Мікс — усе, що вже вчили
        </button>
        <button className="g-btn ghost" disabled={weakCount === 0} onClick={() => onPick({ kind: 'mistakes' })}>
          {weakCount > 0 ? `🔁 Мої помилки (${weakCount})` : '🔁 Помилок для повтору немає'}
        </button>
      </div>
    </>
  );
}

type Phase = 'idle' | 'correct' | 'wrong';

function Drill({
  queue: initialQueue,
  onFact,
  onMistake,
  onDone,
}: {
  queue: Question[];
  onFact: (fact: string, firstTry: boolean) => void;
  onMistake: () => void;
  onDone: () => void;
}) {
  const [queue, setQueue] = useState(initialQueue);
  const [idx, setIdx] = useState(0);
  const [entered, setEntered] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [firstTry, setFirstTry] = useState(true);
  const [explain, setExplain] = useState<GameExplain | null>(null);

  const q = queue[idx];

  useEffect(() => {
    if (phase !== 'correct') return;
    const t = window.setTimeout(() => {
      setPhase('idle');
      setEntered('');
      setFirstTry(true);
      if (idx + 1 >= queue.length) onDone();
      else setIdx(idx + 1);
    }, CORRECT_MS);
    return () => window.clearTimeout(t);
  }, [phase, idx, queue.length, onDone]);

  if (!q) return null;

  const submit = () => {
    if (phase !== 'idle' || entered === '') return;
    const value = Number(entered);
    if (value === q.answer) {
      // повторна спроба після помилки — факт уже записано як помилку, не зараховуємо
      if (firstTry) onFact(q.fact, true);
      setPhase('correct');
      return;
    }
    if (firstTry) {
      onFact(q.fact, false);
      onMistake();
      setQueue(requeue(queue, idx)); // повернеться через кілька питань
      setFirstTry(false);
    }
    setExplain(explainQuestion(q, value));
    setPhase('wrong');
  };

  const retry = () => {
    setExplain(null);
    setEntered('');
    setPhase('idle');
  };

  const color = phase === 'correct' ? 'var(--c-green)' : phase === 'wrong' ? '#C0392B' : entered ? 'var(--c-primary)' : 'var(--c-mut)';

  return (
    <>
      <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, color: 'var(--c-mut)', marginBottom: 8 }}>
        {Math.min(idx + 1, queue.length)} / {queue.length}
      </div>
      <div className={`g-card${phase === 'wrong' ? ' shake' : ''}`} style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 46, fontWeight: 900, color: 'var(--c-ink)', fontFamily: 'var(--font-round)' }}>
          {q.a} {q.op} {q.b} = <span style={{ color }}>{entered || '?'}</span>
        </div>
      </div>

      {explain ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeInUp .3s ease both' }}>
          <div style={{ background: '#F0FBF4', border: '1px solid #C6EFD4', borderRadius: 'var(--c-r-sm)', padding: '14px 16px' }}>
            <div style={{ fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.04em', color: GREEN, marginBottom: 8 }}>
              Ось як правильно 👇
            </div>
            {explain.steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 9, fontWeight: 800, fontSize: 15, color: GREEN, marginTop: i ? 6 : 0 }}>
                <span>✓</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
          {explain.why && (
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--c-mut)', textAlign: 'center' }}>💡 {explain.why}</div>
          )}
          <button className="g-btn primary" onClick={retry}>
            Спробувати ще раз →
          </button>
        </div>
      ) : (
        <Keypad
          value={entered}
          disabled={phase !== 'idle'}
          onDigit={(d) => setEntered((p) => (p.length >= MAX_INPUT_LEN ? p : p + d))}
          onBackspace={() => setEntered((p) => p.slice(0, -1))}
          onSubmit={submit}
        />
      )}
    </>
  );
}

function Component({ round, onAnswer, onMistake }: GameComponentProps<BoardPayload, Answer>) {
  const profileId = useProfileStore((s) => s.activeProfile?.id) ?? 'guest';
  const [stats, setStats] = useState<FactStats>(() => loadStats(profileId));
  const [mode, setMode] = useState<Mode | null>(null);
  const difficulty = round.payload.difficulty;

  const queue = useMemo(() => (mode ? buildSession(mode, difficulty, stats) : []), [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFact = (fact: string, firstTry: boolean) => {
    setStats((prev) => {
      const next = recordAnswer(prev, fact, firstTry, Date.now());
      saveStats(profileId, next);
      return next;
    });
  };

  // стабільний колбек: інакше таймер переходу в Drill перезапускається з кожним ре-рендером
  const handleDone = useCallback(() => onAnswer(BOARD_DONE), [onAnswer]);

  if (!mode || queue.length === 0) return <Picker stats={stats} onPick={setMode} />;
  return <Drill queue={queue} onFact={handleFact} onMistake={onMistake} onDone={handleDone} />;
}

const timesTables: GameDefinition<BoardPayload, Answer> = {
  id: 'times-tables',
  title: 'Таблиця множення',
  subject: 'math',
  levels: ['L3'],
  icon: '✖️',
  description: 'Обери таблицю і тренуй, поки не запам’ятаєш.',
  accent: '#FFEDD5',
  // Таблицю обирає дитина, тож skill за складністю приблизний: обидві половини таблиці,
  // на «Складно» — ще й табличне ділення.
  skillIds: {
    1: ['math.ops.l2.mult-table-2-5', 'math.ops.l2.mult-table-6-9'],
    2: ['math.ops.l2.mult-table-2-5', 'math.ops.l2.mult-table-6-9'],
    3: ['math.ops.l2.mult-table-6-9', 'math.ops.l2.division-table'],
  },
  generate,
  Component,
};

export default timesTables;
