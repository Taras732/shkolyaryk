import { useEffect, useRef, useState } from 'react';
import type { GameDefinition, GameComponentProps, Difficulty, LevelData } from '../types';
import { PromptCard, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Пиши цифру» (11.10.2026) — 1 клас, [1 МАО 4.2] «читає і записує числа»: перший крок до письма рукою.
 * Цифра — штрихи з контрольних точок (рух як у прописах, від точки старту). Обвела по порядку
 * з допуском на дитячу руку — зараховано. Рівні: 1 — товстий пунктир, 2 — блідий контур,
 * 3 — лише точка старту (пише з памʼяті, перевірка та сама).
 */

type Pt = [number, number];
/** Штрихи цифр у полі 100×140 (кожен штрих — ламана; порядок точок = напрям руху руки). */
export const STROKES: Record<number, Pt[][]> = {
  0: [[[50, 15], [30, 25], [22, 55], [24, 95], [35, 120], [50, 126], [66, 118], [77, 92], [78, 52], [70, 24], [50, 15]]],
  1: [[[32, 42], [62, 15], [62, 125]]],
  2: [[[25, 40], [35, 22], [50, 15], [68, 20], [75, 38], [68, 58], [25, 125], [80, 125]]],
  3: [[[28, 25], [50, 15], [70, 25], [72, 45], [50, 66], [72, 82], [75, 105], [55, 125], [28, 115]]],
  4: [[[60, 15], [22, 88], [80, 88]], [[62, 52], [62, 126]]],
  5: [[[34, 15], [28, 62], [50, 55], [72, 70], [75, 95], [60, 120], [30, 118]], [[34, 15], [74, 15]]],
  6: [[[70, 20], [45, 15], [28, 45], [25, 88], [35, 116], [55, 125], [72, 108], [70, 84], [50, 74], [28, 88]]],
  7: [[[25, 15], [75, 15], [40, 126]]],
  8: [[[50, 15], [30, 26], [33, 48], [50, 65], [70, 85], [72, 108], [50, 125], [28, 108], [30, 85], [50, 65], [67, 48], [70, 26], [50, 15]]],
  9: [[[72, 38], [55, 15], [32, 22], [28, 45], [45, 62], [68, 52], [72, 38], [70, 80], [55, 126]]],
};

/** Контрольні точки: штрих, розбитий через кожні STEP одиниць. */
const STEP = 7;
export function checkpoints(stroke: Pt[]): Pt[] {
  const out: Pt[] = [stroke[0]];
  for (let i = 1; i < stroke.length; i++) {
    const [x0, y0] = stroke[i - 1];
    const [x1, y1] = stroke[i];
    const len = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(1, Math.round(len / STEP));
    for (let k = 1; k <= n; k++) out.push([x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n]);
  }
  return out;
}

/** Допуск (у полі 100×140) — дитячий палець на телефоні. */
export const RADIUS = 13;
/** Скільки точок можна «перескочити» за один дотик (швидкий рух між подіями pointermove). */
const LOOKAHEAD = 3;

/** Просунути прогрес штриха новою точкою дотику: повертає новий індекс наступної контрольної точки. */
export function advance(cps: Pt[], next: number, p: Pt): number {
  for (let k = next; k < Math.min(cps.length, next + LOOKAHEAD + 1); k++) {
    if (Math.hypot(cps[k][0] - p[0], cps[k][1] - p[1]) <= RADIUS) return k + 1;
  }
  return next;
}

interface Payload {
  digit: number;
  guide: 'thick' | 'faint' | 'start';
}
type Answer = string;

const ROUNDS = 5;
const DONE = 'done';

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const guide = difficulty === 1 ? 'thick' : difficulty === 2 ? 'faint' : 'start';
  const digits = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, ROUNDS);
  return { difficulty, rounds: digits.map((digit, i) => ({ id: `r${i}`, payload: { digit, guide }, answer: DONE })) };
}

const NUM = ['нуль', 'один', 'два', 'три', 'чотири', 'пʼять', 'шість', 'сім', 'вісім', 'девʼять'];
const toPath = (s: Pt[]) => s.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');

