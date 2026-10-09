import { useEffect, useRef, useState } from 'react';
import type { GameDefinition, GameComponentProps, Difficulty, ProfileLevel, LevelData, Round } from '../types';
import { BOARD_DONE } from '../types';
import { TaskBubble, useBoardProgress } from '../shared/preschool';
import { shuffle } from '../shared/ui';

interface MemoryCard {
  id: string;
  emoji: string;
  pairKey: string;
}

interface Payload {
  pairs: number;
  cards: MemoryCard[];
}

type Answer = typeof BOARD_DONE;

const EMOJI_POOL = [
  '🦁', '🐸', '🐵', '🦊', '🐼', '🐨', '🦉', '🐯',
  '🐧', '🐰', '🐻', '🐷', '🍎', '🍌', '🍇', '🍓',
  '🍉', '🍒', '🥝', '🍍',
];

const MISTAKE_DELAY_MS = 800;

function pairsFor(level: ProfileLevel, difficulty: Difficulty): number {
  if (level === 'L0') {
    return difficulty === 1 ? 4 : difficulty === 2 ? 6 : 8;
  }
  return difficulty === 1 ? 6 : difficulty === 2 ? 8 : 10;
}

function buildCards(pairs: number): MemoryCard[] {
  const picked = shuffle(EMOJI_POOL).slice(0, pairs);
  const cards: MemoryCard[] = [];
  picked.forEach((emoji, i) => {
    cards.push({ id: `c${i}a`, emoji, pairKey: `p${i}` });
    cards.push({ id: `c${i}b`, emoji, pairKey: `p${i}` });
  });
  return shuffle(cards);
}

function generate(difficulty: Difficulty, level: ProfileLevel): LevelData<Payload, Answer> {
  const pairs = pairsFor(level, difficulty);
  const round: Round<Payload, Answer> = {
    id: `board-${difficulty}`,
    payload: { pairs, cards: buildCards(pairs) },
    answer: BOARD_DONE,
  };
  return { difficulty, rounds: [round] };
}

/** Сітка: 8 карт → 4×2, 12 карт → 3×4, 16/20 карт → 4×4 / 4×5. */
function columnsFor(totalCards: number): number {
  if (totalCards <= 8) return 4;
  if (totalCards <= 12) return 3;
  return 4;
}

function Component({ round, disabled, onAnswer, onMistake }: GameComponentProps<Payload, Answer>) {
  const { cards } = round.payload;
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
    const [busy, setBusy] = useState(false);
  const doneRef = useRef(false);
  const report = useBoardProgress();
  useEffect(() => report(Math.round((matched.size / cards.length) * 5)), [matched, cards.length, report]);

  // Порівняти дві відкриті картки, коли обидві показані.
  useEffect(() => {
    if (flipped.length !== 2) return;
    const [a, b] = flipped;

    if (cards[a].pairKey === cards[b].pairKey) {
      setMatched((prev) => new Set(prev).add(a).add(b));
      setFlipped([]);
      return;
    }

    setBusy(true);
    const timer = window.setTimeout(() => {
      setFlipped([]);
      setBusy(false);
      onMistake();
    }, MISTAKE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [flipped, cards, onMistake]);

  // Усі пари знайдено — завершити поле.
  useEffect(() => {
    if (doneRef.current) return;
    if (matched.size > 0 && matched.size === cards.length) {
      doneRef.current = true;
      onAnswer(BOARD_DONE);
    }
  }, [matched, cards.length, onAnswer]);

  function handleClick(index: number) {
    if (disabled || busy) return;
    if (flipped.length >= 2 || flipped.includes(index) || matched.has(index)) return;
    setFlipped((prev) => [...prev, index]);
  }

  const cols = columnsFor(cards.length);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TaskBubble text="Знайди однакові картки!">

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 10,
          width: '100%',
          maxWidth: 320,
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {cards.map((card, i) => {
          const isOpen = flipped.includes(i) || matched.has(i);
          const isMatched = matched.has(i);
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => handleClick(i)}
              disabled={disabled || busy || isMatched}
              aria-label={isOpen ? card.emoji : 'закрита картка'}
              style={{
                display: 'block',
                width: '100%',
                aspectRatio: '1',
                border: 'none',
                background: 'transparent',
                padding: 0,
                perspective: 600,
                cursor: disabled || busy || isMatched ? 'default' : 'pointer',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  transformStyle: 'preserve-3d',
                  transition: 'transform .4s ease',
                  transform: isOpen ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* Закрита сторона */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backfaceVisibility: 'hidden',
                    borderRadius: 22,
                    background: 'linear-gradient(135deg, #FFC98F, #FFAE6B)',
                    boxShadow: '0 5px 0 #E8975A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: 26, color: '#fff' }}>★</span>
                </div>

                {/* Відкрита сторона */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    borderRadius: 22,
                    background: isMatched ? '#DCF7E3' : '#fff',
                    boxShadow: `0 5px 0 ${isMatched ? '#9FDDB0' : '#EED9BF'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: cards.length > 12 ? 34 : 42 }}>{card.emoji}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      </TaskBubble>
    </div>
  );
}

const memoryPairs: GameDefinition<Payload, Answer> = {
  id: 'memory-pairs',
  title: 'Знайди пару',
  subject: 'memory',
  levels: ['L0', 'L3'],
  icon: '🧠',
  description: 'Перевертай картки й знаходь однакові пари.',
  accent: '#FCE7F3',
  generate,
  Component,
  // TODO(A2-память): skills після seed skill-graph пам'яті
};

export default memoryPairs;
