import type { GameDefinition, GameComponentProps, Difficulty, LevelData, Round } from '../types';
import { PromptCard, ChoiceGrid, randInt, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

type ColorId =
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'purple'
  | 'orange'
  | 'pink'
  | 'brown'
  | 'black'
  | 'white'
  | 'gray'
  | 'cyan'
  | 'lime'
  | 'navy';

const COLOR_NAME: Record<ColorId, string> = {
  red: 'Червоний',
  blue: 'Синій',
  green: 'Зелений',
  yellow: 'Жовтий',
  purple: 'Фіолетовий',
  orange: 'Помаранчевий',
  pink: 'Рожевий',
  brown: 'Коричневий',
  black: 'Чорний',
  white: 'Білий',
  gray: 'Сірий',
  cyan: 'Блакитний',
  lime: 'Салатовий',
  navy: 'Темно-синій',
};

const COLOR_HEX: Record<ColorId, string> = {
  red: '#EF4444',
  blue: '#3B82F6',
  green: '#22C55E',
  yellow: '#FACC15',
  purple: '#A855F7',
  orange: '#F97316',
  pink: '#EC4899',
  brown: '#8B4513',
  black: '#111827',
  white: '#F9FAFB',
  gray: '#6B7280',
  cyan: '#06B6D4',
  lime: '#84CC16',
  navy: '#1E3A8A',
};

const POOL_6: ColorId[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
const POOL_10: ColorId[] = [...POOL_6, 'pink', 'brown', 'black', 'white'];
const POOL_14: ColorId[] = [...POOL_10, 'gray', 'cyan', 'lime', 'navy'];

// Групи візуально близьких відтінків (для diff3 — складніші відволікачі).
const SIMILAR_GROUPS: ColorId[][] = [
  ['blue', 'cyan', 'navy'],
  ['red', 'pink', 'orange'],
  ['green', 'lime'],
  ['black', 'gray', 'navy'],
  ['purple', 'pink'],
];

function similarSet(target: ColorId): Set<ColorId> {
  const set = new Set<ColorId>();
  for (const group of SIMILAR_GROUPS) {
    if (group.includes(target)) {
      for (const c of group) if (c !== target) set.add(c);
    }
  }
  return set;
}

interface LevelConfig {
  pool: ColorId[];
  count: number;
  useSimilar: boolean;
}

function paramsFor(difficulty: Difficulty): LevelConfig {
  if (difficulty === 1) return { pool: POOL_6, count: 3, useSimilar: false };
  if (difficulty === 2) return { pool: POOL_10, count: 4, useSimilar: false };
  return { pool: POOL_14, count: 4, useSimilar: true };
}

/** Обрати відволікачі: близькі відтінки (diff3) або свідомо несхожі (diff1/2). */
function pickDistractors(target: ColorId, pool: ColorId[], count: number, useSimilar: boolean): ColorId[] {
  const similar = similarSet(target);
  const rest = pool.filter((c) => c !== target);
  const primary = useSimilar ? rest.filter((c) => similar.has(c)) : rest.filter((c) => !similar.has(c));
  const secondary = useSimilar ? rest.filter((c) => !similar.has(c)) : rest.filter((c) => similar.has(c));
  const combined = shuffle(primary).concat(shuffle(secondary));
  return combined.slice(0, count);
}

interface Payload {
  colorId: ColorId;
  colorName: string;
  hex: string;
  options: { name: string; hex: string }[];
}

function generate(difficulty: Difficulty): LevelData<Payload, string> {
  const { pool, count, useSimilar } = paramsFor(difficulty);
  const rounds: Round<Payload, string>[] = [];
  let prev: ColorId | null = null;
  for (let i = 0; i < 5; i++) {
    let target = pool[randInt(0, pool.length - 1)];
    let guard = 0;
    while (target === prev && guard < 10) {
      target = pool[randInt(0, pool.length - 1)];
      guard++;
    }
    prev = target;
    const distractors = pickDistractors(target, pool, count - 1, useSimilar);
    const ids = shuffle([target, ...distractors]);
    rounds.push({
      id: `r${i}`,
      payload: {
        colorId: target,
        colorName: COLOR_NAME[target],
        hex: COLOR_HEX[target],
        options: ids.map((id) => ({ name: COLOR_NAME[id], hex: COLOR_HEX[id] })),
      },
      answer: COLOR_HEX[target],
    });
  }
  return { difficulty, rounds };
}

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, string>) {
  const { colorId, colorName, hex, options } = round.payload;
  // дошкільня не читає: «Знайди колір» звучить раз на гру (перший раунд), далі й на 🔊 — лише назва кольору
  const name = { key: `col_${colorId}`, text: colorName.toLowerCase() };
  const say = hasUkAudio(name.key)
    ? (again?: boolean) => sayUkSeq(again || round.id !== 'r0' ? [name] : [{ key: 'p_find_color', text: 'Знайди колір' }, name])
    : undefined;
  const choices = options.map((opt) => ({
    value: opt.hex,
    node: (
      <span
        aria-label={opt.name}
        style={{
          display: 'block',
          width: 56,
          height: 56,
          margin: '0 auto',
          borderRadius: 12,
          background: opt.hex,
          border: opt.hex === COLOR_HEX.white ? '2px solid var(--c-line)' : 'none',
        }}
      />
    ),
  }));
  return (
    <>
      <PromptCard question="Знайди колір" answerState={answerState} say={say} sayKey={`${round.id}-${colorId}`}>
        <div
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: 'var(--c-ink)',
            textAlign: 'center',
            margin: '8px auto',
          }}
        >
          {colorName}
        </div>
      </PromptCard>
      <ChoiceGrid options={choices} correct={hex} disabled={disabled} answerState={answerState} onPick={onAnswer} />
    </>
  );
}

const colorsFind: GameDefinition<Payload, string> = {
  id: 'colors-find',
  title: 'Знайди колір',
  subject: 'science',
  levels: ['L0'],
  icon: '🎨',
  description: 'Знайди колір.',
  accent: '#FCE7F3',
  generate,
  Component,
  // TODO(A2-наука): skills після seed skill-graph науки
};

export default colorsFind;