function Component({ round, disabled, onAnswer }: GameComponentProps<Payload, Answer>) {
  const { digit, guide } = round.payload;
  const strokes = STROKES[digit];
  const cps = strokes.map(checkpoints);
  // прогрес — у ref (синхронно між подіями pointermove), у state — лише для перемальовки
  const prog = useRef({ stroke: 0, next: 0 });
  const [{ stroke }, setProg] = useState({ stroke: 0, next: 0 });
  const [trail, setTrail] = useState<Pt[][]>([[]]);
  const svg = useRef<SVGSVGElement>(null);
  const drawing = useRef(false);
  const done = stroke >= strokes.length;

  const phrase = { key: 'p_write_digit', text: 'Обведи цифру' };
  const name = { key: `d_${digit}`, text: NUM[digit] };
  useEffect(() => {
    if (hasUkAudio(name.key)) sayUkSeq(round.id === 'r0' ? [phrase, name] : [name]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round.id]);
  useEffect(() => {
    if (done) {
      const t = window.setTimeout(() => onAnswer(DONE), 500);
      return () => window.clearTimeout(t);
    }
  }, [done, onAnswer]);

  const local = (e: React.PointerEvent): Pt => {
    const r = svg.current!.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 140];
  };
  const feed = (p: Pt) => {
    if (done) return;
    setTrail((t) => { const c = t.slice(); c[c.length - 1] = [...c[c.length - 1], p]; return c; });
    const g = prog.current;
    if (g.stroke >= cps.length) return;
    const nn = advance(cps[g.stroke], g.next, p);
    // штрих готовий — наступний з нуля (палець можна відірвати)
    prog.current = nn >= cps[g.stroke].length ? { stroke: g.stroke + 1, next: 0 } : { stroke: g.stroke, next: nn };
    setProg(prog.current);
  };

  const clear = () => { prog.current = { stroke: 0, next: 0 }; setProg(prog.current); setTrail([[]]); };
  const startPt = !done ? strokes[stroke][0] : null;

  return (
    <>
      <PromptCard question={`Обведи цифру ${digit}`} answerState="idle" say={hasUkAudio(name.key) ? () => sayUkSeq([name]) : undefined} sayKey={`${round.id}-say`}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <svg ref={svg} viewBox="0 0 100 140" width={200} height={280}
            style={{ background: '#fff', borderRadius: 16, touchAction: 'none', boxShadow: 'inset 0 0 0 2px #E5E7EB', cursor: 'crosshair' }}
            onPointerDown={(e) => { if (disabled) return; drawing.current = true; try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* без захоплення теж працює */ } setTrail((t) => [...t, []]); feed(local(e)); }}
            onPointerMove={(e) => { if (drawing.current) feed(local(e)); }}
            onPointerUp={() => { drawing.current = false; }}
            onPointerCancel={() => { drawing.current = false; }}>
            {/* клітинка-опора, як у зошиті */}
            <line x1={0} y1={15} x2={100} y2={15} stroke="#DBEAFE" />
            <line x1={0} y1={125} x2={100} y2={125} stroke="#DBEAFE" />
            {guide !== 'start' && strokes.map((s, i) => (
              <path key={i} d={toPath(s)} fill="none" stroke={guide === 'thick' ? '#C7D2FE' : '#EEF2FF'} strokeWidth={guide === 'thick' ? 10 : 6}
                strokeLinecap="round" strokeLinejoin="round" strokeDasharray={guide === 'thick' ? '1 9' : undefined} />
            ))}
            {/* пройдені штрихи — зеленим */}
            {strokes.slice(0, stroke).map((s, i) => <path key={`ok${i}`} d={toPath(s)} fill="none" stroke="#22C55E" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />)}
            {trail.map((t, i) => t.length > 1 && <path key={`t${i}`} d={toPath(t)} fill="none" stroke="#6366F1" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />)}
            {startPt && (<>
              <circle cx={startPt[0]} cy={startPt[1]} r={6} fill="#F97316" />
              <circle cx={startPt[0]} cy={startPt[1]} r={10} fill="none" stroke="#F97316" strokeWidth={2} opacity={0.5} />
            </>)}
          </svg>
          <button type="button" onClick={clear} disabled={disabled}
            style={{ border: 0, borderRadius: 999, padding: '6px 14px', background: '#F3F4F6', fontWeight: 800, cursor: 'pointer' }}>↺ Стерти</button>
        </div>
      </PromptCard>
    </>
  );
}

const writeDigits: GameDefinition<Payload, Answer> = {
  id: 'write-digits',
  title: 'Пиши цифру',
  subject: 'math',
  levels: ['L3'],
  icon: '✍️',
  description: 'Обведи цифру пальцем від помаранчевої точки — як у прописах.',
  accent: '#EDE9FE',
  skillsFor: () => ['math.count.l1.numeral-writing'],
  explain: (round) => ({
    steps: [`Починай з помаранчевої точки і веди, не поспішаючи.`, STROKES[round.payload.digit].length > 1 ? 'Ця цифра пишеться у два рухи: спершу один, потім другий.' : 'Цю цифру пишемо одним рухом, не відриваючи пальця.'],
  }),
  generate,
  Component,
};

export default writeDigits;
