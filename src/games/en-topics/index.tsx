import { useCallback, useEffect, useState } from 'react';
import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { BOARD_DONE } from '../types';
import { useProfileStore } from '@/stores/useProfileStore';
import { sayUkSeq } from '../shared/uk-audio';
import { Balloons, PictureCard, TaskBubble, useBoardProgress } from '../shared/preschool';
import { GROUPS, enKey, type Word } from './words';
import {
  QUICK_PASS, QUIZ_LEN, buildCheck, buildQuiz, currentGroup, isFresh, newWords, open, passGroup, record, statusOf,
  type WordProgress, type Question, type Status,
} from './core';

/**
 * «English Words» (11.10.2026) — англійська стежка Острова Слів за взірцем «Буква і звук»:
 * теми по 4–6 слів, перевірка «хто знає — пробігає», знайомство з новим словом, практика.
 * Ціль лише звучить (англійський голос), варіанти — картинки. Фраза завдання українською —
 * раз на сесію, на першому питанні; далі й на 🔊 — лише слово.
 */

interface BoardPayload {
  difficulty: Difficulty;
}
type Answer = typeof BOARD_DONE;

const CORRECT_MS = 1100;
const WRONG_MS = 2400;
const keyFor = (id: string) => `shk.ent.v1.${id}`;

function load(id: string): WordProgress {
  try {
    return JSON.parse(localStorage.getItem(keyFor(id)) ?? '{}') as WordProgress;
  } catch {
    return {};
  }
}

function save(id: string, p: WordProgress) {
  try {
    localStorage.setItem(keyFor(id), JSON.stringify(p));
  } catch {
    // без пам'яті — не біда
  }
}

function generate(difficulty: Difficulty): LevelData<BoardPayload, Answer> {
  const round: Round<BoardPayload, Answer> = { id: 'ent-board', payload: { difficulty }, answer: BOARD_DONE };
  return { difficulty, rounds: Array.from({ length: QUIZ_LEN }, () => round) };
}

const word = (w: Word) => ({ key: enKey(w), text: w.en });
const PHRASE_FIND = { key: 'p_en_find', text: 'Послухай і знайди!' };
const PHRASE_NEW = { key: 'p_en_new', text: 'Нове слово!' };
const PHRASE_KNOW = { key: 'p_en_know', text: 'Ти вже знаєш ці слова!' };

const WORD_TEXT = { fontSize: 34, fontWeight: 900, color: 'var(--c-ink)', fontFamily: 'var(--font-round)' } as const;

function Pic({ w, size }: { w: Word; size: number }) {
  return w.img
    ? <img src={w.img} alt="" draggable={false} style={{ width: size, height: size, objectFit: 'contain', display: 'block' }} />
    : <span style={{ fontSize: size * 0.85, lineHeight: 1 }}>{w.emoji}</span>;
}

const STATUS_BG: Record<Status, string> = { locked: 'rgba(255,255,255,.7)', learning: '#FFE7B3', known: '#CDEFD2', gold: '#FFD95A' };

/** Смужка теми: картинки слів поточної теми, колір — стан слова. */
function Strip({ progress }: { progress: WordProgress }) {
  const gi = Math.min(currentGroup(progress), GROUPS.length - 1);
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
      {GROUPS[gi].words.map((w) => {
        const st = statusOf(progress[w.id]);
        return (
          <span key={w.id} style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', background: STATUS_BG[st], opacity: st === 'locked' ? 0.45 : 1, boxShadow: '0 3px 0 #F1E3CF' }}>
            <Pic w={w} size={24} />
          </span>
        );
      })}
    </div>
  );
}

