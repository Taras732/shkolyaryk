import type { GameDefinition, GameComponentProps, Difficulty, LevelData, Round } from '../types';
import { PromptCard, ChoiceGrid, randInt, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

type ShapeId = 'circle' | 'square' | 'triangle' | 'rectangle' | 'oval' | 'star';

interface Payload {
  shape: ShapeId;
  /** Варіанти для ChoiceGrid (включно з правильною фігурою), вже перемішані. */
  options: ShapeId[];
}

const SHAPE_NAMES: Record<ShapeId, string> = {
  circle: 'Коло',
  square: 'Квадрат',
  triangle: 'Трикутник',
  rectangle: 'Прямокутник',
  oval: 'Овал',
  star: 'Зірка',
};

const SHAPE_COLOR: Record<ShapeId, string> = {
  circle: '#6C5CE7',
  square: '#FF6EC7',
  triangle: '#FFC53D',
  rectangle: '#22C55E',
  oval: '#3B9EF0',
  star: '#FF9F43',
};

function poolFor(difficulty: Difficulty): { pool: ShapeId[]; count: number } {
  if (difficulty === 1) return { pool: ['circle', 'square', 'triangle'], count: 3 };
  if (difficulty === 2) return { pool: ['circle', 'square', 'triangle', 'rectangle', 'oval'], count: 4 };
  return { pool: ['circle', 'square', 'triangle', 'rectangle', 'oval', 'star'], count: 5 };
}

function pickOptions(target: ShapeId, pool: ShapeId[], count: number): ShapeId[] {
  const distractors = shuffle(pool.filter((s) => s !== target)).slice(0, Math.max(0, count - 1));
  return shuffle([target, ...distractors]);
}

function generate(difficulty: Difficulty): LevelData<Payload, string> {
  const { pool, count } = poolFor(difficulty);
  const rounds: Round<Payload, string>[] = [];
  let prev: ShapeId | null = null;
  for (let i = 0; i < 5; i++) {
    let shape = pool[randInt(0, pool.length - 1)];
    while (shape === prev) shape = pool[randInt(0, pool.length - 1)];
    prev = shape;
    const options = pickOptions(shape, pool, Math.min(count, pool.length));
    rounds.push({ id: `r${i}`, payload: { shape, options }, answer: SHAPE_NAMES[shape] });
  }
  return { difficulty, rounds };
}

function starPoints(cx: number, cy: number, rOuter: number, rInner: number, spikes: number): string {
  const pts: string[] = [];
  const step = Math.PI / spikes;
  let angle = -Math.PI / 2;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
    angle += step;
  }
  return pts.join(' ');
}

function ShapeSvg({ shape, size }: { shape: ShapeId; size: number }) {
  const color = SHAPE_COLOR[shape];
  const cx = size / 2;
  const cy = size / 2;

  if (shape === 'circle') {
    return (
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={size / 2 - 4} fill={color} />
      </svg>
    );
  }
  if (shape === 'square') {
    return (
      <svg width={size} height={size}>
        <rect x={4} y={4} width={size - 8} height={size - 8} rx={8} fill={color} />
      </svg>
    );
  }
  if (shape === 'rectangle') {
    const h = size * 0.6;
    const y = (size - h) / 2;
    return (
      <svg width={size} height={size}>
        <rect x={4} y={y} width={size - 8} height={h} rx={8} fill={color} />
      </svg>
    );
  }
  if (shape === 'triangle') {
    const points = `${cx},6 6,${size - 6} ${size - 6},${size - 6}`;
    return (
      <svg width={size} height={size}>
        <polygon points={points} fill={color} />
      </svg>
    );
  }
  if (shape === 'oval') {
    return (
      <svg width={size} height={size}>
        <ellipse cx={cx} cy={cy} rx={size / 2 - 4} ry={(size / 2) * 0.62} fill={color} />
      </svg>
    );
  }
  // star
  const points = starPoints(cx, cy, size / 2 - 4, (size / 2 - 4) * 0.45, 5);
  return (
    <svg width={size} height={size}>
      <polygon points={points} fill={color} />
    </svg>
  );
}

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, string>) {
  const { shape, options } = round.payload;
  // дошкільня не читає: фігура звучить, варіанти — самі фігури (10.10; було «Яка це фігура?» з назвами-словами)
  const choices = options.map((id) => ({
    value: SHAPE_NAMES[id],
    node: <span aria-label={SHAPE_NAMES[id]} style={{ display: 'block', lineHeight: 0 }}><ShapeSvg shape={id} size={60} /></span>,
  }));
  const name = { key: `shape_${shape}`, text: SHAPE_NAMES[shape].toLowerCase() };
  // «Знайди фігуру» — раз на гру (перший раунд), далі й на 🔊 — лише назва
  const say = hasUkAudio(name.key)
    ? (again?: boolean) => sayUkSeq(again || round.id !== 'r0' ? [name] : [{ key: 'p_find_shape', text: 'Знайди фігуру' }, name])
    : undefined;

  return (
    <>
      <PromptCard question="Знайди фігуру" answerState={answerState} say={say} sayKey={`${round.id}-${shape}`}>
        <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--c-ink)', textAlign: 'center', margin: '8px auto' }}>
          {SHAPE_NAMES[shape]}
        </div>
      </PromptCard>
      <ChoiceGrid
        options={choices}
        correct={SHAPE_NAMES[shape]}
        disabled={disabled}
        answerState={answerState}
        onPick={onAnswer}
        columns={choices.length === 3 ? 3 : 2}
      />
    </>
  );
}

const shapes: GameDefinition<Payload, string> = {
  id: 'shapes',
  title: 'Фігури',
  subject: 'science',
  levels: ['L0'],
  icon: '🔺',
  description: 'Геометричні фігури.',
  accent: '#FEF3C7',
  generate,
  Component,
  // TODO(A2-наука): skills після seed skill-graph науки
};

export default shapes;
