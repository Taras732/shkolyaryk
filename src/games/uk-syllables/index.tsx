import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { BOARD_DONE } from '../types';
import { sayUk } from '../shared/uk-audio';
import { Balloons, PictureCard, TaskBubble, useBoardProgress } from '../shared/preschool';
import { useProfileStore } from '@/stores/useProfileStore';
import {
  QUICK_PASS, ROUNDS, buildSession, isLong, open, passGroup, record, statusOf, sylsOf,
  type Status, type SylProgress,
} from './core';

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

const STATUS_BG: Record<Status, string> = { locked: 'rgba(255,255,255,.7)', learning: '#FFE7B3', known: '#CDEFD2', gold: '#FFD95A' };
const STATUS_INK: Record<Status, string> = { locked: '#B5B9C9', learning: '#8A5A00', known: '#1E7A3A', gold: '#7A5200' };

/** Смужка складів поточної групи — у сцені вгорі, як смужка букв у букварі. */
function SylStrip({ progress, group }: { progress: SylProgress; group: number }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4, padding: '0 10px' }}>
      {sylsOf(group).map((sy) => {
        const st = statusOf(progress[sy]);
        return (
          <span key={sy} style={{ ...BIG, minWidth: 34, height: 26, padding: '0 4px', borderRadius: 9, display: 'grid', placeItems: 'center', fontSize: 13, background: STATUS_BG[st], color: STATUS_INK[st], boxShadow: '0 2px 0 #F1E3CF' }}>{sy}</span>
        );
      })}
    </div>
  );
}

const keyFor = (id: string) => `shk.uks.v1.${id}`;
function load(id: string): SylProgress {
  try {
    return JSON.parse(localStorage.getItem(keyFor(id)) ?? '{}') as SylProgress;
  } catch {
    return {};
  }
}
function save(id: string, p: SylProgress) {
  try {
    localStorage.setItem(keyFor(id), JSON.stringify(p));
  } catch {
    // без памʼяті — не біда
  }
}

// звук букви: протяжний приголосний — тягнемо («мммм»), короткий і голосний — назва
const sayLetter = (ch: string) => (isLong(ch) ? sayUk(`c_${ch}`, ch.toLowerCase()) : sayUk(`n_${ch}`, ch.toLowerCase()));

