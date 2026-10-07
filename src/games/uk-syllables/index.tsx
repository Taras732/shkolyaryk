import { useCallback, useEffect, useState } from 'react';
import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { BOARD_DONE } from '../types';
import { hasUkAudio, sayUk } from '../shared/uk-audio';
import { ROUNDS, buildQuiz, type Question } from './core';

interface BoardPayload {
  difficulty: Difficulty;
}
type Answer = typeof BOARD_DONE;

const CORRECT_MS = 1000;
const GREEN = '#15803D';

const saySyl = (s: string) => sayUk(`s_${s}`, s.toLowerCase());

function generate(difficulty: Difficulty): LevelData<BoardPayload, Answer> {
  const round: Round<BoardPayload, Answer> = { id: 'uks-board', payload: { difficulty }, answer: BOARD_DONE };
  return { difficulty, rounds: Array.from({ length: ROUNDS }, () => round) };
}

const CARD = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 84,
  height: 96,
  borderRadius: 18,
  fontSize: 64,
  fontWeight: 900,
  fontFamily: 'var(--font-round)',
  border: '2px solid var(--c-line)',
  background: 'var(--c-card)',
} as const;

/** М + А → МА: картки з'їжджаються (злиття видно, а не лише чути). */
function Merge({ c, v, merged }: { c: string; v: string; merged: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: merged ? 0 : 22, transition: 'gap .5s ease', margin: '6px 0' }}>
      <span style={{ ...CARD, color: '#2563EB', borderRight: merged ? 'none' : CARD.border, borderRadius: merged ? '18px 0 0 18px' : 18 }}>{c}</span>
      {!merged && <span style={{ fontSize: 34, fontWeight: 900, color: 'var(--c-mut)' }}>+</span>}
      <span style={{ ...CARD, color: '#DC2626', borderLeft: merged ? 'none' : CARD.border, borderRadius: merged ? '0 18px 18px 0' : 18 }}>{v}</span>
    </div>
  );
}

function Game({ quiz: initial, onMistake, onDone }: { quiz: Question[]; onMistake: () => void; onDone: () => void }) {
  const [queue, setQueue] = useState(initial);
  const [idx, setIdx] = useState(0);
  const [merged, setMerged] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const q = queue[idx];
  const answer = q ? (q.mode === 'word' ? q.item.word : q.answer) : '';
  const correct = picked === answer;

  useEffect(() => {
    setMerged(false);
    if (q?.mode === 'hear') saySyl(q.answer);
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

  const pick = (value: string) => {
    if (picked) return;
    setPicked(value);
    if (value === answer) {
      if (q.mode === 'word') sayUk(`w_${q.item.word.toLowerCase()}`, q.item.word.toLowerCase());
      else {
        setMerged(true);
        saySyl(q.answer);
      }
    } else {
      onMistake();
      setQueue([...queue, q]);
    }
  };

  let prompt: React.ReactNode;
  if (q.mode === 'word') {
    prompt = (
      <>
        <div className="g-question">Склад і звук разом — що вийде?</div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <span style={{ ...CARD, minWidth: 120, color: '#2563EB' }}>{q.item.syl}</span>
          <span style={{ fontSize: 34, fontWeight: 900, color: 'var(--c-mut)' }}>+</span>
          <span style={{ ...CARD, color: '#2563EB' }}>{q.item.end}</span>
        </div>
      </>
    );
  } else if (q.mode === 'hear') {
    prompt = (
      <>
        <div className="g-question">Послухай склад і знайди його</div>
        <button type="button" className="g-btn soft" style={{ width: 'auto', padding: '14px 26px', fontSize: 22 }} onClick={() => saySyl(q.answer)}>
          🔊 Ще раз
        </button>
      </>
    );
  } else {
    prompt = (
      <>
        <div className="g-question">Як прочитати разом?</div>
        <Merge c={q.c} v={q.v} merged={merged} />
        {hasUkAudio() && (
          <button type="button" className="g-btn soft" style={{ width: 'auto', padding: '8px 18px', fontSize: 15, marginTop: 8 }} onClick={() => { setMerged(true); saySyl(q.answer); }}>
            👂 Злий голосом
          </button>
        )}
      </>
    );
  }

  return (
    <>
      <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, color: 'var(--c-mut)', marginBottom: 8 }}>
        {idx + 1} / {queue.length}
      </div>
      <div className={`g-card${picked && !correct ? ' shake' : ''}`} style={{ marginBottom: 6 }}>
        {prompt}
      </div>
      <div className="g-choices" style={{ ['--g-cols' as string]: q.options.length > 3 ? 2 : 3 }}>
        {q.mode === 'word'
          ? q.options.map((o) => {
              const cls = !picked ? '' : o.word === answer ? (o.word === picked ? ' correct' : ' reveal') : o.word === picked ? ' wrong' : '';
              return (
                <button key={o.word} className={`g-choice${cls}`} disabled={!!picked} onClick={() => pick(o.word)} style={{ fontSize: 56 }}>
                  {o.emoji}
                </button>
              );
            })
          : q.options.map((o) => {
              const cls = !picked ? '' : o === answer ? (o === picked ? ' correct' : ' reveal') : o === picked ? ' wrong' : '';
              return (
                <button key={o} className={`g-choice${cls}`} disabled={!!picked} onClick={() => pick(o)} style={{ fontSize: 44 }}>
                  {o}
                </button>
              );
            })}
      </div>
      {picked && !correct && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: '#F0FBF4', border: '1px solid #C6EFD4', borderRadius: 'var(--c-r-sm)', padding: '12px 14px', textAlign: 'center', color: GREEN, fontWeight: 900, fontSize: 24 }}>
            {q.mode === 'word' ? `${q.item.syl} + ${q.item.end} = ${q.item.word} ${q.item.emoji}` : `${q.c} + ${q.v} = ${q.answer}`}
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
  const [quiz] = useState(() => buildQuiz(round.payload.difficulty, hasUkAudio()));
  const done = useCallback(() => onAnswer(BOARD_DONE), [onAnswer]);
  return <Game quiz={quiz} onMistake={onMistake} onDone={done} />;
}

const ukSyllables: GameDefinition<BoardPayload, Answer> = {
  id: 'uk-syllables',
  title: 'Зливаємо склади',
  subject: 'language',
  levels: ['L0', 'L3'],
  icon: '🧩',
  description: 'М + А = МА. Зливай звуки в склади, а склади — у слова.',
  accent: '#FCE7F3',
  generate,
  Component,
};

export default ukSyllables;
