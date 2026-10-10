import { useEffect, useRef, useState } from 'react';
import type { GameDefinition, GameComponentProps, Difficulty, LevelData, Round } from '../types';
import { PromptCard, shuffle } from '../shared/ui';
import { usePreschool } from '../shared/preschool';
import { KidsPlant, generateKids, type KidPlantP } from './kids';

/** Сентінел-відповідь раунду: саму перевірку виконує Component при завершенні ряду. */
const SORTED = 'sorted' as const;
type SortAnswer = typeof SORTED;

interface StageItem {
  id: string;
  label: string;
}

interface Payload {
  /** Елементи у перемішаному порядку — те, що бачить дитина. */
  items: StageItem[];
  /** ID елементів у ПРАВИЛЬНІЙ послідовності росту (перший → останній тап). */
  correctOrder: string[];
}

/** Стадії росту рослини за порядком: насінина → паросток → стебло → квітка → плід. */
const STAGES = ['🌰', '🌱', '🌿', '🌷', '🍎'];

function stageCountFor(difficulty: Difficulty): number {
  return difficulty === 1 ? 3 : difficulty === 2 ? 4 : 5;
}

function buildRound(index: number, count: number): Round<Payload, SortAnswer> {
  const stages = STAGES.slice(0, count);
  const correctOrder = stages.map((_, i) => `s${i}`);
  const items = shuffle(stages.map((label, i) => ({ id: `s${i}`, label })));
  return { id: `r${index}`, payload: { items, correctOrder }, answer: SORTED };
}

function generate(difficulty: Difficulty, level?: string): LevelData<Payload, SortAnswer> {
  if (level === 'L0') return generateKids(difficulty) as unknown as LevelData<Payload, SortAnswer>;
  const count = stageCountFor(difficulty);
  const rounds: Round<Payload, SortAnswer>[] = [];
  for (let i = 0; i < 5; i++) rounds.push(buildRound(i, count));
  return { difficulty, rounds };
}

const WRONG_FEEDBACK_MS = 450;

function Component(props: GameComponentProps<Payload, SortAnswer>) {
  const preschool = usePreschool();
  if (preschool && (props.round.payload as unknown as KidPlantP).kid) return <KidsPlant {...(props as unknown as GameComponentProps<KidPlantP, string>)} />;
  return <SchoolPlant {...props} />;
}

function SchoolPlant({ round, disabled, answerState, onAnswer, onMistake }: GameComponentProps<Payload, SortAnswer>) {
  const { items, correctOrder } = round.payload;
  const [taken, setTaken] = useState<string[]>([]);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    setTaken([]);
    setWrongId(null);
    doneRef.current = false;
  }, [round.id]);

  function handleTap(id: string) {
    if (disabled || doneRef.current || wrongId !== null || taken.includes(id)) return;
    if (id === correctOrder[taken.length]) {
      const next = [...taken, id];
      setTaken(next);
      if (next.length === correctOrder.length) {
        doneRef.current = true;
        onAnswer(SORTED);
      }
    } else {
      onMistake();
      setWrongId(id);
      window.setTimeout(() => setWrongId(null), WRONG_FEEDBACK_MS);
    }
  }

  const itemSize = items.length <= 3 ? 52 : items.length === 4 ? 44 : 38;

  return (
    <PromptCard question="Як росте рослина? Тапай по порядку." answerState={answerState}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 10,
          margin: '8px auto',
          maxWidth: 340,
        }}
      >
        {items.map((item) => {
          const orderIdx = taken.indexOf(item.id);
          const isTaken = orderIdx !== -1;
          const isWrong = wrongId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTap(item.id)}
              disabled={disabled || isTaken}
              style={{
                position: 'relative',
                minWidth: 64,
                minHeight: 76,
                padding: '10px 8px',
                border: `2px solid ${isWrong ? '#FF6B6B' : isTaken ? 'var(--c-green)' : 'var(--c-line)'}`,
                borderRadius: 'var(--c-r-sm)',
                background: isWrong ? '#FFE2E2' : 'var(--c-card)',
                fontFamily: 'var(--font-round)',
                cursor: disabled || isTaken ? 'default' : 'pointer',
                animation: isWrong ? 'shake 0.45s ease' : 'none',
                opacity: isTaken ? 0.65 : 1,
              }}
            >
              <span style={{ fontSize: itemSize, lineHeight: `${itemSize + 6}px` }}>{item.label}</span>
              {isTaken && (
                <span
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: 'var(--c-green)',
                    color: '#fff',
                    fontWeight: 800,
                    fontFamily: 'var(--font-round)',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {orderIdx + 1}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </PromptCard>
  );
}

const plantGrow: GameDefinition<Payload, SortAnswer> = {
  id: 'plant-grow',
  title: 'Ріст рослини',
  subject: 'science',
  levels: ['L0'],
  icon: '🌱',
  description: 'Як росте рослина?',
  accent: '#DCFCE7',
  generate,
  isCorrect: () => true,
  Component,
  // TODO(A2-наука): skills після seed skill-graph науки
};

export default plantGrow;
