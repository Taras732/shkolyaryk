import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { GameDefinition, GameComponentProps, Difficulty, ProfileLevel, LevelData, Round } from '../types';
import { PromptCard, shuffle } from '../shared/ui';
import { usePreschool } from '../shared/preschool';
import { SceneTask } from '../shared/count-ui';
import { sayUk } from '../shared/uk-audio';

/** Сентінел-відповідь раунду: саму перевірку виконує Component при завершенні ряду. */
const SORTED = 'sorted' as const;
type SortAnswer = typeof SORTED;

interface SortItem {
  id: string;
  label: string;
  /** Дошкілля: намальований предмет (public/count) і його розмір 0..1. */
  img?: string;
  scale?: number;
}

interface Payload {
  prompt: string;
  /** Дошкілля: size — від маленького до великого, cycle — що спочатку, що потім. */
  kind?: 'size' | 'cycle';
  /** Елементи у перемішаному порядку — те, що бачить дитина. */
  items: SortItem[];
  /** ID елементів у ПРАВИЛЬНІЙ послідовності (перший → останній тап). */
  correctOrder: string[];
}

/**
 * Набори впорядковані ЗА СТАДІЄЮ РОСТУ/ЦИКЛУ (а не за "розміром" числа) —
 * саме так сортує оригінальна гра (main:src/games/sorting-game): паросток→квітка→плід,
 * яйце→гусінь→метелик, ранок→день→вечір→ніч тощо. Порт зберігає ту саму механіку
 * (тап-по-порядку) і той самий пул наборів, лише без i18n-шару (тут прямий укр. текст)
 * і з L0/L3 замість вікових груп grade1-4.
 */
interface SortableSet {
  key: string;
  prompt: string;
  items: string[];
}

const SETS: SortableSet[] = [
  { key: 'plant', prompt: 'Як росте рослина?', items: ['🌱', '🌿', '🌸', '🍎'] },
  { key: 'butterfly', prompt: 'Як росте метелик?', items: ['🥚', '🐛', '🦋'] },
  { key: 'chicken', prompt: 'Як росте курча?', items: ['🥚', '🐣', '🐤', '🐓'] },
  { key: 'age', prompt: 'Від малого до великого', items: ['👶', '🧒', '👩', '👵'] },
  { key: 'day', prompt: 'Як минає день?', items: ['🌅', '☀️', '🌆', '🌙'] },
  { key: 'seasons', prompt: 'Пори року за порядком', items: ['🌷', '☀️', '🍂', '❄️'] },
  { key: 'moon', prompt: 'Як росте місяць?', items: ['🌑', '🌒', '🌓', '🌔', '🌕'] },
  { key: 'numbers', prompt: 'Від меншого до більшого', items: ['1', '2', '3', '4', '5'] },
];

function itemCountFor(difficulty: Difficulty, level: ProfileLevel): number {
  if (level === 'L0') return difficulty === 3 ? 4 : 3;
  return difficulty === 3 ? 5 : 4;
}

/** Перемішана черга наборів з достатньою к-стю елементів (щоб не повторювались одразу). */
function buildQueue(minItems: number): SortableSet[] {
  const eligible = SETS.filter((s) => s.items.length >= minItems);
  return shuffle(eligible.length > 0 ? eligible : SETS);
}

function buildRound(index: number, count: number, queue: SortableSet[]): Round<Payload, SortAnswer> {
  const set = queue[index % queue.length];
  const correct = set.items.slice(0, Math.min(count, set.items.length));
  const correctOrder = correct.map((_, i) => `${set.key}-${i}`);
  const items = shuffledNotSorted(correct.map((label, i) => ({ id: `${set.key}-${i}`, label })));
  return {
    id: `r${index}`,
    payload: { prompt: set.prompt, items, correctOrder },
    answer: SORTED,
  };
}

/**
 * Дошкілля (10.10.2026): рівні 1–2 — той самий предмет трьох/чотирьох розмірів «від маленького до великого»
 * (порівняти на око 3-річна вміє), рівень 3 — «що спочатку, що потім» намальованими стадіями.
 */
const SIZE_ITEMS = ['bear', 'bunny', 'apple', 'carrot', 'elephant', 'mushroom', 'pig', 'strawberry', 'cat', 'pear'];
const CYCLES = [
  ['cyc_egg', 'cyc_chick', 'cyc_hen'],
  ['cyc_caterpillar', 'cyc_cocoon', 'cyc_butterfly'],
  ['cyc_seed', 'cyc_sprout', 'cyc_sunflower'],
];
const SCALES: Record<number, number[]> = { 3: [0.42, 0.68, 1], 4: [0.36, 0.55, 0.76, 1] };

/** Перемішати так, щоб ряд не стояв уже складеним (інакше дитині нічого робити). */
function shuffledNotSorted<T>(ordered: T[]): T[] {
  let out = shuffle(ordered);
  while (out.every((x, i) => x === ordered[i])) out = shuffle(ordered);
  return out;
}

