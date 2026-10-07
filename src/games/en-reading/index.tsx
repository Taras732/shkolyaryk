import { useCallback, useEffect, useState } from 'react';
import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { BOARD_DONE } from '../types';
import { useProfileStore } from '@/stores/useProfileStore';
import { canSpeak, speak } from '../english-words/speech';
import { CVC, LETTERS } from './data';
import { SESSION, buildSession, knownCount, record, type Question, type ReadingProgress } from './core';

interface BoardPayload {
  difficulty: Difficulty;
}
type Answer = typeof BOARD_DONE;

const CORRECT_MS = 1000;
const GREEN = 'var(--c-ok-ink)';
const keyFor = (id: string) => `shk.enr.v1.${id}`;

function load(id: string): ReadingProgress {
  try {
    return JSON.parse(localStorage.getItem(keyFor(id)) ?? '{}') as ReadingProgress;
  } catch {
    return {};
  }
}

function save(id: string, p: ReadingProgress) {
  try {
    localStorage.setItem(keyFor(id), JSON.stringify(p));
  } catch {
    // без пам'яті — не біда
  }
}

function generate(difficulty: Difficulty): LevelData<BoardPayload, Answer> {
  const round: Round<BoardPayload, Answer> = { id: 'enr-board', payload: { difficulty }, answer: BOARD_DONE };
  return { difficulty, rounds: Array.from({ length: SESSION }, () => round) };
}

const QUESTION: Record<Question['mode'], string> = {
  sound: 'Що починається з цього звуку?',
  read: 'Прочитай і обери картинку',
  listen: 'Послухай і знайди слово',
  phrase: 'Прочитай і обери картинку',
};

/** Слово по літерах: кожна літера окремою плиткою — злиття видно, а не лише чути. */
function Tiles({ word }: { word: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, margin: '6px 0' }}>
      {[...word].map((ch, i) => (
        <span key={i} style={{ minWidth: 52, padding: '6px 10px', borderRadius: 12, border: '2px solid var(--c-line)', fontSize: 44, fontWeight: 900, fontFamily: 'var(--font-round)', color: 'var(--c-ink)', background: 'var(--c-card)' }}>
          {ch}
        </span>
      ))}
    </div>
  );
}

function Session({ quiz: initial, onRecord, onMistake, onDone }: { quiz: Question[]; onRecord: (key: string, ok: boolean) => void; onMistake: () => void; onDone: () => void }) {
  const [queue, setQueue] = useState(initial);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const q = queue[idx];
  const correct = picked === q?.answer;

  useEffect(() => {
    if (q?.mode === 'listen') speak(q.say);
  }, [q]);

  const next = useCallback(() => {
    setPicked(null);
    if (idx + 1 >= queue.length) onDone();
    else setIdx(idx + 1);
  }, [idx, queue.length, onDone]);

  useEffect(() => {
    if (!correct) return;
    const t = window.setTimeout(next, CORRECT_MS);
    return () => window.clearTimeout(t);
  }, [correct, next]);

  if (!q) return null;

  const pick = (key: string) => {
    if (picked) return;
    setPicked(key);
    const ok = key === q.answer;
    if (!q.retry) onRecord(q.key, ok);
    speak(q.say); // і правильно, і ні — дитина чує, як це звучить
    if (!ok) {
      onMistake();
      setQueue([...queue, { ...q, retry: true, options: [...q.options].reverse() }]);
    }
  };

  let prompt: React.ReactNode;
  if (q.mode === 'sound') prompt = <div style={{ fontSize: 110, fontWeight: 900, lineHeight: 1, fontFamily: 'var(--font-round)', color: 'var(--c-ink)' }}>{q.prompt}</div>;
  else if (q.mode === 'read') prompt = <Tiles word={q.prompt} />;
  else if (q.mode === 'phrase') prompt = <div style={{ fontSize: 34, fontWeight: 900, color: 'var(--c-ink)', fontFamily: 'var(--font-round)' }}>{q.prompt}</div>;
  else
    prompt = (
      <button type="button" className="g-btn soft" style={{ width: 'auto', padding: '14px 26px', fontSize: 22 }} onClick={() => speak(q.say)}>
        🔊 Ще раз
      </button>
    );

  const isText = q.mode === 'listen';
  return (
    <>
      <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, color: 'var(--c-mut)', marginBottom: 8 }}>
        {idx + 1} / {queue.length}
      </div>
      <div className={`g-card${picked && !correct ? ' shake' : ''}`} style={{ marginBottom: 6 }}>
        <div className="g-question">{QUESTION[q.mode]}</div>
        {prompt}
        {canSpeak() && q.mode === 'sound' && picked === null && (
          <button type="button" className="g-btn soft" style={{ width: 'auto', padding: '6px 14px', fontSize: 13, marginTop: 8 }} onClick={() => speak(q.say)}>
            🔊 Підказка
          </button>
        )}
      </div>
      <div className="g-choices" style={{ ['--g-cols' as string]: 3 }}>
        {q.options.map((o) => {
          const cls = !picked ? '' : o.key === q.answer ? (o.key === picked ? ' correct' : ' reveal') : o.key === picked ? ' wrong' : '';
          return (
            <button key={o.key} className={`g-choice${cls}`} disabled={!!picked} onClick={() => pick(o.key)} style={{ fontSize: isText ? 30 : q.mode === 'phrase' ? 26 : 48, padding: '14px 4px' }}>
              {o.label}
            </button>
          );
        })}
      </div>
      {picked && !correct && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: 'var(--c-ok-bg)', border: '1px solid var(--c-ok-line)', borderRadius: 'var(--c-r-sm)', padding: '12px 14px', textAlign: 'center', color: GREEN, fontWeight: 900, fontSize: 22 }}>
            {q.mode === 'sound' ? `${q.prompt} — ${q.say} ${q.answer}` : q.mode === 'listen' ? q.answer : `${q.prompt} — ${q.answer}`}
          </div>
          <button className="g-btn primary" onClick={next}>
            Далі →
          </button>
        </div>
      )}
    </>
  );
}

function Component({ round, onAnswer, onMistake }: GameComponentProps<BoardPayload, Answer>) {
  const profileId = useProfileStore((s) => s.activeProfile?.id) ?? 'guest';
  const [progress, setProgress] = useState<ReadingProgress>(() => load(profileId));
  const [quiz] = useState(() => buildSession(round.payload.difficulty, load(profileId)));
  const done = useCallback(() => onAnswer(BOARD_DONE), [onAnswer]);
  const onRecord = (key: string, ok: boolean) =>
    setProgress((prev) => {
      const next = record(prev, key, ok, Date.now());
      save(profileId, next);
      return next;
    });

  return (
    <>
      <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, color: 'var(--c-mut)', marginBottom: 4 }}>
        Звуків: {knownCount(progress, 'l:')} з {LETTERS.length} · слів читаю: {knownCount(progress, 'w:')} з {CVC.length}
      </div>
      <Session quiz={quiz} onRecord={onRecord} onMistake={onMistake} onDone={done} />
    </>
  );
}

const enReading: GameDefinition<BoardPayload, Answer> = {
  id: 'en-reading',
  title: 'Читаю англійською',
  subject: 'english',
  levels: ['L3'],
  icon: '📖',
  description: 'Звуки букв → слова cat, dog → фрази. Вчимося читати, а не вгадувати.',
  accent: '#DBEAFE',
  generate,
  Component,
};

export default enReading;
