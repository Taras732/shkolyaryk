import { useCallback, useEffect, useState } from 'react';
import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { BOARD_DONE } from '../types';
import { useProfileStore } from '@/stores/useProfileStore';
import { TOPICS, type Word } from './words';
import {
  REVIEW_MAX,
  allWords,
  buildQuiz,
  counts,
  dueWords,
  newWords,
  record,
  statusOf,
  type Dict,
  type Quiz,
  type Status,
} from './core';
import { loadDict, saveDict } from './storage';
import { canSpeak, speak } from './speech';

interface BoardPayload {
  difficulty: Difficulty;
}
type Answer = typeof BOARD_DONE;

const CORRECT_MS = 900;
const GREEN = '#15803D';

/** Board-based, як таблиця множення: уся сесія всередині компонента, оболонка рахує помилки й зірки. */
function generate(difficulty: Difficulty): LevelData<BoardPayload, Answer> {
  const round: Round<BoardPayload, Answer> = { id: 'en-board', payload: { difficulty }, answer: BOARD_DONE };
  return { difficulty, rounds: Array.from({ length: REVIEW_MAX }, () => round) };
}

const STATUS_LABEL: Record<Status, string> = { new: 'Нові', learning: 'Вчу', known: 'Знаю' };
const STATUS_COLOR: Record<Status, string> = { new: 'var(--c-mut)', learning: 'var(--c-primary)', known: GREEN };

function SpeakBtn({ text, big }: { text: string; big?: boolean }) {
  if (!canSpeak()) return null;
  return (
    <button
      type="button"
      className={big ? 'g-btn soft' : 'g-iconbtn'}
      style={big ? { width: 'auto', padding: '12px 22px', fontSize: 18 } : { width: 34, height: 34, fontSize: 16 }}
      aria-label={`Послухати ${text}`}
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}
    >
      🔊{big ? ' Послухай' : ''}
    </button>
  );
}

// ---------- головний екран ----------

function Home({
  dict,
  onLearn,
  onReview,
  onDictionary,
}: {
  dict: Dict;
  onLearn: (topic: string) => void;
  onReview: () => void;
  onDictionary: () => void;
}) {
  const c = counts(dict);
  const due = dueWords(dict, Date.now()).length;
  const words = allWords(dict);
  return (
    <>
      <div className="g-card" style={{ marginBottom: 14 }}>
        <div className="g-question">Мій словник</div>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {(['new', 'learning', 'known'] as Status[]).map((s) => (
            <div key={s}>
              <div style={{ fontSize: 28, fontWeight: 900, color: STATUS_COLOR[s], fontFamily: 'var(--font-round)' }}>{c[s]}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--c-mut)' }}>{STATUS_LABEL[s]}</div>
            </div>
          ))}
        </div>
      </div>

      <button className="g-btn primary" disabled={due === 0} onClick={onReview} style={{ marginBottom: 14, opacity: due === 0 ? 0.55 : 1 }}>
        {due > 0 ? `🔁 Повторити слова (${Math.min(due, REVIEW_MAX)})` : '🔁 Повторювати поки нічого — приходь завтра'}
      </button>

      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--c-ink)', margin: '4px 0 8px' }}>Вчити нові слова</div>
      <div className="g-choices" style={{ ['--g-cols' as string]: 2, marginTop: 0 }}>
        {TOPICS.map((t) => {
          const left = words.filter((w) => w.topic === t.id && !dict.words[w.en]).length;
          return (
            <button key={t.id} className="g-choice" disabled={left === 0} onClick={() => onLearn(t.id)} style={{ fontSize: 15, padding: '12px 8px', opacity: left === 0 ? 0.5 : 1 }}>
              {t.emoji} {t.title}
              <span className="g-choice-tag" style={{ color: 'var(--c-mut)' }}>{left > 0 ? `нових: ${left}` : 'усе вивчено'}</span>
            </button>
          );
        })}
      </div>

      <button className="g-btn ghost" style={{ marginTop: 14 }} onClick={onDictionary}>
        📒 Усі мої слова
      </button>
    </>
  );
}

