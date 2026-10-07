import { useCallback, useEffect, useState } from 'react';
import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { BOARD_DONE } from '../types';
import { useProfileStore } from '@/stores/useProfileStore';
import { hasUkAudio, sayUk } from '../shared/uk-audio';
import { LETTERS, introKey, introText, wordKey, type Letter } from './letters';
import { QUIZ_LEN, buildQuiz, isKnown, nextNewLetter, open, record, type LetterProgress, type Question } from './core';

interface BoardPayload {
  difficulty: Difficulty;
}
type Answer = typeof BOARD_DONE;

const CORRECT_MS = 900;
const GREEN = 'var(--c-ok-ink)';
const keyFor = (id: string) => `shk.ukl.v1.${id}`;

function load(id: string): LetterProgress {
  try {
    return JSON.parse(localStorage.getItem(keyFor(id)) ?? '{}') as LetterProgress;
  } catch {
    return {};
  }
}

function save(id: string, p: LetterProgress) {
  try {
    localStorage.setItem(keyFor(id), JSON.stringify(p));
  } catch {
    // без пам'яті — не біда
  }
}

function generate(difficulty: Difficulty): LevelData<BoardPayload, Answer> {
  const round: Round<BoardPayload, Answer> = { id: 'ukl-board', payload: { difficulty }, answer: BOARD_DONE };
  return { difficulty, rounds: Array.from({ length: QUIZ_LEN }, () => round) };
}

/** Великий шрифт і контраст — для дитини зі слабким зором букви мають бути великими. */
const BIG_LETTER = { fontSize: 120, fontWeight: 900, lineHeight: 1, color: 'var(--c-ink)', fontFamily: 'var(--font-round)' } as const;

const say = (l: Letter) => sayUk(wordKey(l), l.word);

function SayBtn({ onClick }: { onClick: () => void }) {
  if (!hasUkAudio()) return null;
  return (
    <button type="button" className="g-btn soft" style={{ width: 'auto', padding: '10px 20px', fontSize: 17, marginTop: 10 }} onClick={onClick}>
      🔊 Послухай
    </button>
  );
}

function Intro({ letter, onDone }: { letter: Letter; onDone: () => void }) {
  useEffect(() => sayUk(introKey(letter), introText(letter)), [letter]);
  return (
    <>
      <div className="g-card" style={{ marginBottom: 16 }}>
        <div className="g-question">Нова буква</div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 18 }}>
          <span style={BIG_LETTER}>{letter.ch}</span>
          <span style={{ ...BIG_LETTER, fontSize: 64, color: 'var(--c-mut)' }}>{letter.ch.toLowerCase()}</span>
        </div>
        <div style={{ fontSize: 72, marginTop: 10 }}>{letter.emoji}</div>
        <div style={{ fontSize: 30, fontWeight: 900, color: 'var(--c-ink)', marginTop: 4 }}>
          {letter.initial ? (
            <>
              <span style={{ color: 'var(--c-primary)' }}>{letter.word[0].toUpperCase()}</span>
              {letter.word.slice(1)}
            </>
          ) : (
            letter.word
          )}
        </div>
        <SayBtn onClick={() => sayUk(introKey(letter), introText(letter))} />
      </div>
      <button className="g-btn primary" onClick={onDone}>
        Пограємо! →
      </button>
    </>
  );
}

