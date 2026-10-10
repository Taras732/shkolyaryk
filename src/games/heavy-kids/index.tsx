import { useEffect, useState } from 'react';
import { useMotionValueEvent, useSpring } from 'motion/react';
import type { Difficulty, GameComponentProps, GameDefinition, LevelData } from '../types';
import { sayUk } from '../shared/uk-audio';
import { SceneTask } from '../shared/count-ui';
import { ANIMALS, ROUNDS, makePairs, type AnimalId, type Pair } from './core';

type Payload = Pair;

function generate(difficulty: Difficulty): LevelData<Payload, AnimalId> {
  return { difficulty, rounds: makePairs(difficulty).map((p, i) => ({ id: `r${i}`, payload: p, answer: p.heavy })) };
}

const ARM = 120; // від осі до гачка шальки (одиниці viewBox)
const TILT = 15; // градусів, коли терези показали правду
const SIDE = 112; // звірятко однакового розміру — порівнюємо знанням, а не картинкою
const PIVOT = { x: 190, y: 104 };
const CHAIN = 128; // від гачка до краю шальки: гачок видно над головою звіра
const VB = { w: 380, h: 350 };

/** Латунні градієнти: об'єм без картинок — світло зверху-зліва, тінь знизу. */
function Defs() {
  return (
    <defs>
      <linearGradient id="hk-brass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFE3A3" />
        <stop offset=".45" stopColor="#E8AE4E" />
        <stop offset="1" stopColor="#A86E22" />
      </linearGradient>
      <linearGradient id="hk-col" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#A86E22" />
        <stop offset=".35" stopColor="#FFE3A3" />
        <stop offset=".6" stopColor="#E8AE4E" />
        <stop offset="1" stopColor="#8C5A1A" />
      </linearGradient>
      <radialGradient id="hk-bowl" cx=".35" cy=".2" r=".9">
        <stop offset="0" stopColor="#FFE9B8" />
        <stop offset=".55" stopColor="#E3A548" />
        <stop offset="1" stopColor="#9C6420" />
      </radialGradient>
      <radialGradient id="hk-bowl-ok" cx=".35" cy=".2" r=".9">
        <stop offset="0" stopColor="#E3FBE9" />
        <stop offset=".55" stopColor="#7FD49A" />
        <stop offset="1" stopColor="#3F9B5C" />
      </radialGradient>
      <radialGradient id="hk-knob" cx=".35" cy=".3" r=".75">
        <stop offset="0" stopColor="#FFF4D6" />
        <stop offset=".5" stopColor="#F2A93B" />
        <stop offset="1" stopColor="#B4651A" />
      </radialGradient>
      <radialGradient id="hk-shadow">
        <stop offset="0" stopColor="rgba(60,80,30,.35)" />
        <stop offset="1" stopColor="rgba(60,80,30,0)" />
      </radialGradient>
    </defs>
  );
}

/**
 * Терези 2.5D (10.10.2026, SVG): шальки висять на ланцюжках і лишаються рівними, коли коромисло нахиляється.
 * До відповіді стоять рівно (інакше відповідь видно); після тапу — нахил у бік важчого,
 * і на правильній, і на помилковій відповіді: дитина бачить, як насправді.
 */