// ---------- словник ----------

function Dictionary({ dict, onBack }: { dict: Dict; onBack: () => void }) {
  const seen = allWords(dict).filter((w) => dict.words[w.en]);
  const groups: Status[] = ['learning', 'known'];
  return (
    <>
      <button className="g-btn ghost" onClick={onBack} style={{ marginBottom: 12 }}>
        ← Назад
      </button>
      {seen.length === 0 && (
        <div className="g-card" style={{ color: 'var(--c-mut)', fontWeight: 700 }}>
          Тут з'являться слова, які ти вчиш. Почни з будь-якої теми!
        </div>
      )}
      {groups.map((g) => {
        const list = seen.filter((w) => statusOf(dict.words[w.en]) === g);
        if (list.length === 0) return null;
        return (
          <div key={g} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: STATUS_COLOR[g], textTransform: 'uppercase', margin: '6px 0' }}>
              {STATUS_LABEL[g]} · {list.length}
            </div>
            {list.map((w) => (
              <div key={w.en} className="g-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', marginBottom: 6, textAlign: 'left' }}>
                <span style={{ fontSize: 28 }}>{w.emoji}</span>
                <span style={{ flex: 1 }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--c-ink)', display: 'block' }}>{w.en}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-mut)' }}>{w.ua}</span>
                </span>
                <SpeakBtn text={w.en} />
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}

// ---------- знайомство з новими словами ----------

function Intro({ words, onDone }: { words: Word[]; onDone: () => void }) {
  const [i, setI] = useState(0);
  const w = words[i];
  useEffect(() => {
    speak(w.en);
  }, [w.en]);
  return (
    <>
      <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, color: 'var(--c-mut)', marginBottom: 8 }}>
        Нове слово {i + 1} / {words.length}
      </div>
      <div className="g-card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 84, lineHeight: 1.1 }}>{w.emoji}</div>
        <div style={{ fontSize: 40, fontWeight: 900, color: 'var(--c-ink)', fontFamily: 'var(--font-round)', marginTop: 8 }}>{w.en}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--c-mut)', marginTop: 4 }}>{w.ua}</div>
        <div style={{ marginTop: 14 }}>
          <SpeakBtn text={w.en} big />
        </div>
      </div>
      <button className="g-btn primary" onClick={() => (i + 1 < words.length ? setI(i + 1) : onDone())}>
        {i + 1 < words.length ? 'Далі →' : 'Перевір себе →'}
      </button>
    </>
  );
}

// ---------- перевірка ----------

function QuizRun({
  quiz: initial,
  onRecord,
  onMistake,
  onDone,
}: {
  quiz: Quiz[];
  onRecord: (en: string, firstTry: boolean) => void;
  onMistake: () => void;
  onDone: () => void;
}) {
  const [queue, setQueue] = useState(initial);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const q = queue[idx];
  const correct = picked === q?.word.en;

  useEffect(() => {
    if (q?.mode === 'listen') speak(q.word.en);
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

  const pick = (w: Word) => {
    if (picked) return;
    setPicked(w.en);
    const ok = w.en === q.word.en;
    // слово, вже раз помилене в цій сесії, повторно не записуємо як «знає»
    const retry = queue.slice(0, idx).some((x) => x.word.en === q.word.en);
    if (!retry) onRecord(q.word.en, ok);
    if (ok) speak(q.word.en);
    else {
      onMistake();
      // повернеться в кінці сесії іншим режимом — щоб не відповідала з пам'яті про позицію
      setQueue([...queue, { ...q, mode: q.mode === 'listen' ? 'read' : 'listen', options: [...q.options].reverse() }]);
    }
  };

  const prompt =
    q.mode === 'listen' ? (
      <>
        <div className="g-question">Послухай і обери картинку</div>
        <SpeakBtn text={q.word.en} big />
      </>
    ) : (
      <>
        <div className="g-question">{q.mode === 'read' ? 'Прочитай і обери картинку' : 'Що це означає?'}</div>
        <div style={{ fontSize: 40, fontWeight: 900, color: 'var(--c-ink)', fontFamily: 'var(--font-round)' }}>{q.word.en}</div>
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
      <div className="g-choices" style={{ ['--g-cols' as string]: 2 }}>
        {q.options.map((o) => {
          const cls = !picked ? '' : o.en === q.word.en ? (o.en === picked ? ' correct' : ' reveal') : o.en === picked ? ' wrong' : '';
          return (
            <button key={o.en} className={`g-choice${cls}`} disabled={!!picked} onClick={() => pick(o)} style={q.mode === 'translate' ? { fontSize: 18 } : { fontSize: 44 }}>
              {q.mode === 'translate' ? o.ua : o.emoji}
            </button>
          );
        })}
      </div>
      {picked && !correct && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: '#F0FBF4', border: '1px solid #C6EFD4', borderRadius: 'var(--c-r-sm)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 34 }}>{q.word.emoji}</span>
            <span style={{ flex: 1, color: GREEN, fontWeight: 800 }}>
              <span style={{ fontSize: 20, display: 'block' }}>{q.word.en}</span>
              {q.word.ua}
            </span>
            <SpeakBtn text={q.word.en} />
          </div>
          <button className="g-btn primary" onClick={next}>
            Зрозуміло →
          </button>
        </div>
      )}
    </>
  );
}

// ---------- збірка ----------

type Screen = { kind: 'home' } | { kind: 'dictionary' } | { kind: 'intro'; words: Word[] } | { kind: 'quiz'; quiz: Quiz[] };

function Component({ round, onAnswer, onMistake }: GameComponentProps<BoardPayload, Answer>) {
  const profileId = useProfileStore((s) => s.activeProfile?.id) ?? 'guest';
  const [dict, setDict] = useState<Dict>(() => loadDict(profileId));
  const [screen, setScreen] = useState<Screen>({ kind: 'home' });
  const difficulty = round.payload.difficulty;

  // голоси в Chrome підвантажуються асинхронно — «будимо» список заздалегідь
  useEffect(() => {
    if (canSpeak()) window.speechSynthesis.getVoices();
  }, []);

  const onRecord = (en: string, firstTry: boolean) =>
    setDict((prev) => {
      const next = record(prev, en, firstTry, Date.now());
      saveDict(profileId, next);
      return next;
    });

  const done = useCallback(() => onAnswer(BOARD_DONE), [onAnswer]);

  if (screen.kind === 'dictionary') return <Dictionary dict={dict} onBack={() => setScreen({ kind: 'home' })} />;
  if (screen.kind === 'intro')
    return <Intro words={screen.words} onDone={() => setScreen({ kind: 'quiz', quiz: buildQuiz(screen.words, difficulty, dict) })} />;
  if (screen.kind === 'quiz') return <QuizRun quiz={screen.quiz} onRecord={onRecord} onMistake={onMistake} onDone={done} />;
  return (
    <Home
      dict={dict}
      onLearn={(topic) => setScreen({ kind: 'intro', words: newWords(dict, topic) })}
      onReview={() => setScreen({ kind: 'quiz', quiz: buildQuiz(dueWords(dict, Date.now()).slice(0, REVIEW_MAX), difficulty, dict) })}
      onDictionary={() => setScreen({ kind: 'dictionary' })}
    />
  );
}

const englishWords: GameDefinition<BoardPayload, Answer> = {
  id: 'english-words',
  title: 'Мої слова',
  subject: 'english',
  levels: ['L0', 'L3'],
  icon: '🔤',
  description: 'Вчи англійські слова з озвучкою і повторюй, щоб не забути.',
  accent: '#E0F2FE',
  generate,
  Component,
};

export default englishWords;
