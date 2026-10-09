import { useCallback, useEffect, useState } from 'react';
import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { BOARD_DONE } from '../types';
import { useProfileStore } from '@/stores/useProfileStore';
import { hasUkAudio, sayUk, sayUkSeq } from '../shared/uk-audio';
import { Balloons, PictureCard, TaskBubble, useBoardProgress } from '../shared/preschool';
import { findLetterKey, letterParts } from '../shared/spoken-names';
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
const WRONG_MS = 2200;
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

function Intro({ letter, onDone }: { letter: Letter; onDone: () => void }) {
  const hear = () => sayUk(introKey(letter), introText(letter));
  useEffect(hear, [letter]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
      <TaskBubble text="Нова буква!" onSay={hear}>
      <button type="button" onClick={hear}
        style={{ border: 0, cursor: 'pointer', background: '#fff', borderRadius: 36, boxShadow: '0 8px 0 #F1E3CF', padding: '14px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
          <span style={BIG_LETTER}>{letter.ch}</span>
          <span style={{ ...BIG_LETTER, fontSize: 64, color: 'var(--c-mut)' }}>{letter.ch.toLowerCase()}</span>
        </div>
        <div style={{ fontSize: 72 }}>{letter.emoji}</div>
        <div style={{ fontSize: 30, fontWeight: 900, color: 'var(--c-ink)', fontFamily: 'var(--font-round)' }}>
          {letter.initial ? (<><span style={{ color: 'var(--c-primary)' }}>{letter.word[0].toUpperCase()}</span>{letter.word.slice(1)}</>) : letter.word}
        </div>
      </button>
      </TaskBubble>
      <button className="g-btn primary" onClick={onDone}>Пограємо! →</button>
    </div>
  );
}

function Quiz({
  quiz: initial,
  onRecord,
  onMistake,
  onDone,
  strip,
}: {
  strip?: React.ReactNode;
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
  const sayFind = (l: Letter, again = false) => sayUkSeq(letterParts(l.ch, again));

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

  // правильно — далі швидко; помилка — показуємо відповідь у сцені і теж далі (як в інших іграх, без кнопки)
  useEffect(() => {
    if (!picked) return;
    const t = window.setTimeout(next, correct ? CORRECT_MS : WRONG_MS);
    return () => window.clearTimeout(t);
  }, [picked, correct, next]);

  // морквинки в шапці — як у всіх ігор
  const report = useBoardProgress();
  useEffect(() => report(Math.round((idx / queue.length) * 5)), [idx, queue.length, report]);

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

  const task =
    q.mode === 'letter' ? 'З якої букви починається?' : q.mode === 'picture' ? 'Що починається з цієї букви?' : sameHeard ? 'Знайди букву, яку я скажу!' : 'Знайди таку саму букву';
  const onSay = q.mode === 'letter' ? () => say(q.target) : sameHeard ? () => sayFind(q.target, true) : q.mode === 'picture' ? () => sayUkSeq([{ key: `n_${q.target.ch}`, text: q.target.ch }]) : undefined;
  // що показати під бульбашкою: картинку слова, букву (для «картинки») або нічого (ціль лише звучить)
  const shown =
    q.mode === 'letter' ? <span style={{ fontSize: 96, lineHeight: 1 }}>{q.target.emoji}</span>
    : q.mode === 'picture' || !sameHeard ? <span style={{ ...BIG_LETTER, fontSize: 96 }}>{q.target.ch}</span>
    : null;
  const state = !picked ? 'idle' : correct ? 'correct' : 'incorrect';

  // після помилки сцена показує відповідь: буква · картинка · слово з виділеною першою буквою
  const answer = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-round)', fontWeight: 900 }}>
      <span style={{ ...BIG_LETTER, fontSize: 72, color: '#16A34A' }}>{q.target.ch}</span>
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontSize: 60, lineHeight: 1 }}>{q.target.emoji}</span>
        <span style={{ fontSize: 20, color: 'var(--c-ink)' }}>
          {q.target.initial ? (<><span style={{ color: '#16A34A' }}>{q.target.word[0].toUpperCase()}</span>{q.target.word.slice(1)}</>) : q.target.word}
        </span>
      </span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <TaskBubble text={task} onSay={onSay} sceneTop={strip}>
        {picked && !correct ? <PictureCard>{answer}</PictureCard> : shown && <PictureCard>{shown}</PictureCard>}
      </TaskBubble>
      <Balloons
        options={q.options.map((o) => ({ value: o.ch, node: q.mode === 'picture' ? <span style={{ fontSize: 50 }}>{o.emoji}</span> : o.ch }))}
        correct={q.target.ch}
        disabled={!!picked}
        answerState={state}
        onPick={(ch) => pick(q.options.find((o) => o.ch === ch)!)}
      />
    </div>
  );
}

const STATUS_BG: Record<Status, string> = { locked: '#EEF0F5', learning: '#FFE7B3', known: '#CDEFD2', gold: '#FFD95A' };
const STATUS_INK: Record<Status, string> = { locked: '#B5B9C9', learning: '#8A5A00', known: '#1E7A3A', gold: '#7A5200' };

/** Смужка буквара: лише поточна група, великими плитками; колір — стан букви. */
function LetterStrip({ progress }: { progress: LetterProgress }) {
  const gi = Math.min(currentGroup(progress), GROUPS.length - 1);
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
      {GROUPS[gi].letters.map((ch) => {
        const st = statusOf(progress[ch]);
        return (
          <span key={ch} style={{ width: 30, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-round)', background: st === 'locked' ? 'rgba(255,255,255,.7)' : STATUS_BG[st], color: st === 'locked' ? '#B5B9C9' : STATUS_INK[st], boxShadow: '0 3px 0 #F1E3CF' }}>
            {ch}
          </span>
        );
      })}
    </div>
  );
}

/** Одна сітка всіх екранів гри: шапка (поточна група) і тіло на всю решту висоти. */
function Screen({ children }: { progress?: LetterProgress; children: React.ReactNode }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
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
      <Screen progress={progress}>
        <Quiz
          strip={<LetterStrip progress={progress} />}
          quiz={check}
          onRecord={(ch, ok) => {
            update((p) => record(p, ch, ok, Date.now()));
            setCheckRun((n) => (ok ? n + 1 : 0));
          }}
          onMistake={onMistake}
          onDone={afterCheck}
        />
      </Screen>
    );
  }

  if (phase === 'passed') {
    const gi = Math.max(0, currentGroup(progress) - 1);
    return (
      <Screen progress={progress}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TaskBubble text="Ти вже знаєш ці букви!">
              <div style={{ background: '#fff', borderRadius: 28, boxShadow: 'var(--c-shadow)', padding: '10px 22px', ...BIG_LETTER, fontSize: 44, color: 'var(--c-primary)' }}>{GROUPS[gi].letters.join(' ')}</div>
            </TaskBubble>
          </div>
          <button className="g-btn primary" onClick={done}>Далі →</button>
        </div>
      </Screen>
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
    <Screen progress={progress}>
      <Quiz strip={<LetterStrip progress={progress} />} quiz={quiz} onRecord={(ch, ok) => update((p) => record(p, ch, ok, Date.now()))} onMistake={onMistake} onDone={done} />
    </Screen>
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