function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, AnimalId>) {
  const { left, right, heavy } = round.payload;
  const [sel, setSel] = useState<AnimalId | null>(null);
  useEffect(() => {
    if (answerState === 'idle') setSel(null);
  }, [answerState]);
  const say = (again?: boolean) => (again || round.id === 'r0') && sayUk('p_heavy', 'Хто важчий?');
  const shown = answerState !== 'idle';
  const target = shown ? (heavy === left ? -TILT : TILT) : 0;
  // кут — пружина; кожен кадр перераховує кінці коромисла (шальки висять вертикально)
  const spring = useSpring(0, { stiffness: 260, damping: 15 }); // швидко: раунд змінюється через 0.85 с
  const [angle, setAngle] = useState(0);
  useMotionValueEvent(spring, 'change', setAngle);
  useEffect(() => spring.set(target), [target, spring]);

  const rad = (angle * Math.PI) / 180;
  const end = (side: -1 | 1) => ({ x: PIVOT.x + side * ARM * Math.cos(rad), y: PIVOT.y + side * ARM * Math.sin(rad) });

  const pan = (id: AnimalId, side: -1 | 1) => {
    const e = end(side);
    const rim = e.y + CHAIN;
    const picked = sel === id;
    const ok = picked && answerState === 'correct';
    const wrong = picked && answerState === 'incorrect';
    const hint = answerState === 'incorrect' && id === heavy;
    const tap = () => { if (disabled) return; setSel(id); onAnswer(id); };
    return (
      <g key={id} role="button" aria-label={ANIMALS.find((a) => a.id === id)!.name} onClick={tap} style={{ cursor: disabled ? 'default' : 'pointer' }}
        className={wrong ? 'hk-shake' : undefined}>
        {/* три ланцюжки від гачка до краю шальки */}
        {[-46, 0, 46].map((dx) => (
          <line key={dx} x1={e.x} y1={e.y} x2={e.x + dx} y2={rim} stroke="#B07A2E" strokeWidth={2} strokeDasharray="3 2" strokeLinecap="round" />
        ))}
        <circle cx={e.x} cy={e.y} r={6} fill="url(#hk-knob)" />
        {/* звірятко стоїть у шальці: низ картинки трохи нижче краю */}
        <image href={`/count/${id}.webp`} x={e.x - SIDE / 2} y={rim - SIDE + 10} width={SIDE} height={SIDE}
          style={{ filter: ok || hint ? 'drop-shadow(0 0 8px #22C55E)' : 'drop-shadow(0 3px 2px rgba(90,60,20,.2))' }} />
        {/* миска: передній край поверх лап, щоб звір «сидів» усередині */}
        <path d={`M ${e.x - 58} ${rim} Q ${e.x} ${rim + 50} ${e.x + 58} ${rim} Z`} fill={ok ? 'url(#hk-bowl-ok)' : 'url(#hk-bowl)'} />
        <ellipse cx={e.x} cy={rim} rx={58} ry={9} fill="none" stroke={ok ? '#3F9B5C' : '#8C5A1A'} strokeWidth={2.5} />
        <ellipse cx={e.x} cy={rim + 1} rx={52} ry={5} fill="none" stroke="rgba(255,255,255,.55)" strokeWidth={1.5} />
        {/* невидима велика зона тапу — малюк влучає в будь-яке місце біля звіра */}
        <rect x={e.x - 64} y={rim - SIDE} width={128} height={SIDE + 46} fill="transparent" />
      </g>
    );
  };

  return (
    <SceneTask question="Хто важчий?" say={say} sayKey={round.id} peek={false}
      sceneBg="linear-gradient(180deg, #FFF4E3 0%, #FFE9D2 70%, #DDEFC9 70%, #C6E3AC 100%)">
      <style>{`@keyframes hk-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}} .hk-shake{animation:hk-shake .4s ease}`}</style>
      <svg viewBox={`0 0 ${VB.w} ${VB.h}`} style={{ position: 'absolute', left: '50%', bottom: '8%', transform: 'translateX(-50%)', width: '100%', maxWidth: 400 }}>
        <Defs />
        {/* тінь на траві */}
        <ellipse cx={PIVOT.x} cy={336} rx={120} ry={12} fill="url(#hk-shadow)" />
        {/* основа: плаский циліндр */}
        <ellipse cx={PIVOT.x} cy={326} rx={70} ry={12} fill="#8C5A1A" />
        <rect x={PIVOT.x - 70} y={312} width={140} height={14} fill="url(#hk-col)" />
        <ellipse cx={PIVOT.x} cy={312} rx={70} ry={12} fill="url(#hk-brass)" />
        {/* колона */}
        <rect x={PIVOT.x - 9} y={PIVOT.y} width={18} height={312 - PIVOT.y} rx={6} fill="url(#hk-col)" />
        {/* коромисло: товстіше до центру */}
        <g transform={`rotate(${angle} ${PIVOT.x} ${PIVOT.y})`}>
          <path d={`M ${PIVOT.x - ARM - 6} ${PIVOT.y - 4} Q ${PIVOT.x} ${PIVOT.y - 13} ${PIVOT.x + ARM + 6} ${PIVOT.y - 4} L ${PIVOT.x + ARM + 6} ${PIVOT.y + 4} Q ${PIVOT.x} ${PIVOT.y + 13} ${PIVOT.x - ARM - 6} ${PIVOT.y + 4} Z`} fill="url(#hk-brass)" stroke="#8C5A1A" strokeWidth={1.5} />
        </g>
        <circle cx={PIVOT.x} cy={PIVOT.y} r={13} fill="url(#hk-knob)" stroke="#8C5A1A" strokeWidth={1.5} />
        {/* стрілка-показник над віссю */}
        <g transform={`rotate(${angle} ${PIVOT.x} ${PIVOT.y})`}>
          <path d={`M ${PIVOT.x} ${PIVOT.y - 44} L ${PIVOT.x - 6} ${PIVOT.y - 12} L ${PIVOT.x + 6} ${PIVOT.y - 12} Z`} fill="#F08A24" />
        </g>
        {pan(left, -1)}
        {pan(right, 1)}
      </svg>
    </SceneTask>
  );
}

const heavyKids: GameDefinition<Payload, AnimalId> = {
  id: 'heavy-kids',
  title: 'Хто важчий?',
  subject: 'logic',
  levels: ['L0'],
  icon: '⚖️',
  image: '/games/pz-heavier.webp',
  description: 'Терези й звірятка: хто з двох важчий?',
  accent: '#E0E7FF',
  generate,
  Component,
};

export { ROUNDS };
export default heavyKids;