function generatePreschool(difficulty: Difficulty): LevelData<Payload, SortAnswer> {
  const rounds: Round<Payload, SortAnswer>[] = [];
  const sizeQ = shuffle(SIZE_ITEMS);
  const cycQ = shuffle(CYCLES);
  const cycle = difficulty === 3;
  for (let i = 0; i < 5; i++) {
    const imgs: string[] = cycle ? cycQ[i % cycQ.length] : Array(difficulty === 1 ? 3 : 4).fill(sizeQ[i % sizeQ.length]);
    const sc = SCALES[imgs.length];
    const ordered = imgs.map((img, k) => ({ id: `r${i}-${k}`, label: img, img, scale: cycle ? 1 : sc[k] }));
    rounds.push({
      id: `r${i}`,
      payload: {
        prompt: cycle ? 'Що спочатку, а що потім?' : 'Від маленького до великого!',
        kind: cycle ? 'cycle' : 'size',
        items: shuffledNotSorted(ordered),
        correctOrder: ordered.map((o) => o.id),
      },
      answer: SORTED,
    });
  }
  return { difficulty, rounds };
}

function generate(difficulty: Difficulty, level: ProfileLevel): LevelData<Payload, SortAnswer> {
  if (level === 'L0') return generatePreschool(difficulty);
  const count = itemCountFor(difficulty, level);
  const queue = buildQueue(count);
  const rounds: Round<Payload, SortAnswer>[] = [];
  for (let i = 0; i < 5; i++) rounds.push(buildRound(i, count, queue));
  return { difficulty, rounds };
}

const WRONG_FEEDBACK_MS = 450;

/** Дошкілля: предмети вгорі, внизу полиця-сходинки; правильний тап — предмет перелітає на свою сходинку. */
function PreschoolSort({ round, disabled, onAnswer, onMistake }: GameComponentProps<Payload, SortAnswer>) {
  const { prompt, items, correctOrder, kind } = round.payload;
  const [taken, setTaken] = useState<string[]>([]);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const cycle = kind === 'cycle';
  const key = cycle ? 'p_sort_cycle' : 'p_sort_size';
  const say = (again?: boolean) => (again || round.id === 'r0') && sayUk(key, prompt);
  const n = items.length;
  const box = n <= 3 ? 104 : 82;
  const byId = new Map(items.map((it) => [it.id, it]));

  const tap = (id: string) => {
    if (disabled || taken.includes(id) || wrongId) return;
    if (id === correctOrder[taken.length]) {
      const next = [...taken, id];
      setTaken(next);
      if (next.length === n) window.setTimeout(() => onAnswer(SORTED), 450);
    } else {
      onMistake();
      setWrongId(id);
      window.setTimeout(() => setWrongId(null), WRONG_FEEDBACK_MS);
    }
  };

  const pic = (it: SortItem) => (
    <motion.img layoutId={it.id} src={`/count/${it.img}.webp`} alt="" draggable={false} transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      style={{ width: box * (it.scale ?? 1), height: box * (it.scale ?? 1), objectFit: 'contain', filter: 'drop-shadow(0 3px 2px rgba(90,60,20,.18))' }} />
  );

  return (
    <SceneTask question={prompt} say={say} sayKey={round.id} sceneBg="linear-gradient(180deg, #FFF4E3 0%, #FFE9D2 100%)">
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, position: 'relative', zIndex: 1 }}>
        {/* розсип: що ще не поставили */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', justifyContent: 'center', minHeight: box + 16 }}>
          {items.map((it) => (
            <motion.button key={it.id} type="button" onClick={() => tap(it.id)} disabled={disabled} whileTap={{ scale: 0.92 }} aria-label={`Предмет ${it.id}`}
              style={{ border: 0, background: 'transparent', padding: 4, cursor: 'pointer', width: box + 8, height: box + 8, display: 'grid', placeItems: 'end center',
                visibility: taken.includes(it.id) ? 'hidden' : 'visible', animation: wrongId === it.id ? 'pk-shake .4s ease' : undefined }}>
              {!taken.includes(it.id) && pic(it)}
            </motion.button>
          ))}
        </div>
        {/* полиця: сходинки зліва направо; для «спочатку-потім» — рівна полиця зі стрілочками */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: cycle ? 4 : 8 }}>
          {correctOrder.map((_, k) => {
            const it = taken[k] ? byId.get(taken[k]) : undefined;
            return (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {cycle && k > 0 && <span style={{ fontSize: 26, color: '#E0A35A', fontWeight: 900 }}>›</span>}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: box + 8, height: box + 8, display: 'grid', placeItems: 'end center' }}>{it && pic(it)}</div>
                  <div style={{ width: box + 8, height: cycle ? 18 : 14 + k * 12, borderRadius: 10, background: it ? '#9FDDB0' : '#F3D3A5', boxShadow: `0 5px 0 ${it ? '#6FBF88' : '#E0B57C'}` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SceneTask>
  );
}

function Component(props: GameComponentProps<Payload, SortAnswer>) {
  const preschool = usePreschool();
  if (preschool && props.round.payload.kind) return <PreschoolSort {...props} />;
  return <SchoolSort {...props} />;
}

function SchoolSort({ round, disabled, answerState, onAnswer, onMistake }: GameComponentProps<Payload, SortAnswer>) {
  const { prompt, items, correctOrder } = round.payload;
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
    <PromptCard question={prompt} answerState={answerState}>
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

const sortingGame: GameDefinition<Payload, SortAnswer> = {
  id: 'sorting-game',
  title: 'Сортування',
  subject: 'logic',
  levels: ['L0', 'L3'],
  icon: '🗂️',
  description: 'Розстав по порядку.',
  accent: '#DCFCE7',
  generate,
  isCorrect: () => true,
  Component,
  // TODO(A2-логіка): skills після seed skill-graph логіки
};

export default sortingGame;
