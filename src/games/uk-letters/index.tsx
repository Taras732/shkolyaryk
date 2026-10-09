import { useCallback, useEffect, useState } from 'react';
import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { BOARD_DONE } from '../types';
import { useProfileStore } from '@/stores/useProfileStore';
import { hasUkAudio, sayUk } from '../shared/uk-audio';
import { SayButton } from '../shared/ui';
import { findLetterKey, findLetterText } from '../shared/spoken-names';
import { introKey, introText, wordKey, type Letter } from './letters';
import {
  GROUPS, QUICK_PASS, QUIZ_LEN, buildCheck, buildQuiz, currentGroup, isFresh, newLetters, open, passGroup, record, statusOf,
  type LetterProgress, type Question, type Status,
} from './core';

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

  // same: буква лише звучить — намальована, вона була б і серед варіантів
  const sameHeard = q?.mode === 'same' && hasUkAudio(findLetterKey(q.target.ch));
  const sayFind = (l: Letter) => sayUk(findLetterKey(l.ch), findLetterText(l.ch));

  useEffect(() => {
    if (q?.mode === 'letter') say(q.target);
    else if (q && sameHeard) sayFind(q.target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    ) : sameHeard ? (
      <>
        <div className="g-question">Знайди букву</div>
        <SayButton onClick={() => sayFind(q.target)} />
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

const STATUS_BG: Record<Status, string> = { locked: '#EEF0F5', learning: '#FFE7B3', known: '#CDEFD2', gold: '#FFD95A' };
const STATUS_INK: Record<Status, string> = { locked: '#B5B9C9', learning: '#8A5A00', known: '#1E7A3A', gold: '#7A5200' };

/** Смужка буквара: 33 букви групами; сірі — ще ні, жовті — вчу, зелені — знаю, золоті — закріплено повтором. */
function LetterStrip({ progress }: { progress: LetterProgress }) {
  const cur = currentGroup(progress);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: 10 }}>
      {GROUPS.map((g, gi) => (
        <div key={g.title} style={{ display: 'flex', gap: 2, padding: 2, borderRadius: 8, outline: gi === cur ? '2px solid var(--c-primary)' : 'none' }}>
          {g.letters.map((ch) => {
            const st = statusOf(progress[ch]);
            return (
              <span key={ch} title={ch} style={{ width: 18, height: 22, borderRadius: 5, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 900, fontFamily: 'var(--font-round)', background: STATUS_BG[st], color: STATUS_INK[st] }}>
                {st === 'locked' ? '' : ch}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

type Phase = 'check' | 'passed' | 'intro' | 'quiz';

function Component({ round, onAnswer, onMistake }: GameComponentProps<BoardPayload, Answer>) {
  const d = round.payload.difficulty;
  const profileId = useProfileStore((s) => s.activeProfile?.id) ?? 'guest';
  const [progress, setProgress] = useState<LetterProgress>(() => load(profileId));
  const [phase, setPhase] = useState<Phase>(() => {
    const p = load(profileId);
    return isFresh(p, currentGroup(p)) ? 'check' : 'intro';
  });
  const [check] = useState<Question[]>(() => {
    const p = load(profileId);
    const gi = currentGroup(p);
    return isFresh(p, gi) ? buildCheck(p, gi, d) : [];
  });
  const [fresh, setFresh] = useState(() => newLetters(load(profileId)));
  const [introAt, setIntroAt] = useState(0);
  const [quiz, setQuiz] = useState<Question[] | null>(null);
  const [checkRun, setCheckRun] = useState(0); // поспіль правильних з першої спроби в перевірці

  const done = useCallback(() => onAnswer(BOARD_DONE), [onAnswer]);
  const update = (fn: (p: LetterProgress) => LetterProgress) =>
    setProgress((prev) => {
      const next = fn(prev);
      save(profileId, next);
      return next;
    });

  // нових букв немає (або знайомство скінчилось) — у практику
  useEffect(() => {
    if (phase === 'intro' && !fresh[introAt]) {
      setQuiz(buildQuiz(progress, fresh, d));
      setPhase('quiz');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, introAt, fresh]);

  // після перевірки: прохід — святкуємо; ні — вчимо, починаючи з нових букв
  const afterCheck = () => {
    const gi = currentGroup(progress);
    if (checkRun >= QUICK_PASS) {
      update((p) => passGroup(p, gi, Date.now()));
      setPhase('passed');
      return;
    }
    const nl = newLetters(progress);
    setFresh(nl);
    setIntroAt(0);
    setPhase('intro');
  };

  if (phase === 'check') {
    return (
      <>
        <LetterStrip progress={progress} />
        <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, color: 'var(--c-mut)', marginBottom: 4 }}>Перевіримо: {GROUPS[currentGroup(progress)]?.title}</div>
        <Quiz
          quiz={check}
          onRecord={(ch, ok) => {
            update((p) => record(p, ch, ok, Date.now()));
            setCheckRun((n) => (ok ? n + 1 : 0));
          }}
          onMistake={onMistake}
          onDone={afterCheck}
        />
      </>
    );
  }

  if (phase === 'passed') {
    const gi = Math.max(0, currentGroup(progress) - 1);
    return (
      <>
        <LetterStrip progress={progress} />
        <div className="g-card" style={{ marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 56 }}>⭐</div>
          <div className="g-question">Ти вже знаєш ці букви!</div>
          <div style={{ ...BIG_LETTER, fontSize: 44, color: 'var(--c-primary)' }}>{GROUPS[gi].letters.join(' ')}</div>
        </div>
        <button className="g-btn primary" onClick={done}>Далі →</button>
      </>
    );
  }

  if (phase === 'intro' && fresh[introAt]) {
    const letter = fresh[introAt];
    return (
      <Intro
        key={letter.ch}
        letter={letter}
        onDone={() => {
          update((p) => open(p, letter.ch, Date.now()));
          setIntroAt(introAt + 1);
        }}
      />
    );
  }

  if (!quiz) return null;
  return (
    <>
      <LetterStrip progress={progress} />
      <Quiz quiz={quiz} onRecord={(ch, ok) => update((p) => record(p, ch, ok, Date.now()))} onMistake={onMistake} onDone={done} />
    </>
  );
}

const ukLetters: GameDefinition<BoardPayload, Answer> = {
  id: 'uk-letters',
  title: 'Буква і звук',
  subject: 'language',
  levels: ['L0', 'L3'],
  icon: '🔤',
  description: 'Буквар групами: почуй звук, знайди букву й картинку; хто знає — проходить швидко.',
  accent: '#FEF3C7',
  generate,
  Component,
};

export default ukLetters;
