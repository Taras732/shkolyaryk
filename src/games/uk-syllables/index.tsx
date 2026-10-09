import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { BOARD_DONE } from '../types';
import { sayUk, sayUkSeq } from '../shared/uk-audio';
import { Balloons, PictureCard, TaskBubble, useBoardProgress } from '../shared/preschool';
import { ROUNDS, buildQuiz, isLong, type Question } from './core';

/**
 * «Зливаємо склади» — «буква біжить до букви» (рішення 09.10.2026).
 * Раунд: ДОРІЖКА (веди букву пальцем до букви, звук тягнеться, на зустрічі — склад)
 * → ЗНАЙДИ (склад лише звучить; для слова — вибрати картинку).
 */
interface BoardPayload {
  difficulty: Difficulty;
}
type Answer = typeof BOARD_DONE;

const CORRECT_MS = 1000;
const AFTER_MERGE_MS = 1300;
const BIG = { fontFamily: 'var(--font-round)', fontWeight: 900 } as const;

const saySyl = (s: string) => sayUk(`s_${s}`, s.toLowerCase());
const sayWord = (w: string) => sayUk(`w_${w.toLowerCase()}`, w.toLowerCase());

function generate(difficulty: Difficulty): LevelData<BoardPayload, Answer> {
  const round: Round<BoardPayload, Answer> = { id: 'uks-board', payload: { difficulty }, answer: BOARD_DONE };
  return { difficulty, rounds: Array.from({ length: ROUNDS }, () => round) };
}

const TILE = (color: string) => ({
  ...BIG,
  minWidth: 78,
  height: 86,
  padding: '0 12px',
  borderRadius: 24,
  background: '#fff',
  color,
  fontSize: 56,
  display: 'grid',
  placeItems: 'center',
  boxShadow: '0 6px 0 #EED9BF',
  userSelect: 'none' as const,
  touchAction: 'none' as const,
});

/**
 * Доріжка: ліва картка їде до правої — пальцем або тапом (тоді їде сама).
 * Протяжний приголосний звучить «мммм…» поки їде; на зустрічі картки зливаються в одну.
 */
function Track({ left, right, long, onStart, onArrive }: { left: string; right: string; long: boolean; onStart: () => void; onArrive: () => void }) {
  const rail = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(0);
  const [max, setMax] = useState(180);
  const [merged, setMerged] = useState(false);
  const drag = useRef<{ x0: number; moved: boolean } | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const w = rail.current?.clientWidth ?? 280;
    setMax(Math.max(80, w - 78 - 78 - 8));
  }, []);

  const start = () => {
    if (started.current) return;
    started.current = true;
    onStart();
  };
  const arrive = useCallback(() => {
    if (merged) return;
    setX(max);
    setMerged(true);
    onArrive();
  }, [merged, max, onArrive]);

  // тап без перетягування — буква їде сама (протяжна — повільно, коротка — «стрибає»)
  const auto = () => {
    start();
    const dur = long ? 1100 : 350;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      setX(k * max);
      if (k < 1) requestAnimationFrame(step);
      else arrive();
    };
    requestAnimationFrame(step);
  };

  return (
    <div ref={rail} style={{ width: '100%', maxWidth: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', height: 120 }}>
      {merged ? (
        <div style={{ ...TILE('#16A34A'), fontSize: 60, minWidth: 140, animation: 'pk-pop .45s ease-out forwards' }}>{left + right}</div>
      ) : (
        <>
          {/* доріжка-пунктир */}
          <div style={{ position: 'absolute', left: 60, right: 60, top: '50%', height: 6, marginTop: -3, borderRadius: 6, background: 'repeating-linear-gradient(90deg,#F2C79B 0 10px,transparent 10px 20px)' }} />
          <div
            onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); drag.current = { x0: e.clientX - x, moved: false }; start(); }}
            onPointerMove={(e) => {
              if (!drag.current) return;
              const nx = Math.max(0, Math.min(max, e.clientX - drag.current.x0));
              if (Math.abs(nx - x) > 3) drag.current.moved = true;
              setX(nx);
              if (nx >= max * 0.85) { drag.current = null; arrive(); }
            }}
            onPointerUp={() => {
              const d = drag.current;
              drag.current = null;
              if (!d) return;
              if (!d.moved) auto();
              else if (x < max * 0.85) setX(0);
            }}
            style={{ ...TILE('#2563EB'), position: 'absolute', left: 4, transform: `translateX(${x}px)`, cursor: 'grab', zIndex: 2, transition: drag.current ? 'none' : 'transform .2s' }}
          >
            {left}
          </div>
          <div style={{ ...TILE('#DC2626'), position: 'absolute', right: 4 }}>{right}</div>
          {x === 0 && (
            <div className="pk-anim" style={{ position: 'absolute', left: 60, top: 92, fontSize: 30, animation: 'pk-float 1.4s ease-in-out infinite' }}>👆</div>
          )}
        </>
      )}
    </div>
  );
}

