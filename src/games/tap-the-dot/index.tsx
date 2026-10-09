import { useEffect, useRef, useState } from 'react';
import type { GameDefinition, GameComponentProps, Difficulty, LevelData, Round } from '../types';
import { BOARD_DONE } from '../types';
import { randInt } from '../shared/ui';
import { sayUk } from '../shared/uk-audio';
import { TaskBubble, useBoardProgress } from '../shared/preschool';

/**
 * «Спіймай світлячка» (переробка «Спіймай крапку», 09.10.2026).
 * Сама швидкість тапу дає мало; користь — стеження очима + координація, а на рівні 3 —
 * «лови, але не все» (go/no-go): світлячків ловимо, бджілку не чіпаємо — вчить стримувати імпульс.
 *  1 — один світлячок, повільно;  2 — двоє, швидше;  3 — двоє світлячків + бджілка (не чіпати).
 * id гри лишається tap-the-dot (прогрес і плани не ламаються).
 */
type Answer = typeof BOARD_DONE;

interface Payload {
  flies: number;
  bee: boolean;
  hitsNeeded: number;
  /** Як часто світлячок обирає нове місце, мс (летить туди плавно весь цей час). */
  hopMs: number;
}

function paramsFor(d: Difficulty): Payload {
  if (d === 1) return { flies: 1, bee: false, hitsNeeded: 6, hopMs: 2200 };
  if (d === 2) return { flies: 2, bee: false, hitsNeeded: 8, hopMs: 1600 };
  return { flies: 2, bee: true, hitsNeeded: 10, hopMs: 1400 };
}

function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  return { difficulty, rounds: [{ id: `board-${difficulty}`, payload: paramsFor(difficulty), answer: BOARD_DONE } as Round<Payload, Answer>] };
}

const pos = () => ({ x: randInt(8, 80), y: randInt(10, 78) });

function Firefly({ x, y, hopMs, onTap, pop }: { x: number; y: number; hopMs: number; onTap: () => void; pop: boolean }) {
  return (
    <button type="button" onPointerDown={onTap} aria-label="світлячок"
      style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 64, height: 64, marginLeft: -32, marginTop: -32, border: 0, padding: 0, background: 'transparent', cursor: 'pointer',
        transition: `left ${hopMs}ms ease-in-out, top ${hopMs}ms ease-in-out`, zIndex: 2 }}>
      <span style={{ display: 'block', width: '100%', height: '100%', borderRadius: '50%',
        background: 'radial-gradient(circle, #FFF7B0 0%, #FFE04D 35%, rgba(255,214,0,.35) 60%, transparent 72%)',
        animation: pop ? 'pk-pop .3s ease-out' : 'tf-glow 1.2s ease-in-out infinite' }} />
    </button>
  );
}

function Component({ round, disabled, onAnswer, onMistake }: GameComponentProps<Payload, Answer>) {
  const { flies, bee, hitsNeeded, hopMs } = round.payload;
  const [ps, setPs] = useState(() => Array.from({ length: flies }, pos));
  const [beePos, setBeePos] = useState(pos);
  const [hits, setHits] = useState(0);
  const [pop, setPop] = useState<number | null>(null);
  const [sparks, setSparks] = useState<{ x: number; y: number; k: number } | null>(null);
  const [beeShake, setBeeShake] = useState(false);
  const done = useRef(false);
  const report = useBoardProgress();
  useEffect(() => report(Math.round((hits / hitsNeeded) * 5)), [hits, hitsNeeded, report]);

  // завдання — раз на старті
  useEffect(() => {
    const t = window.setTimeout(() => (bee ? sayUk('p_fly_bee', 'Лови світлячків, але не чіпай бджілку!') : sayUk('p_fly', 'Лови світлячків!')), 300);
    return () => window.clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // світлячки (і бджілка) весь час плавно перелітають
  useEffect(() => {
    if (disabled) return;
    const t = window.setInterval(() => {
      setPs((cur) => cur.map(pos));
      setBeePos(pos());
    }, hopMs);
    return () => window.clearInterval(t);
  }, [hopMs, disabled]);

  const catchFly = (i: number) => {
    if (disabled || done.current) return;
    const next = hits + 1;
    setSparks({ x: ps[i].x, y: ps[i].y, k: next });
    setPop(i);
    window.setTimeout(() => setPop(null), 300);
    setPs((cur) => cur.map((p, k) => (k === i ? pos() : p)));
    setHits(next);
    if (next >= hitsNeeded) {
      done.current = true;
      window.setTimeout(() => onAnswer(BOARD_DONE), 500);
    }
  };

  const touchBee = () => {
    if (disabled || done.current) return;
    setBeeShake(true);
    onMistake();
    window.setTimeout(() => setBeeShake(false), 450);
  };

  return (
    <TaskBubble text={bee ? 'Лови світлячків, але не чіпай бджілку!' : 'Лови світлячків!'} sceneBg="linear-gradient(180deg, #2E2A5A 0%, #4B3F7A 70%, #6B5A8E 100%)">
      <style>{'@keyframes tf-glow { 0%,100% { transform: scale(1); opacity: .95 } 50% { transform: scale(1.15); opacity: .75 } }'}</style>
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* зорі на тлі */}
        {[[12, 14], [70, 10], [40, 22], [86, 30], [24, 40], [58, 52]].map(([x, y], i) => (
          <span key={i} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 3, height: 3, borderRadius: '50%', background: '#fff', opacity: 0.6 }} />
        ))}
        {ps.map((p, i) => <Firefly key={i} x={p.x} y={p.y} hopMs={hopMs} pop={pop === i} onTap={() => catchFly(i)} />)}
        {bee && (
          <button type="button" onPointerDown={touchBee} aria-label="бджілка"
            style={{ position: 'absolute', left: `${beePos.x}%`, top: `${beePos.y}%`, width: 60, height: 60, marginLeft: -30, marginTop: -30, border: 0, background: 'transparent', fontSize: 46, cursor: 'pointer',
              transition: `left ${hopMs}ms ease-in-out, top ${hopMs}ms ease-in-out`, animation: beeShake ? 'pk-shake .4s ease' : undefined, zIndex: 2 }}>
            🐝
          </button>
        )}
        {sparks && ['-30px,-28px', '30px,-26px', '0,-40px', '-26px,24px', '28px,26px'].map((d, k) => {
          const [dx, dy] = d.split(',');
          return <span key={`${sparks.k}-${k}`} style={{ position: 'absolute', left: `${sparks.x}%`, top: `${sparks.y}%`, fontSize: 18, ['--dx' as string]: dx, ['--dy' as string]: dy, animation: 'pk-spark .6s ease-out forwards', pointerEvents: 'none' }}>✨</span>;
        })}
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