function Component({ round, onAnswer, onMistake }: GameComponentProps<BoardPayload, Answer>) {
  const d = round.payload.difficulty;
  const profileId = useProfileStore((st) => st.activeProfile?.id) ?? 'guest';
  const [progress, setProgress] = useState<SylProgress>(() => load(profileId));
  const [session] = useState(() => buildSession(load(profileId), d));
  const [idx, setIdx] = useState(0);
  const [wordFind, setWordFind] = useState(false); // слово: після доріжки — вибір картинки
  const [picked, setPicked] = useState<string | null>(null);
  const [tried, setTried] = useState(false); // у цьому кроці вже була помилка
  const [run, setRun] = useState(0); // поспіль правильних з першої спроби (для перевірки групи)
  const [passed, setPassed] = useState(false);
  const step = session.steps[idx];
  const report = useBoardProgress();
  useEffect(() => report(Math.round((idx / session.steps.length) * 5)), [idx, session.steps.length, report]);

  const update = (fn: (p: SylProgress) => SylProgress) =>
    setProgress((prev) => {
      const nx = fn(prev);
      save(profileId, nx);
      return nx;
    });

  const done = useCallback(() => onAnswer(BOARD_DONE), [onAnswer]);
  const next = useCallback(() => {
    setPicked(null);
    setTried(false);
    setWordFind(false);
    if (idx + 1 < session.steps.length) { setIdx(idx + 1); return; }
    // кінець перевірки: 5 поспіль — група зарахована
    if (session.check && run >= QUICK_PASS) {
      update((p) => passGroup(p, session.group, Date.now()));
      setPassed(true);
      return;
    }
    done();
  }, [idx, session, run, done]); // eslint-disable-line react-hooks/exhaustive-deps

  const target = !step ? '' : step.kind === 'find' ? step.target : step.kind === 'word' ? step.item.word : step.syl;
  const hear = useCallback(() => {
    if (!step) return;
    if (step.kind === 'word') sayUk(`w_${step.item.word.toLowerCase()}`, step.item.word.toLowerCase());
    else saySyl(target);
  }, [step, target]);

  // «знайди»: ціль звучить рівно раз на вході; далі — лише 🔊
  const finding = step?.kind === 'find' || (step?.kind === 'word' && wordFind);
  useEffect(() => {
    if (!finding) return;
    const t = window.setTimeout(hear, 300);
    return () => window.clearTimeout(t);
  }, [finding, idx]); // eslint-disable-line react-hooks/exhaustive-deps

  // відповідь: правильно — далі; помилка — показали підказку, пробуємо ще
  useEffect(() => {
    if (!picked) return;
    const ok = picked === target;
    const t = window.setTimeout(ok ? next : () => setPicked(null), ok ? CORRECT_MS : 1100);
    return () => window.clearTimeout(t);
  }, [picked, target, next]);

  if (passed) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <TaskBubble text="Ти вже вмієш ці склади!" sceneTop={<SylStrip progress={progress} group={session.group} />}>
          <PictureCard><span style={{ fontSize: 80 }}>⭐</span></PictureCard>
        </TaskBubble>
        <button className="g-btn primary" onClick={done}>Далі →</button>
      </div>
    );
  }
  if (!step) return null;
  const strip = <SylStrip progress={progress} group={session.group} />;

  // ДОРІЖКА (новий склад або слово)
  if (step.kind === 'slide' || (step.kind === 'word' && !wordFind)) {
    const left = step.kind === 'word' ? step.item.syl : step.left;
    const right = step.kind === 'word' ? step.item.end : step.right;
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <TaskBubble text={step.kind === 'word' ? 'Дотягни звук до складу!' : 'Натисни букви, а потім дотягни одну до одної!'} onSay={hear} sceneTop={strip}>
          <Track
            key={idx}
            left={left}
            right={right}
            onTapLeft={() => (step.kind === 'word' ? saySyl(left) : sayLetter(left))}
            onTapRight={() => sayLetter(right)}
            onMerge={() => {
              hear();
              if (step.kind === 'slide') update((p) => open(p, step.syl, Date.now()));
              window.setTimeout(() => (step.kind === 'word' ? setWordFind(true) : next()), AFTER_MERGE_MS);
            }}
          />
        </TaskBubble>
        <div style={{ height: 100 }} />
      </div>
    );
  }

  const state = !picked ? 'idle' : picked === target ? 'correct' : 'incorrect';
  const pickIt = (v: string) => {
    if (picked) return;
    setPicked(v);
    const ok = v === target;
    if (step.kind === 'find' && !tried) {
      update((p) => record(p, target, ok, Date.now()));
      setRun((n) => (ok ? n + 1 : 0));
    }
    if (!ok) { setTried(true); onMistake(); }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {step.kind === 'word' ? (
        <>
          <TaskBubble text="Що це за слово?" onSay={hear} sceneTop={strip}>
            <PictureCard><span style={{ ...BIG, fontSize: 56, color: 'var(--c-ink)', letterSpacing: 2 }}>{step.item.word}</span></PictureCard>
          </TaskBubble>
          <Balloons options={step.options.map((o) => ({ value: o.word, node: <span style={{ fontSize: 46 }}>{o.emoji}</span> }))} correct={step.item.word} disabled={!!picked} answerState={state} onPick={pickIt} />
        </>
      ) : (
        <>
          <TaskBubble text="Знайди склад, який я скажу!" onSay={hear} sceneTop={strip} />
          <Balloons options={step.options.map((o) => ({ value: o, node: o }))} correct={step.target} disabled={!!picked} answerState={state} onPick={pickIt} />
        </>
      )}
    </div>
  );
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
