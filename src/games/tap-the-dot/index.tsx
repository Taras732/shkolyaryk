import { useEffect, useState } from 'react';
import type { GameDefinition, GameComponentProps, Difficulty, LevelData, Round } from '../types';
import { BOARD_DONE } from '../types';
import { randInt } from '../shared/ui';

type Answer = typeof BOARD_DONE;

interface Payload {
  dotSize: number;
  hitsNeeded: number;
  /** Як часто крапка перелітає на нове місце, мс (вона весь час рухається). */
  hopMs: number;
}

function paramsFor(difficulty: Difficulty): Payload {
  if (difficulty === 1) return { dotSize: 76, hitsNeeded: 6, hopMs: 2200 };
  if (difficulty === 2) return { dotSize: 58, hitsNeeded: 8, hopMs: 1500 };
  return { dotSize: 44, hitsNeeded: 10, hopMs: 1050 };
}

function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const payload = paramsFor(difficulty);
  const round: Round<Payload, Answer> = {
    id: `board-${difficulty}`,
    payload,
    answer: BOARD_DONE,
  };
  return { difficulty, rounds: [round] };
}

function randomPos() {
  return { xPct: randInt(6, 84), yPct: randInt(6, 74) };
}

function Component({ round, disabled, onAnswer, onMistake }: GameComponentProps<Payload, Answer>) {
  const { dotSize, hitsNeeded, hopMs = 1800 } = round.payload;
  const [pos, setPos] = useState(randomPos);
  const [hits, setHits] = useState(0);
  const [pop, setPop] = useState(false);

  // крапка весь час перелітає з місця на місце (раніше стояла, поки не влучиш)
  useEffect(() => {
    if (disabled) return;
    const t = setInterval(() => setPos(randomPos()), hopMs);
    return () => clearInterval(t);
  }, [hopMs, disabled, hits]);

  function handleHit() {
    if (disabled) return;
    const next = hits + 1;
    if (next >= hitsNeeded) {
      onAnswer(BOARD_DONE);
      return;
    }
    setHits(next);
    setPop(true);
    setTimeout(() => setPop(false), 160);
    setPos(randomPos());
  }

  function handleMiss() {
    // на легкому рівні промах не карається: малі тільки вчаться влучати
    if (disabled || hopMs >= 2000) return;
    onMistake();
  }

  return (
    <div>
      <div
        style={{
          textAlign: 'center',
          fontFamily: 'var(--font-round)',
          fontWeight: 800,
          color: 'var(--c-mut)',
          marginBottom: 14,
        }}
      >
        Спіймано: {hits}/{hitsNeeded}
      </div>

      <div
        onPointerDown={handleMiss}
        style={{
          position: 'relative',
          width: '100%',
          height: 320,
          borderRadius: 'var(--c-r-sm)',
          background: 'var(--c-primary-soft)',
          overflow: 'hidden',
          cursor: 'pointer',
          touchAction: 'manipulation',
        }}
      >
        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            handleHit();
          }}
          disabled={disabled}
          aria-label="крапка"
          style={{
            position: 'absolute',
            left: `${pos.xPct}%`,
            top: `${pos.yPct}%`,
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            border: 'none',
            padding: 0,
            background: 'linear-gradient(135deg, var(--c-pink), var(--c-primary))',
            boxShadow: '0 4px 14px rgba(255,110,199,.45)',
            cursor: disabled ? 'default' : 'pointer',
            touchAction: 'manipulation',
            transform: pop ? 'scale(1.35)' : 'scale(1)',
            transition: `left ${hopMs * 0.6}ms cubic-bezier(.45,.05,.35,1), top ${hopMs * 0.6}ms cubic-bezier(.45,.05,.35,1), transform .15s`,
          }}
        />
      </div>
    </div>
  );
}

const tapTheDot: GameDefinition<Payload, Answer> = {
  id: 'tap-the-dot',
  title: 'Спіймай крапку',
  subject: 'attention',
  levels: ['L0', 'L3'],
  icon: '🎯',
  description: 'Спіймай крапку.',
  accent: '#FEE2E2',
  generate,
  Component,
  // TODO(A2-увага): skills після seed skill-graph уваги
};

export default tapTheDot;
