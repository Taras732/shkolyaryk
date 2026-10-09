import { useEffect, useRef, useState } from 'react';
import type { GameDefinition, GameComponentProps, Difficulty, LevelData, Round } from '../types';
import { BOARD_DONE } from '../types';
import { sayUk } from '../shared/uk-audio';
import { TaskBubble, useBoardProgress } from '../shared/preschool';

/**
 * «Спіймай світлячка» (переробка «Спіймай крапку», 09.10.2026).
 * Користь — стеження очима + координація; на рівні 3 «лови, але не все» (go/no-go):
 * світлячків ловимо, бджілку не чіпаємо — вчить стримувати імпульс.
 *  1 — один світлячок, повільно;  2 — двоє, швидше;  3 — двоє світлячків + бджілка.
 * Рух — хвилясті траєкторії (сума синусоїд, у кожного свій ритм), не прямі.
 * Спійманий спалахує й зникає, новий підлітає з-за краю сцени.
 * id гри лишається tap-the-dot (прогрес і плани не ламаються).
 */
type Answer = typeof BOARD_DONE;

interface Payload {
  flies: number;
  bee: boolean;
  hitsNeeded: number;
  /** Швидкість кружляння (множник). */
  speed: number;
}

function paramsFor(d: Difficulty): Payload {
  if (d === 1) return { flies: 1, bee: false, hitsNeeded: 6, speed: 0.6 };
  if (d === 2) return { flies: 2, bee: false, hitsNeeded: 8, speed: 0.95 };
  return { flies: 2, bee: true, hitsNeeded: 10, speed: 1.05 };
}

function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  return { difficulty, rounds: [{ id: `board-${difficulty}`, payload: paramsFor(difficulty), answer: BOARD_DONE } as Round<Payload, Answer>] };
}

/** Політ: центр, що повільно дрейфує, + дві хвилі різної частоти по x і y. */
interface Flight {
  id: number;
  cx: number; cy: number;
  ax: number; ay: number;
  w1: number; w2: number; p1: number; p2: number;
  /** Звідки підлітає (за краєм сцени) і коли зʼявився. */
  fromX: number; fromY: number; born: number;
}

const ENTER_MS = 700;
let nextId = 1;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

function newFlight(now: number, fromEdge: boolean): Flight {
  const left = Math.random() < 0.5;
  return {
    id: nextId++,
    cx: rnd(30, 70), cy: rnd(28, 70),
    ax: rnd(16, 26), ay: rnd(12, 20),
    w1: rnd(0.5, 0.9), w2: rnd(0.9, 1.5), p1: rnd(0, 6.28), p2: rnd(0, 6.28),
    fromX: fromEdge ? (left ? -10 : 110) : rnd(30, 70), fromY: fromEdge ? rnd(15, 85) : rnd(30, 70),
    born: now,
  };
}

function place(f: Flight, t: number, speed: number): { x: number; y: number } {
  const s = (t / 1000) * speed;
  // центр теж повільно блукає — щоб траєкторія не була однаковою петлею
  const cx = f.cx + 10 * Math.sin(s * 0.23 + f.p2);
  const cy = f.cy + 8 * Math.cos(s * 0.19 + f.p1);
  let x = cx + f.ax * Math.sin(s * f.w1 + f.p1) + 6 * Math.sin(s * f.w2 * 1.7 + f.p2);
  let y = cy + f.ay * Math.sin(s * f.w2 + f.p2) + 5 * Math.cos(s * f.w1 * 2.1 + f.p1);
  x = Math.max(8, Math.min(92, x));
  y = Math.max(10, Math.min(88, y));
  // підліт з-за краю: плавно від точки входу до траєкторії
  const k = Math.min(1, (t - f.born) / ENTER_MS);
  const e = k < 1 ? 1 - (1 - k) ** 3 : 1;
  return { x: f.fromX + (x - f.fromX) * e, y: f.fromY + (y - f.fromY) * e };
}

interface Burst { id: number; x: number; y: number }

