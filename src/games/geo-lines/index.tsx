import { useState } from 'react';
import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Лінії й відрізки» (11.10.2026) — геометрія 1 класу (програма Савченко [1 МАО 4.5–4.7]):
 * точка, пряма, промінь, відрізок, ламана; виміряти відрізок; накреслити відрізок заданої довжини.
 * Порядок теми — від упізнавання до дії руками:
 *  d1 — почуй назву, знайди лінію;
 *  d2 — виміряй відрізок лінійкою; останні раунди відрізок НЕ з нуля (типова помилка — читати число на кінці);
 *  d3 — накресли відрізок: тап у точку початку, тап у точку кінця.
 * Фраза завдання звучить раз на гру (r0), далі лише ціль.
 */

export type LineKind = 'segment' | 'ray' | 'line' | 'curve' | 'polyline' | 'closed';

const LINE_NAMES: Record<LineKind, { title: string; say: string }> = {
  segment: { title: 'відрізок', say: 'відрізок' },
  ray: { title: 'промінь', say: 'промінь' },
  line: { title: 'пряму', say: 'пряму' },
  curve: { title: 'криву лінію', say: 'криву лінію' },
  polyline: { title: 'ламану', say: 'ламану' },
  closed: { title: 'замкнену ламану', say: 'замкнену ламану' },
};

type Payload =
  | { mode: 'find'; target: LineKind; options: LineKind[] }
  | { mode: 'measure'; start: number; length: number; options: number[] }
  | { mode: 'draw'; length: number };
type Answer = string | number;

const ROUNDS = 5;
const randInt = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

/** Лінії по складності знайомства: спершу відрізок, промінь, пряма; ламані — далі. */
const BASIC: LineKind[] = ['segment', 'ray', 'line'];
const ALL: LineKind[] = ['segment', 'ray', 'line', 'curve', 'polyline', 'closed'];

function genFind(): Round<Payload, Answer>[] {
  const targets = shuffle([...shuffle(BASIC), ...shuffle(ALL.filter((k) => !BASIC.includes(k)))].slice(0, ROUNDS));
  return targets.map((t, i) => {
    // перші раунди — серед трьох базових; далі варіанти з усіх
    const pool = i < 2 && BASIC.includes(t) ? BASIC : ALL;
    const options = shuffle([t, ...shuffle(pool.filter((k) => k !== t)).slice(0, 2)]);
    return { id: `r${i}`, payload: { mode: 'find', target: t, options }, answer: t };
  });
}

function genMeasure(): Round<Payload, Answer>[] {
  return Array.from({ length: ROUNDS }, (_, i) => {
    const start = i < 3 ? 0 : randInt(1, 3);
    const length = randInt(2, 9 - start);
    // відволікачі: число на кінці відрізка (помилка «не з нуля») і сусіди
    const options = shuffle([...new Set([length, start + length, length + 1, length - 1].filter((n) => n > 0 && n !== length))].slice(0, 2).concat(length));
    return { id: `r${i}`, payload: { mode: 'measure', start, length, options }, answer: length };
  });
}

function genDraw(): Round<Payload, Answer>[] {
  const lengths = shuffle([2, 3, 4, 5, 6, 7, 8]).slice(0, ROUNDS);
  return lengths.map((length, i) => ({ id: `r${i}`, payload: { mode: 'draw', length }, answer: length }));
}

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const rounds = difficulty === 1 ? genFind() : difficulty === 2 ? genMeasure() : genDraw();
  return { difficulty, rounds };
}

// ---------- малюнки ----------

const INK = 'var(--c-ink)';
const Dot = ({ x, y }: { x: number; y: number }) => <circle cx={x} cy={y} r={5} fill={INK} />;