function Game({ quiz, onMistake, onDone }: { quiz: Question[]; onMistake: () => void; onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<'slide' | 'find'>('slide');
  const [picked, setPicked] = useState<string | null>(null);
  const q = quiz[idx];
  const report = useBoardProgress();
  useEffect(() => report(Math.round((idx / quiz.length) * 5)), [idx, quiz.length, report]);

  const target = q ? (q.mode === 'word' ? q.item.word : q.answer) : '';
  const hear = useCallback(() => (q?.mode === 'word' ? sayWord(q.item.word) : saySyl(target)), [q, target]);

  const next = useCallback(() => {
    setPicked(null);
    setPhase('slide');
    if (idx + 1 >= quiz.length) onDone();
    else setIdx(idx + 1);
  }, [idx, quiz.length, onDone]);

  useEffect(() => {
    if (!picked) return;
    const ok = picked === target;
    const t = window.setTimeout(ok ? next : () => setPicked(null), ok ? CORRECT_MS : 1100);
    return () => window.clearTimeout(t);
  }, [picked, target, next]);

  if (!q) return null;

  const left = q.mode === 'word' ? q.item.syl : q.left;
  const right = q.mode === 'word' ? q.item.end : q.right;
  const long = q.mode === 'syl' && isLong(q.left);

  if (phase === 'slide') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <TaskBubble text="Веди букву до букви!" onSay={() => (long ? sayUkSeq([{ key: `c_${left}`, text: left }, { key: `s_${left + right}`, text: left + right }], 0) : hear())}>
          <Track
            key={idx}
            left={left}
            right={right}
            long={long}
            onStart={() => { if (long) sayUk(`c_${left}`, left.toLowerCase()); }}
            onArrive={() => {
              hear();
              window.setTimeout(() => { setPhase('find'); window.setTimeout(hear, 250); }, AFTER_MERGE_MS);
            }}
          />
        </TaskBubble>
        <div style={{ height: 100 }} />
      </div>
    );
  }

  const state = !picked ? 'idle' : picked === target ? 'correct' : 'incorrect';
  const pick = (v: string) => {
    if (picked) return;
    setPicked(v);
    if (v !== target) onMistake();
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {q.mode === 'word' ? (
        <>
          <TaskBubble text="Що це за слово?" onSay={hear}>
            <PictureCard><span style={{ ...BIG, fontSize: 56, color: 'var(--c-ink)', letterSpacing: 2 }}>{q.item.word}</span></PictureCard>
          </TaskBubble>
          <Balloons options={q.options.map((o) => ({ value: o.word, node: <span style={{ fontSize: 46 }}>{o.emoji}</span> }))} correct={q.item.word} disabled={!!picked} answerState={state} onPick={pick} />
        </>
      ) : (
        <>
          <TaskBubble text="Знайди склад, який я скажу!" onSay={hear} />
          <Balloons options={q.options.map((o) => ({ value: o, node: o }))} correct={q.answer} disabled={!!picked} answerState={state} onPick={pick} />
        </>
      )}
    </div>
  );
}

function Component({ round, onAnswer, onMistake }: GameComponentProps<BoardPayload, Answer>) {
  const [quiz] = useState(() => buildQuiz(round.payload.difficulty));
  const done = useCallback(() => onAnswer(BOARD_DONE), [onAnswer]);
  return <Game quiz={quiz} onMistake={onMistake} onDone={done} />;
}

const ukSyllables: GameDefinition<BoardPayload, Answer> = {
  id: 'uk-syllables',
  title: 'Зливаємо склади',
  subject: 'language',
  levels: ['L0', 'L3'],
  icon: '🧩',
  description: 'Веди букву до букви — почуй, як вони зливаються в склад.',
  accent: '#FEF3C7',
  generate,
  Component,
};

export default ukSyllables;
