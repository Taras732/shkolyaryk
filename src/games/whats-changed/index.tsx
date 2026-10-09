import { useEffect, useState } from 'react';
import type { GameDefinition, GameComponentProps, Difficulty, ProfileLevel, LevelData, Round } from '../types';
import { motion } from 'motion/react';
import { shuffle } from '../shared/ui';
import { TaskBubble } from '../shared/preschool';
import { sayUk } from '../shared/uk-audio';

interface Cell {
  id: string;
  emoji: string;
}

interface Payload {
  initial: Cell[];
  changed: Cell[];
}

const EMOJI_POOL = [
  '🍎', '🍌', '🍇', '🍓', '🍒', '🍑', '🍉', '🥝',
  '🐶', '🐱', '🐰', '🦊', '🐼', '🐨', '🐸', '🐵',
  '🚗', '🚌', '🚀', '✈️', '⭐', '🌸', '🌈', '🎈',
];

const MEMORIZE_MS = 2500;
const ROUNDS_PER_LEVEL = 5;

/** Розмір сітки (к-сть клітинок) за рівнем профілю і складністю. */
function gridSizeFor(level: ProfileLevel, difficulty: Difficulty): number {
  if (level === 'L0') {
    return difficulty === 1 ? 4 : difficulty === 2 ? 6 : 9; // дошкілля: 4 → 6 → 9
  }
  return difficulty === 1 ? 6 : difficulty === 2 ? 9 : 12; // diff1=6, diff2=9, diff3=12
}

function columnsFor(size: number): number {
  if (size <= 4) return 2;
  if (size <= 9) return 3;
  return 4;
}

/** Один раунд: сітка з size емодзі, одна клітинка замінена в "changed". */
function buildRound(index: number, size: number): Round<Payload, string> {
  const picked = shuffle(EMOJI_POOL).slice(0, size);
  const initial: Cell[] = picked.map((emoji, i) => ({ id: `c${i}`, emoji }));
  const changedIndex = Math.floor(Math.random() * size);

  const used = new Set(picked);
  const replacementPool = EMOJI_POOL.filter((e) => !used.has(e));
  const replacement = replacementPool[Math.floor(Math.random() * replacementPool.length)];

  const changed: Cell[] = initial.map((cell, i) =>
    i === changedIndex ? { ...cell, emoji: replacement } : cell,
  );

  return {
    id: `r${index}`,
    payload: { initial, changed },
    answer: initial[changedIndex].id,
  };
}

function generate(difficulty: Difficulty, level: ProfileLevel): LevelData<Payload, string> {
  const size = gridSizeFor(level, difficulty);
  const rounds: Round<Payload, string>[] = [];
  for (let i = 0; i < ROUNDS_PER_LEVEL; i++) rounds.push(buildRound(i, size));
  return { difficulty, rounds };
}

type Phase = 'memorize' | 'flip' | 'answer';

const FLIP_MS = 700;

/**
 * Вигляд B2 (09.10.2026): картки в сцені; запамʼятовування — смужка-таймер; далі картки
 * перевертаються на сорочку й розкриваються вже зі зміною — дитина бачить «момент зміни».
 * Завдання звучить лише в першому раунді.
 */
function Component({ round, roundIndex, disabled, answerState, onAnswer }: GameComponentProps<Payload, string>) {
  const { initial, changed } = round.payload;
  const [phase, setPhase] = useState<Phase>('memorize');

  useEffect(() => {
    if (roundIndex === 0) sayUk('p_remember', 'Запамʼятай!');
    const t1 = window.setTimeout(() => setPhase('flip'), MEMORIZE_MS);
    const t2 = window.setTimeout(() => {
      setPhase('answer');
      if (roundIndex === 0) sayUk('p_changed', 'Що змінилось?');
    }, MEMORIZE_MS + FLIP_MS);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cells = phase === 'answer' ? changed : initial;
  const cols = columnsFor(cells.length);
  const size = cols === 2 ? 110 : 86;

  return (
    <TaskBubble text={phase === 'answer' ? 'Що змінилось? Натисни!' : 'Запамʼятай!'}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        {/* таймер запамʼятовування — смужка, що зменшується */}
        <div style={{ width: 180, height: 10, borderRadius: 10, background: 'rgba(255,255,255,.7)', overflow: 'hidden', visibility: phase === 'memorize' ? 'visible' : 'hidden' }}>
          <div style={{ height: '100%', background: '#F08A24', borderRadius: 10, animation: `wc-shrink ${MEMORIZE_MS}ms linear forwards` }} />
        </div>
        <style>{'@keyframes wc-shrink { from { width: 100% } to { width: 0% } }'}</style>
        <div className={answerState === 'incorrect' ? 'shake' : ''} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${size}px)`, gap: 12 }}>
          {cells.map((cell) => {
            const win = phase === 'answer' && answerState !== 'idle' && cell.id === round.answer;
            const back = phase === 'flip';
            return (
              <motion.button key={cell.id} type="button" disabled={disabled || phase !== 'answer'} onClick={() => phase === 'answer' && onAnswer(cell.id)}
                whileTap={{ scale: 0.93 }} animate={{ rotateY: back ? 180 : 0 }} transition={{ duration: FLIP_MS / 2000 }}
                style={{ width: size, height: size, borderRadius: 26, border: 0, cursor: phase === 'answer' ? 'pointer' : 'default', display: 'grid', placeItems: 'center',
                  fontSize: cols === 2 ? 62 : 48,
                  background: back ? 'linear-gradient(135deg, #FFC98F, #FFAE6B)' : win ? '#DCF7E3' : '#fff',
                  boxShadow: `0 6px 0 ${back ? '#E8975A' : win ? '#9FDDB0' : '#EED9BF'}${win ? ', 0 0 0 4px #22C55E' : ''}`,
                  color: '#fff' }}>
                {back ? '★' : cell.emoji}
              </motion.button>
            );
          })}
        </div>
      </div>
    </TaskBubble>
  );
}

const whatsChanged: GameDefinition<Payload, string> = {
  id: 'whats-changed',
  title: 'Що змінилось',
  subject: 'memory',
  levels: ['L0', 'L3'],
  icon: '🔎',
  description: "Запам'ятай і знайди, що змінилось.",
  accent: '#FCE7F3',
  generate,
  Component,
  // TODO(A2-память): skills після seed skill-graph пам'яті
};

export default whatsChanged;
