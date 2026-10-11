import { useMemo } from 'react';
import type { GameDefinition, GameComponentProps } from '../types';
import { PromptCard, ChoiceGrid, numberDecoys } from '../shared/ui';
import { generate, type Payload } from './generate';

const MODE_QUESTION: Record<Payload['mode'], string> = {
  perimeter: 'Який периметр цієї фігури?',
  area: 'Яка площа цієї фігури?',
};

const CELL_SIZE = 26;
/** Безпечна максимальна ширина сітки — вміщається навіть на екрані 320px. */
const MAX_SVG = 236;
const FILL = '#8DD3B8';
const LINE = '#CBD5E1';

function GridFigure({ cells, width, height }: { cells: string[]; width: number; height: number }) {
  const size = Math.max(10, Math.min(CELL_SIZE, Math.floor(MAX_SVG / Math.max(width, height))));
  const w = width * size;
  const h = height * size;
  const filled = new Set(cells);

  const squares: { key: string; x: number; y: number }[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const key = `${x},${y}`;
      if (filled.has(key)) squares.push({ key, x, y });
    }
  }

  return (
    <svg width={w} height={h} style={{ display: 'block', margin: '0 auto' }}>
      {squares.map(({ key, x, y }) => (
        <rect key={key} x={x * size + 1} y={y * size + 1} width={size - 2} height={size - 2} rx={3} fill={FILL} />
      ))}
      {Array.from({ length: width + 1 }, (_, i) => (
        <line key={`v${i}`} x1={i * size} y1={0} x2={i * size} y2={h} stroke={LINE} strokeWidth={1} />
      ))}
      {Array.from({ length: height + 1 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i * size} x2={w} y2={i * size} stroke={LINE} strokeWidth={1} />
      ))}
    </svg>
  );
}

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, number>) {
  const { mode, cells, width, height, unit } = round.payload;
  // numberDecoys() кличе Math.random() — рахуємо один раз на round.id, щоб варіанти
  // не тасувались заново при кожному ре-рендері (напр. після невірної відповіді).
  const options = useMemo(() => {
    const decoys = numberDecoys(round.answer, 4, Math.max(2, Math.round(round.answer * 0.35)), 1);
    return decoys.map((v) => ({ value: v }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round.id]);
  const hint = mode === 'area' ? `1 клітинка = 1 ${unit}²` : `сторона клітинки = 1 ${unit}`;

  return (
    <>
      <PromptCard question={MODE_QUESTION[mode]} answerState={answerState}>
        <GridFigure cells={cells} width={width} height={height} />
        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, fontWeight: 700, color: 'var(--c-mut)' }}>
          {hint}
        </div>
      </PromptCard>
      <ChoiceGrid
        options={options}
        correct={round.answer}
        disabled={disabled}
        answerState={answerState}
        onPick={onAnswer}
        columns={2}
      />
    </>
  );
}

const perimeterArea: GameDefinition<Payload, number> = {
  id: 'perimeter-area',
  title: 'Периметр і площа',
  subject: 'math',
  levels: ['L3'],
  icon: '📐',
  description: 'Периметр і площа фігур на клітинках.',
  accent: '#DBEAFE',
  // 2 клас: периметр прямокутника → 3 клас: площа прямокутника → 4 клас:
  // складені фігури (обидва навички разом), узгоджено зі skill-graph.
  skillIds: {
    1: ['math.measure.l2.perimeter'],
    2: ['math.measure.l3.area'],
    3: ['math.measure.l2.perimeter', 'math.measure.l3.area'],
  },
  // 11.10: 2 клас — лише периметр (CLASS_CONFIG), площа — з 3–4 класу
  skillsFor: (d, cl) => (cl === 'grade2' ? ['math.measure.l2.perimeter'] : d === 1 ? ['math.measure.l2.perimeter'] : d === 2 ? ['math.measure.l3.area'] : ['math.measure.l2.perimeter', 'math.measure.l3.area']),
  generate,
  Component,
};

export default perimeterArea;