function Component({ round, disabled, onAnswer, onMistake }: GameComponentProps<Payload, Answer>) {
  const { flies, bee, hitsNeeded, speed } = round.payload;
  const [now, setNow] = useState(() => performance.now());
  const [list, setList] = useState<Flight[]>(() => Array.from({ length: flies }, () => newFlight(performance.now(), false)));
  const [beeF] = useState<Flight>(() => newFlight(performance.now(), false));
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [hits, setHits] = useState(0);
  const [beeShake, setBeeShake] = useState(false);
  const done = useRef(false);
  const report = useBoardProgress();
  useEffect(() => report(Math.round((hits / hitsNeeded) * 5)), [hits, hitsNeeded, report]);

  // завдання — раз на старті
  useEffect(() => {
    const t = window.setTimeout(() => (bee ? sayUk('p_fly_bee', 'Лови світлячків, але не чіпай бджілку!') : sayUk('p_fly', 'Лови світлячків!')), 300);
    return () => window.clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // кадр анімації: позиції рахуються з часу
  useEffect(() => {
    if (disabled) return;
    let raf = 0;
    const tick = () => { setNow(performance.now()); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [disabled]);

  const catchFly = (f: Flight) => {
    if (disabled || done.current) return;
    const p = place(f, performance.now(), speed);
    const b = { id: f.id, x: p.x, y: p.y };
    setBursts((cur) => [...cur, b]);
    window.setTimeout(() => setBursts((cur) => cur.filter((x) => x.id !== b.id)), 800);
    // спійманий зникає, новий підлітає з-за краю
    setList((cur) => cur.map((x) => (x.id === f.id ? newFlight(performance.now(), true) : x)));
    const next = hits + 1;
    setHits(next);
    if (next >= hitsNeeded) {
      done.current = true;
      window.setTimeout(() => onAnswer(BOARD_DONE), 700);
    }
  };

  const touchBee = () => {
    if (disabled || done.current) return;
    setBeeShake(true);
    onMistake();
    window.setTimeout(() => setBeeShake(false), 450);
  };

  const bp = place(beeF, now, speed * 0.8);

  return (
    <TaskBubble text={bee ? 'Лови світлячків, але не чіпай бджілку!' : 'Лови світлячків!'} sceneBg="linear-gradient(180deg, #2E2A5A 0%, #4B3F7A 70%, #6B5A8E 100%)">
      <style>{`
        @keyframes tf-glow { 0%,100% { transform: scale(1); opacity: .95 } 50% { transform: scale(1.18); opacity: .75 } }
        @keyframes tf-flash { 0% { transform: scale(.6); opacity: 1 } 100% { transform: scale(2.6); opacity: 0 } }
        @keyframes tf-plus { 0% { transform: translateY(0); opacity: 1 } 100% { transform: translateY(-46px); opacity: 0 } }
      `}</style>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {[[12, 14], [70, 10], [40, 22], [86, 30], [24, 40], [58, 52], [80, 66], [16, 72]].map(([x, y], i) => (
          <span key={i} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 3, height: 3, borderRadius: '50%', background: '#fff', opacity: 0.55 }} />
        ))}

        {list.map((f) => {
          const p = place(f, now, speed);
          return (
            <button key={f.id} type="button" onPointerDown={() => catchFly(f)} aria-label="світлячок"
              style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: 66, height: 66, marginLeft: -33, marginTop: -33, border: 0, padding: 0, background: 'transparent', cursor: 'pointer', zIndex: 2 }}>
              <span style={{ display: 'block', width: '100%', height: '100%', borderRadius: '50%',
                background: 'radial-gradient(circle, #FFFBD0 0%, #FFE04D 34%, rgba(255,214,0,.35) 60%, transparent 72%)', animation: 'tf-glow 1.1s ease-in-out infinite' }} />
            </button>
          );
        })}

        {bee && (
          <button type="button" onPointerDown={touchBee} aria-label="бджілка"
            style={{ position: 'absolute', left: `${bp.x}%`, top: `${bp.y}%`, width: 60, height: 60, marginLeft: -30, marginTop: -30, border: 0, background: 'transparent', fontSize: 46, cursor: 'pointer', zIndex: 2,
              transform: `scaleX(${Math.cos((now / 1000) * speed * beeF.w1 + beeF.p1) > 0 ? -1 : 1})`, animation: beeShake ? 'pk-shake .4s ease' : undefined }}>
            🐝
          </button>
        )}

        {/* ефект спіймання: спалах, іскри, «+1» */}
        {bursts.map((b) => (
          <div key={b.id} style={{ position: 'absolute', left: `${b.x}%`, top: `${b.y}%`, pointerEvents: 'none', zIndex: 3 }}>
            <span style={{ position: 'absolute', left: -40, top: -40, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, #FFFBD0 0%, rgba(255,224,77,.7) 40%, transparent 70%)', animation: 'tf-flash .6s ease-out forwards' }} />
            {['-46px,-40px', '46px,-36px', '0,-58px', '-40px,36px', '42px,38px', '-58px,0', '58px,4px'].map((d, k) => {
              const [dx, dy] = d.split(',');
              return <span key={k} style={{ position: 'absolute', left: -8, top: -10, fontSize: 18, ['--dx' as string]: dx, ['--dy' as string]: dy, animation: 'pk-spark .7s ease-out forwards' }}>✨</span>;
            })}
            <span style={{ position: 'absolute', left: -12, top: -46, fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: 22, color: '#FFE04D', textShadow: '0 2px 0 rgba(0,0,0,.25)', animation: 'tf-plus .8s ease-out forwards' }}>+1</span>
          </div>
        ))}
      </div>
    </TaskBubble>
  );
}

const tapTheDot: GameDefinition<Payload, Answer> = {
  id: 'tap-the-dot',
  title: 'Спіймай світлячка',
  subject: 'attention',
  levels: ['L0', 'L3'],
  icon: '✨',
  description: 'Лови світлячків — а бджілку не чіпай!',
  accent: '#EDE7FF',
  generate,
  Component,
};

export default tapTheDot;
