import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { BOARD_DONE } from '../types';
import { useProfileStore } from '@/stores/useProfileStore';
import { hasUkAudio, sayUk } from '../shared/uk-audio';
import type { ReadingText } from './texts';
import { addResult, pickText, wpm, type ReadingLog } from './core';

interface BoardPayload {
  difficulty: Difficulty;
}
type Answer = typeof BOARD_DONE;

const GREEN = 'var(--c-ok-ink)';
export const readingKey = (id: string) => `shk.ukr.v1.${id}`;

export function loadReading(id: string): ReadingLog {
  try {
    return JSON.parse(localStorage.getItem(readingKey(id)) ?? '{}') as ReadingLog;
  } catch {
    return {};
  }
}

function saveReading(id: string, log: ReadingLog) {
  try {
    localStorage.setItem(readingKey(id), JSON.stringify(log));
  } catch {
    // без пам'яті — не біда
  }
}

/**
 * Зірки рахує оболонка (computeStars) від кількості «раундів». Питань 3, але з
 * 3 раундами 1 правильна з 3 давала б 2⭐ і відкривала складніший рівень.
 * 2 раунди дають чесну шкалу: 0 помилок — 3⭐, 1 — 2⭐ (далі), 2–3 — 1⭐ (лишаємось).
 */
function generate(difficulty: Difficulty): LevelData<BoardPayload, Answer> {
  const round: Round<BoardPayload, Answer> = { id: 'ukr-board', payload: { difficulty }, answer: BOARD_DONE };
  return { difficulty, rounds: Array.from({ length: 2 }, () => round) };
}

/** Текст великим шрифтом; слово можна натиснути — його прочитає голос (якщо він є на пристрої). */
function TextView({ t }: { t: ReadingText }) {
  const speakable = hasUkAudio();
  return (
    <div className="g-card" style={{ textAlign: 'left', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 34 }}>{t.emoji}</span>
        <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--c-ink)' }}>{t.title}</span>
      </div>
      <div style={{ fontSize: 21, lineHeight: 1.75, fontWeight: 600, color: 'var(--c-ink)' }}>
        {t.text.split(/(\s+)/).map((part, i) =>
          /\s+/.test(part) || !speakable ? (
            part
          ) : (
            <span key={i} onClick={() => sayUk(`r_${part}`, part.replace(/[.,!?:;«»—]/g, ''))} style={{ cursor: 'pointer' }}>
              {part}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

function Component({ round, onAnswer, onMistake }: GameComponentProps<BoardPayload, Answer>) {
  const profileId = useProfileStore((s) => s.activeProfile?.id) ?? 'guest';
  const [text] = useState(() => pickText(round.payload.difficulty, loadReading(profileId)));
  const [phase, setPhase] = useState<'read' | 'questions'>('read');
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [showText, setShowText] = useState(false);
  const started = useRef(Date.now());
  const speed = useRef<number | null>(null);
  const correctCount = useRef(0);
  const q = text.questions[qi];

  const finish = useCallback(() => {
    saveReading(
      profileId,
      addResult(loadReading(profileId), text.id, { at: Date.now(), wpm: speed.current, correct: correctCount.current, total: text.questions.length }),
    );
    onAnswer(BOARD_DONE);
  }, [profileId, text, onAnswer]);

  const next = useCallback(() => {
    setPicked(null);
    setShowText(false);
    if (qi + 1 >= text.questions.length) finish();
    else setQi(qi + 1);
  }, [qi, text.questions.length, finish]);

  useEffect(() => {
    if (picked === null || picked !== q?.answer) return;
    const t = window.setTimeout(next, 900);
    return () => window.clearTimeout(t);
  }, [picked, q, next]);

  if (phase === 'read') {
    return (
      <>
        <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, color: 'var(--c-mut)', marginBottom: 8 }}>Прочитай уважно — потім будуть питання</div>
        <TextView t={text} />
        <button
          className="g-btn primary"
          onClick={() => {
            speed.current = wpm(text.text, Date.now() - started.current);
            setPhase('questions');
          }}
        >
          Прочитано ✓
        </button>
      </>
    );
  }

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answer) correctCount.current++;
    else onMistake();
  };

  return (
    <>
      <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, color: 'var(--c-mut)', marginBottom: 8 }}>
        Питання {qi + 1} з {text.questions.length}
      </div>
      <div className={`g-card${picked !== null && picked !== q.answer ? ' shake' : ''}`} style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--c-ink)', lineHeight: 1.35 }}>{q.q}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {q.options.map((o, i) => {
          const cls = picked === null ? '' : i === q.answer ? (i === picked ? ' correct' : ' reveal') : i === picked ? ' wrong' : '';
          return (
            <button key={o} className={`g-choice${cls}`} disabled={picked !== null} onClick={() => pick(i)} style={{ fontSize: 18, padding: '14px 12px', textAlign: 'left' }}>
              {o}
            </button>
          );
        })}
      </div>
      {picked !== null && picked !== q.answer && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: 'var(--c-ok-bg)', border: '1px solid var(--c-ok-line)', borderRadius: 'var(--c-r-sm)', padding: '12px 14px', color: GREEN, fontWeight: 800 }}>
            Правильно: {q.options[q.answer]}
          </div>
          <button className="g-btn primary" onClick={next}>
            Далі →
          </button>
        </div>
      )}
      <button className="g-btn ghost" style={{ marginTop: 12, padding: 10, fontSize: 14 }} onClick={() => setShowText(!showText)}>
        {showText ? 'Сховати текст' : '📖 Подивитись у текст'}
      </button>
      {showText && <div style={{ marginTop: 10 }}><TextView t={text} /></div>}
    </>
  );
}

const ukReading: GameDefinition<BoardPayload, Answer> = {
  id: 'uk-reading',
  title: 'Читаю і розумію',
  subject: 'language',
  levels: ['L3'],
  icon: '📗',
  description: 'Короткий текст і три питання: хто, що, чому.',
  accent: '#DCFCE7',
  generate,
  Component,
};

export default ukReading;
