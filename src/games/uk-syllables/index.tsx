import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { BOARD_DONE } from '../types';
import { sayUk } from '../shared/uk-audio';
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
const AFTER_MERGE_MS = 1600;
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
 * Доріжка: дві букви. Тап по букві — вона звучить. Тягни ліву до правої — на зустрічі
 * картки зливаються з «бум» і зірочками, і лише тоді звучить склад (рішення 09.10).
 * Злиття спрацьовує рівно раз (запобіжник arrived) — інакше звук і перехід множились.
 */
function Track({ left, right, onTapLeft, onTapRight, onMerge }: { left: string; right: string; onTapLeft: () => void; onTapRight: () => void; onMerge: () => void }) {
  const rail = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(0);
  const [max, setMax] = useState(180);
  const [merged, setMerged] = useState(false);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x0: number; startX: number; moved: boolean } | null>(null);
  const arrived = useRef(false);

  useEffect(() => {
    const w = rail.current?.clientWidth ?? 280;
    setMax(Math.max(80, w - 86 - 86 - 8));
  }, []);

  const merge = () => {
    if (arrived.current) return;
    arrived.current = true;
    drag.current = null;
    setDragging(false);
    setX(max);
    window.setTimeout(() => setMerged(true), 120);
    onMerge();
  };

  const sparks = ['-70px,-50px', '70px,-46px', '-60px,48px', '64px,52px', '0,-74px', '0,70px'];

  return (
    <div ref={rail} style={{ width: '100%', maxWidth: 320, position: 'relative', height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {merged ? (
        <div style={{ position: 'relative' }}>
          <div style={{ ...TILE('#16A34A'), fontSize: 64, minWidth: 150, height: 96, animation: 'pk-pop .5s ease-out forwards' }}>{left + right}</div>
          {sparks.map((p, k) => {
            const [dx, dy] = p.split(',');
            return <span key={k} style={{ position: 'absolute', left: '44%', top: '36%', fontSize: 24, ['--dx' as string]: dx, ['--dy' as string]: dy, animation: 'pk-spark .7s ease-out forwards' }}>⭐</span>;
          })}
        </div>
      ) : (
        <>
          <div style={{ position: 'absolute', left: 64, right: 64, top: '50%', height: 6, marginTop: -3, borderRadius: 6, background: 'repeating-linear-gradient(90deg,#F2C79B 0 10px,transparent 10px 20px)' }} />
          <div
            onPointerDown={(e) => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); drag.current = { x0: e.clientX, startX: x, moved: false }; }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (!d) return;
              const dx = e.clientX - d.x0;
              if (Math.abs(dx) > 6) { d.moved = true; setDragging(true); }
              if (!d.moved) return;
              const nx = Math.max(0, Math.min(max, d.startX + dx));
              setX(nx);
              if (nx >= max * 0.85) merge();
            }}
            onPointerUp={() => {
              const d = drag.current;
              drag.current = null;
              setDragging(false);
              if (!d || arrived.current) return;
              if (!d.moved) onTapLeft();
              else setX(0); // не дотягнули — буква повертається
            }}
            style={{ ...TILE('#2563EB'), position: 'absolute', left: 0, transform: `translateX(${x}px) scale(${dragging ? 1.08 : 1})`, cursor: 'grab', zIndex: 2, transition: dragging ? 'none' : 'transform .25s ease' }}
          >
            {left}
          </div>
          <div onClick={onTapRight} style={{ ...TILE('#DC2626'), position: 'absolute', right: 0, cursor: 'pointer' }}>{right}</div>
          {x === 0 && !dragging && (
            <div className="pk-anim" style={{ position: 'absolute', left: 64, top: 104, fontSize: 30, animation: 'pk-float 1.4s ease-in-out infinite', pointerEvents: 'none' }}>👆</div>
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

  // «знайди»: ціль звучить рівно раз на вході; далі — лише 🔊
  useEffect(() => {
    if (phase !== 'find') return;
    const t = window.setTimeout(hear, 300);
    return () => window.clearTimeout(t);
  }, [phase, idx]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // звук букви: протяжний приголосний — тягнемо («мммм»), короткий і голосний — назва
  const sayLetter = (ch: string) => (isLong(ch) ? sayUk(`c_${ch}`, ch.toLowerCase()) : sayUk(`n_${ch}`, ch.toLowerCase()));

  if (phase === 'slide') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <TaskBubble text={q.mode === 'word' ? 'Дотягни звук до складу!' : 'Натисни букви, а потім дотягни одну до одної!'} onSay={hear}>
          <Track
            key={idx}
            left={left}
            right={right}
            onTapLeft={() => (q.mode === 'word' ? saySyl(left) : sayLetter(left))}
            onTapRight={() => sayLetter(right)}
            onMerge={() => {
              hear();
              window.setTimeout(() => setPhase('find'), AFTER_MERGE_MS);
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