function Intro({ w, onDone }: { w: Word; onDone: () => void }) {
  useEffect(() => sayUkSeq([PHRASE_NEW, word(w)]), [w]);
  const hear = () => sayUkSeq([word(w)]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
      <TaskBubble text={PHRASE_NEW.text} onSay={hear}>
        <button type="button" onClick={hear}
          style={{ border: 0, cursor: 'pointer', background: '#fff', borderRadius: 36, boxShadow: '0 8px 0 #F1E3CF', padding: '18px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Pic w={w} size={110} />
          <span style={WORD_TEXT}>{w.en}</span>
        </button>
      </TaskBubble>
      <button className="g-btn primary" onClick={onDone}>Пограємо! →</button>
    </div>
  );
}

function Quiz({ quiz: initial, onRecord, onMistake, onDone, strip, withPhrase }: {
  strip?: React.ReactNode;
  quiz: Question[];
  onRecord: (id: string, firstTry: boolean) => void;
  onMistake: () => void;
  onDone: () => void;
  /** Фраза завдання перед першим словом (лише раз за сесію). */
  withPhrase: boolean;
}) {
  const [queue, setQueue] = useState(initial);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const q = queue[idx];
  const correct = picked === q?.target.id;

  useEffect(() => {
    if (q) sayUkSeq(idx === 0 && withPhrase ? [PHRASE_FIND, word(q.target)] : [word(q.target)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const next = useCallback(() => {
    setPicked(null);
    if (idx + 1 >= queue.length) onDone();
    else setIdx(idx + 1);
  }, [idx, queue.length, onDone]);

  useEffect(() => {
    if (!picked) return;
    const t = window.setTimeout(next, correct ? CORRECT_MS : WRONG_MS);
    return () => window.clearTimeout(t);
  }, [picked, correct, next]);

  const report = useBoardProgress();
  useEffect(() => report(Math.round((idx / queue.length) * 5)), [idx, queue.length, report]);

  if (!q) return null;

  const pick = (id: string) => {
    if (picked) return;
    setPicked(id);
    const ok = id === q.target.id;
    if (!q.retry) onRecord(q.target.id, ok);
    sayUkSeq([word(q.target)]);
    if (!ok) {
      onMistake();
      setQueue([...queue, { ...q, retry: true, options: [...q.options].reverse() }]);
    }
  };

  const state = !picked ? 'idle' : correct ? 'correct' : 'incorrect';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <TaskBubble text={PHRASE_FIND.text} onSay={() => sayUkSeq([word(q.target)])} sceneTop={strip}>
        {picked && (
          <PictureCard>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <Pic w={q.target} size={80} />
              <span style={{ ...WORD_TEXT, color: '#16A34A' }}>{q.target.en}</span>
            </div>
          </PictureCard>
        )}
      </TaskBubble>
      <Balloons
        options={q.options.map((o) => ({ value: o.id, node: <Pic w={o} size={56} /> }))}
        correct={q.target.id}
        disabled={!!picked}
        answerState={state}
        onPick={pick}
      />
    </div>
  );
}

type Phase = 'check' | 'passed' | 'intro' | 'quiz';

function Component({ round, onAnswer, onMistake }: GameComponentProps<BoardPayload, Answer>) {
  const d = round.payload.difficulty;
  const profileId = useProfileStore((s) => s.activeProfile?.id) ?? 'guest';
  const [progress, setProgress] = useState<WordProgress>(() => load(profileId));
  const [phase, setPhase] = useState<Phase>(() => (isFresh(load(profileId), currentGroup(load(profileId))) ? 'check' : 'intro'));
  const [check] = useState<Question[]>(() => {
    const p = load(profileId);
    const gi = currentGroup(p);
    return isFresh(p, gi) ? buildCheck(gi, d) : [];
  });
  const [fresh, setFresh] = useState(() => newWords(load(profileId)));
  const [introAt, setIntroAt] = useState(0);
  const [quiz, setQuiz] = useState<Question[] | null>(null);
  const [checkRun, setCheckRun] = useState(0);
  const [checked, setChecked] = useState(false);

  const done = useCallback(() => onAnswer(BOARD_DONE), [onAnswer]);
  const update = (fn: (p: WordProgress) => WordProgress) =>
    setProgress((prev) => {
      const next = fn(prev);
      save(profileId, next);
      return next;
    });

  useEffect(() => {
    if (phase === 'intro' && !fresh[introAt]) {
      setQuiz(buildQuiz(progress, fresh, d));
      setPhase('quiz');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, introAt, fresh]);

  useEffect(() => {
    if (phase === 'passed') sayUkSeq([PHRASE_KNOW]);
  }, [phase]);

  const afterCheck = () => {
    setChecked(true);
    const gi = currentGroup(progress);
    if (checkRun >= QUICK_PASS) {
      update((p) => passGroup(p, gi, Date.now()));
      setPhase('passed');
      return;
    }
    setFresh(newWords(progress));
    setIntroAt(0);
    setPhase('intro');
  };

  if (phase === 'check') {
    return (
      <Quiz
        strip={<Strip progress={progress} />}
        quiz={check}
        withPhrase
        onRecord={(id, ok) => {
          update((p) => record(p, id, ok, Date.now()));
          setCheckRun((n) => (ok ? n + 1 : 0));
        }}
        onMistake={onMistake}
        onDone={afterCheck}
      />
    );
  }

  if (phase === 'passed') {
    const gi = Math.max(0, currentGroup(progress) - 1);
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TaskBubble text={PHRASE_KNOW.text}>
            <PictureCard>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 260 }}>
                {GROUPS[gi].words.map((w) => <Pic key={w.id} w={w} size={48} />)}
              </div>
            </PictureCard>
          </TaskBubble>
        </div>
        <button className="g-btn primary" onClick={done}>Далі →</button>
      </div>
    );
  }

  if (phase === 'intro' && fresh[introAt]) {
    const w = fresh[introAt];
    return (
      <Intro key={w.id} w={w} onDone={() => {
        update((p) => open(p, w.id, Date.now()));
        setIntroAt(introAt + 1);
      }} />
    );
  }

  if (!quiz) return null;
  return (
    <Quiz strip={<Strip progress={progress} />} quiz={quiz} withPhrase={!checked}
      onRecord={(id, ok) => update((p) => record(p, id, ok, Date.now()))} onMistake={onMistake} onDone={done} />
  );
}

const enTopics: GameDefinition<BoardPayload, Answer> = {
  id: 'en-topics',
  title: 'English Words',
  subject: 'english',
  levels: ['L0'],
  icon: '🗣️',
  description: 'Слова англійською по темах: почуй і знайди картинку.',
  accent: '#DBEAFE',
  generate,
  Component,
};

export default enTopics;