/** Пряма — до країв картки (кінців немає), промінь — точка й до краю, відрізок — дві точки. */
export function LinePic({ kind }: { kind: LineKind }) {
  const s = { stroke: INK, strokeWidth: 4, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 140 80" width={130} height={74} aria-hidden>
      {kind === 'segment' && (<><line x1={25} y1={40} x2={115} y2={40} {...s} /><Dot x={25} y={40} /><Dot x={115} y={40} /></>)}
      {/* відкритий кінець розчиняється — видно, що лінія триває далі (пряма — в обидва боки, промінь — в один) */}
      <defs>
        <linearGradient id="fade-r" x1="0" x2="1" y1="0" y2="0"><stop offset="0.55" stopColor="#1F2333" /><stop offset="1" stopColor="#1F2333" stopOpacity="0" /></linearGradient>
        <linearGradient id="fade-both" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#1F2333" stopOpacity="0" /><stop offset="0.25" stopColor="#1F2333" /><stop offset="0.75" stopColor="#1F2333" /><stop offset="1" stopColor="#1F2333" stopOpacity="0" /></linearGradient>
      </defs>
      {kind === 'ray' && (<><line x1={25} y1={50} x2={140} y2={22} {...s} stroke="url(#fade-r)" /><Dot x={25} y={50} /></>)}
      {kind === 'line' && <line x1={0} y1={58} x2={140} y2={22} {...s} stroke="url(#fade-both)" />}
      {kind === 'curve' && <path d="M15 55 C 45 5, 75 75, 125 25" {...s} />}
      {kind === 'polyline' && (<><polyline points="15,60 50,20 85,55 125,18" {...s} />{[[15, 60], [50, 20], [85, 55], [125, 18]].map(([x, y]) => <Dot key={x} x={x} y={y} />)}</>)}
      {kind === 'closed' && (<><polygon points="30,62 70,14 115,40 95,68" {...s} />{[[30, 62], [70, 14], [115, 40], [95, 68]].map(([x, y]) => <Dot key={x} x={x} y={y} />)}</>)}
    </svg>
  );
}

const CM = 30; // пікселів на сантиметр у лінійці
const PAD = 16;

function Ruler({ y }: { y: number }) {
  return (
    <g>
      <rect x={PAD - 8} y={y} width={10 * CM + 16} height={34} rx={6} fill="#FEF3C7" stroke="#E5C77A" />
      {Array.from({ length: 11 }, (_, i) => (
        <g key={i}>
          <line x1={PAD + i * CM} y1={y} x2={PAD + i * CM} y2={y + 14} stroke={INK} strokeWidth={2} />
          <text x={PAD + i * CM} y={y + 29} fontSize={13} fontWeight={800} textAnchor="middle" fill={INK}>{i}</text>
        </g>
      ))}
    </g>
  );
}

function MeasurePic({ start, length }: { start: number; length: number }) {
  const x1 = PAD + start * CM;
  const x2 = PAD + (start + length) * CM;
  return (
    <svg viewBox={`0 0 ${10 * CM + 2 * PAD} 80`} style={{ width: '100%', maxWidth: 480 }} aria-hidden>
      <line x1={x1} y1={26} x2={x2} y2={26} stroke="var(--c-primary)" strokeWidth={5} strokeLinecap="round" />
      <Dot x={x1} y={26} />
      <Dot x={x2} y={26} />
      <Ruler y={40} />
    </svg>
  );
}

/** Накреслити: 11 точок над лінійкою; перший тап — початок, другий — кінець. */
function DrawBoard({ disabled, onDone }: { disabled: boolean; onDone: (len: number) => void }) {
  const [a, setA] = useState<number | null>(null);
  const [b, setB] = useState<number | null>(null);
  const tap = (i: number) => {
    if (disabled || b !== null) return;
    if (a === null) return setA(i);
    if (i === a) return setA(null);
    setB(i);
    onDone(Math.abs(i - a));
  };
  return (
    <svg viewBox={`0 0 ${10 * CM + 2 * PAD} 90`} style={{ width: '100%', maxWidth: 480, touchAction: 'manipulation' }}>
      {a !== null && b !== null && <line x1={PAD + a * CM} y1={30} x2={PAD + b * CM} y2={30} stroke="var(--c-primary)" strokeWidth={5} strokeLinecap="round" />}
      {Array.from({ length: 11 }, (_, i) => {
        const on = i === a || i === b;
        return (
          <g key={i} onClick={() => tap(i)} style={{ cursor: 'pointer' }}>
            <circle cx={PAD + i * CM} cy={30} r={14} fill="transparent" />
            <circle cx={PAD + i * CM} cy={30} r={on ? 7 : 5} fill={on ? INK : '#C9CDD8'} />
          </g>
        );
      })}
      <Ruler y={52} />
    </svg>
  );
}

// ---------- гра ----------