function Quiz({
  quiz: initial,
  onRecord,
  onMistake,
  onDone,
}: {
  quiz: Question[];
  onRecord: (ch: string, firstTry: boolean) => void;
  onMistake: () => void;
  onDone: () => void;
}) {
  const [queue, setQueue] = useState(initial);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const q = queue[idx];
  const correct = picked === q?.target.ch;

  useEffect(() => {
    if (q?.mode === 'letter') say(q.target);
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

  const pick = (l: Letter) => {
    if (picked) return;
    setPicked(l.ch);
    const ok = l.ch === q.target.ch;
    if (!q.retry) onRecord(q.target.ch, ok);
    if (ok) {
      if (q.mode !== 'same') say(q.target);
    } else {
      onMistake();
      setQueue([...queue, { ...q, retry: true, options: [...q.options].reverse() }]);
    }
  };

  const prompt =
    q.mode === 'letter' ? (
      <>
        <div className="g-question">З якої букви починається?</div>
        <div style={{ fontSize: 96 }}>{q.target.emoji}</div>
        <SayBtn onClick={() => say(q.target)} />
      </>
    ) : (
      <>
        <div className="g-question">{q.mode === 'same' ? 'Знайди таку саму букву' : 'Що починається з цієї букви?'}</div>
        <div style={BIG_LETTER}>{q.target.ch}</div>
      </>
    );

  return (
    <>
      <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, color: 'var(--c-mut)', marginBottom: 8 }}>
        {idx + 1} / {queue.length}
      </div>
      <div className={`g-card${picked && !correct ? ' shake' : ''}`} style={{ marginBottom: 6 }}>
        {prompt}
      </div>
      <div className="g-choices" style={{ ['--g-cols' as string]: q.options.length > 3 ? 2 : 3 }}>
        {q.options.map((o) => {
          const cls = !picked ? '' : o.ch === q.target.ch ? (o.ch === picked ? ' correct' : ' reveal') : o.ch === picked ? ' wrong' : '';
          return (
            <button key={o.ch} className={`g-choice${cls}`} disabled={!!picked} onClick={() => pick(o)} style={{ fontSize: q.mode === 'picture' ? 52 : 64, padding: '14px 4px' }}>
              {q.mode === 'picture' ? o.emoji : o.ch}
            </button>
          );
        })}
      </div>
      {picked && !correct && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: 'var(--c-ok-bg)', border: '1px solid var(--c-ok-line)', borderRadius: 'var(--c-r-sm)', padding: '12px 14px', textAlign: 'center', color: GREEN, fontWeight: 900, fontSize: 22 }}>
            {q.target.ch} — {q.target.emoji} {q.target.word}
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
  const [progress, setProgress] = useState<LetterProgress>(() => load(profileId));
  const [fresh] = useState<Letter | null>(() => nextNewLetter(load(profileId)));
  const [stage, setStage] = useState<'intro' | 'quiz'>(fresh ? 'intro' : 'quiz');
  const [quiz, setQuiz] = useState<Question[] | null>(() => (fresh ? null : buildQuiz(load(profileId), null, round.payload.difficulty)));

  const done = useCallback(() => onAnswer(BOARD_DONE), [onAnswer]);
  const update = (fn: (p: LetterProgress) => LetterProgress) =>
    setProgress((prev) => {
      const next = fn(prev);
      save(profileId, next);
      return next;
    });

  if (stage === 'intro' && fresh) {
    return (
      <Intro
        letter={fresh}
        onDone={() => {
          const opened = open(progress, fresh.ch, Date.now());
          update(() => opened);
          setQuiz(buildQuiz(opened, fresh, round.payload.difficulty));
          setStage('quiz');
        }}
      />
    );
  }

  const known = LETTERS.filter((l) => isKnown(progress[l.ch])).length;
  return (
    <>
      <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, color: 'var(--c-mut)', marginBottom: 4 }}>
        Знаю букв: {known} з {LETTERS.length}
      </div>
      <Quiz quiz={quiz ?? []} onRecord={(ch, ok) => update((p) => record(p, ch, ok, Date.now()))} onMistake={onMistake} onDone={done} />
    </>
  );
}

const ukLetters: GameDefinition<BoardPayload, Answer> = {
  id: 'uk-letters',
  title: 'Буква і звук',
  subject: 'language',
  levels: ['L0', 'L3'],
  icon: '🔤',
  description: 'Нова буква щодня: почуй звук, знайди букву й картинку.',
  accent: '#FEF3C7',
  generate,
  Component,
};

export default ukLetters;