const cmWord = (n: number) => (n === 1 ? 'сантиметр' : n >= 2 && n <= 4 ? 'сантиметри' : 'сантиметрів');

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const first = round.id === 'r0';

  if (p.mode === 'find') {
    const name = { key: `line_${p.target}`, text: LINE_NAMES[p.target].say };
    const phrase = { key: 'p_find_sym', text: 'Знайди' };
    const say = hasUkAudio(name.key) ? (again?: boolean) => sayUkSeq(again || !first ? [name] : [phrase, name]) : undefined;
    return (
      <>
        <PromptCard question={`Знайди ${LINE_NAMES[p.target].title}`} answerState={answerState} say={say} sayKey={round.id} />
        <ChoiceGrid options={p.options.map((k) => ({ value: k, node: <span aria-label={LINE_NAMES[k].title} style={{ display: 'block', lineHeight: 0 }}><LinePic kind={k} /></span> }))}
          correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={p.options.length === 3 ? 3 : 2} />
      </>
    );
  }

  if (p.mode === 'measure') {
    const q = { key: 'p_measure', text: 'Яка довжина відрізка?' };
    const say = hasUkAudio(q.key) ? (again?: boolean) => (first || again ? sayUkSeq([q]) : undefined) : undefined;
    return (
      <>
        <PromptCard question={q.text} answerState={answerState} say={say} sayKey={round.id}>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}><MeasurePic start={p.start} length={p.length} /></div>
        </PromptCard>
        <ChoiceGrid options={p.options.map((n) => ({ value: n, node: <span>{n} см</span> }))}
          correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={3} />
      </>
    );
  }

  const phrase = { key: 'p_draw_seg', text: 'Накресли відрізок' };
  const len = { key: `cm_${p.length}`, text: `${p.length} ${cmWord(p.length)}` };
  const say = hasUkAudio(len.key) ? (again?: boolean) => sayUkSeq(again || !first ? [len] : [phrase, len]) : undefined;
  return (
    <>
      <PromptCard question={`Накресли відрізок ${p.length} см`} answerState={answerState} say={say} sayKey={round.id}>
        <div style={{ fontSize: 14, color: 'var(--c-mut)', fontWeight: 600 }}>Торкнись точки початку, потім — кінця</div>
      </PromptCard>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <DrawBoard key={round.id} disabled={disabled} onDone={onAnswer} />
      </div>
    </>
  );
}

const LINE_RULE: Record<LineKind, string> = {
  segment: 'Відрізок має два кінці — дві точки.',
  ray: 'Промінь має початок — одну точку — і йде далі без кінця.',
  line: 'Пряма не має ні початку, ні кінця — тягнеться в обидва боки.',
  curve: 'Крива лінія — вигнута, не рівна.',
  polyline: 'Ламана складається з відрізків, що йдуть один за одним.',
  closed: 'Замкнена ламана: її кінець зʼєднаний з початком.',
};

const geoLines: GameDefinition<Payload, Answer> = {
  id: 'geo-lines',
  title: 'Лінії й відрізки',
  subject: 'math',
  levels: ['L3'],
  icon: '📏',
  description: 'Пряма, промінь, відрізок, ламана; виміряй і накресли відрізок.',
  accent: '#FEF3C7',
  skillsFor: (d) => (d === 1 ? ['math.geom.l1.lines'] : ['math.geom.l1.segment-measure']),
  // 11.10: «чому так» — за 💡 після відповіді
  explain: (round) => {
    const p = round.payload;
    if (p.mode === 'find') return { steps: [`Це ${LINE_NAMES[p.target].title}.`, LINE_RULE[p.target]] };
    if (p.mode === 'measure') {
      const end = p.start + p.length;
      return p.start === 0
        ? { steps: ['Відрізок починається з 0.', `Кінець — на ${end}. Отже, ${p.length} см.`] }
        : { steps: [`Початок — на ${p.start}, кінець — на ${end}.`, `${end} − ${p.start} = ${p.length} см.`], why: 'Якщо відрізок не з нуля, від кінця віднімаємо початок.' };
    }
    return { steps: [`Між точками має бути ${p.length} поділок лінійки.`, `Наприклад, від 0 до ${p.length} або від 2 до ${2 + p.length}.`] };
  },
  generate,
  Component,
};

export default geoLines;
