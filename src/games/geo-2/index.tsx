import { useState } from 'react';
import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Геометрія 2» (11.10.2026) — 2 клас, програма Савченко [2 МАО 4.5–4.7]:
 *  d1 — коло чи круг; многокутник за кількістю кутів;
 *  d2 — довжина ламаної (ланки підписані);
 *  d3 — побудуй прямокутник a × b у клітинку: тап у два протилежні кути.
 */

type Payload =
  | { mode: 'circle'; target: 'коло' | 'круг'; options: ('коло' | 'круг' | 'овал')[] }
  | { mode: 'poly'; sides: number; options: string[] }
  | { mode: 'polyline'; lens: number[]; options: number[] }
  | { mode: 'grid'; w: number; h: number };
type Answer = string | number;

const ROUNDS = 5;
const randInt = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const POLY: Record<number, string> = { 3: 'трикутник', 4: 'чотирикутник', 5: 'пʼятикутник', 6: 'шестикутник' };

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const rounds: Round<Payload, Answer>[] = Array.from({ length: ROUNDS }, (_, i) => {
    if (difficulty === 1) {
      if (i % 2 === 0) {
        const target = Math.random() < 0.5 ? 'коло' as const : 'круг' as const;
        return { id: `r${i}`, payload: { mode: 'circle', target, options: shuffle(['коло', 'круг', 'овал'] as const) as ('коло' | 'круг' | 'овал')[] }, answer: target };
      }
      const sides = randInt(3, 6);
      const others = shuffle(Object.values(POLY).filter((v) => v !== POLY[sides])).slice(0, 2);
      return { id: `r${i}`, payload: { mode: 'poly', sides, options: shuffle([POLY[sides], ...others]) }, answer: POLY[sides] };
    }
    if (difficulty === 2) {
      const n = randInt(2, 4);
      const lens = Array.from({ length: n }, () => randInt(2, 9));
      const sum = lens.reduce((a, b) => a + b, 0);
      // пастка: лише перша й остання ланка (відстань «напряму»), ±1
      const opts = shuffle([...new Set([sum, lens[0] + lens[n - 1], sum + 1, sum - 1])].filter((x) => x > 0)).slice(0, 3);
      return { id: `r${i}`, payload: { mode: 'polyline', lens, options: opts.includes(sum) ? opts : [sum, ...opts.slice(0, 2)] }, answer: sum };
    }
    const w = randInt(2, 5), h = randInt(1, 4);
    return { id: `r${i}`, payload: { mode: 'grid', w, h }, answer: `${w}x${h}` };
  });
  return { difficulty, rounds };
}

const INK = '#1F2333';

function Ring({ kind }: { kind: 'коло' | 'круг' | 'овал' }) {
  return (
    <svg viewBox="0 0 60 60" width={52} height={52} aria-hidden>
      {kind === 'овал' ? <ellipse cx={30} cy={30} rx={26} ry={16} fill="#BFDBFE" stroke={INK} strokeWidth={3} />
        : <circle cx={30} cy={30} r={24} fill={kind === 'круг' ? '#BFDBFE' : 'none'} stroke={INK} strokeWidth={3} />}
    </svg>
  );
}

function Poly({ sides }: { sides: number }) {
  const pts = Array.from({ length: sides }, (_, i) => {
    const a = (Math.PI * 2 * i) / sides - Math.PI / 2 + 0.3;
    return `${40 + 30 * Math.cos(a)},${40 + 30 * Math.sin(a)}`;
  }).join(' ');
  return <svg viewBox="0 0 80 80" width={120} height={120} aria-hidden><polygon points={pts} fill="#FDE68A" stroke={INK} strokeWidth={3} strokeLinejoin="round" /></svg>;
}

function Polyline({ lens }: { lens: number[] }) {
  // ламана зигзагом; підписи ланок посередині
  const pts: [number, number][] = [[10, 70]];
  lens.forEach((l, k) => { const [x, y] = pts[k]; pts.push([x + 14 + l * 4, k % 2 === 0 ? y - 40 : y + 40]); });
  const W = pts[pts.length - 1][0] + 12;
  return (
    <svg viewBox={`0 0 ${W} 90`} style={{ width: '100%', maxWidth: 320 }} aria-hidden>
      <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      {pts.map(([x, y], k) => <circle key={k} cx={x} cy={y} r={3.5} fill={INK} />)}
      {lens.map((l, k) => {
        const [x1, y1] = pts[k], [x2, y2] = pts[k + 1];
        return <text key={k} x={(x1 + x2) / 2 + 6} y={(y1 + y2) / 2 + 4} fontSize={12} fontWeight={800} fill="#2563EB">{l} см</text>;
      })}
    </svg>
  );
}

/** Сітка точок 7×5; два тапи — протилежні кути; прямокутник має бути w × h клітинок (будь-якої орієнтації). */
function GridBuild({ disabled, onDone }: { disabled: boolean; onDone: (v: string) => void }) {
  const C = 34, COLS = 7, ROWS = 5;
  const [a, setA] = useState<[number, number] | null>(null);
  const [b, setB] = useState<[number, number] | null>(null);
  const tap = (p: [number, number]) => {
    if (disabled || b) return;
    if (!a) return setA(p);
    if (p[0] === a[0] || p[1] === a[1]) return setA(p); // в одну лінію — не прямокутник, починаємо з цієї точки
    setB(p);
    const w = Math.abs(p[0] - a[0]), h = Math.abs(p[1] - a[1]);
    window.setTimeout(() => onDone(`${w}x${h}`), 300);
  };
  return (
    <svg viewBox={`0 0 ${(COLS - 1) * C + 20} ${(ROWS - 1) * C + 20}`} style={{ width: '100%', maxWidth: 260, touchAction: 'manipulation' }}>
      {a && b && <rect x={10 + Math.min(a[0], b[0]) * C} y={10 + Math.min(a[1], b[1]) * C} width={Math.abs(a[0] - b[0]) * C} height={Math.abs(a[1] - b[1]) * C} fill="#BBF7D0" stroke="#16A34A" strokeWidth={3} />}
      {Array.from({ length: COLS * ROWS }, (_, k) => {
        const x = k % COLS, y = Math.floor(k / COLS);
        const on = (a && a[0] === x && a[1] === y) || (b && b[0] === x && b[1] === y);
        return (
          <g key={k} onClick={() => tap([x, y])} style={{ cursor: 'pointer' }}>
            <circle cx={10 + x * C} cy={10 + y * C} r={14} fill="transparent" />
            <circle cx={10 + x * C} cy={10 + y * C} r={on ? 7 : 4} fill={on ? INK : '#C9CDD8'} />
          </g>
        );
      })}
    </svg>
  );
}

const PHRASES = {
  circle: { key: 'p_g2_circle', text: 'Де коло, а де круг?' },
  poly: { key: 'p_g2_poly', text: 'Як називається фігура?' },
  polyline: { key: 'p_g2_polyline', text: 'Яка довжина ламаної?' },
  grid: { key: 'p_g2_grid', text: 'Побудуй прямокутник.' },
} as const;

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = PHRASES[p.mode];
  const say = hasUkAudio(phrase.key) ? () => sayUkSeq([phrase]) : undefined;
  if (p.mode === 'circle') {
    return (
      <>
        <PromptCard question={`Знайди ${p.target}`} answerState={answerState} say={say} sayKey={round.id}>
          <div style={{ fontSize: 13, color: 'var(--c-mut)', textAlign: 'center' }}>Коло — лише лінія. Круг — разом із серединкою.</div>
        </PromptCard>
        <ChoiceGrid options={p.options.map((k) => ({ value: k, node: <span aria-label={k} style={{ display: 'block', lineHeight: 0 }}><Ring kind={k} /></span> }))} correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={3} />
      </>
    );
  }
  if (p.mode === 'poly') {
    return (
      <>
        <PromptCard question={phrase.text} answerState={answerState} say={say} sayKey={round.id}><div style={{ display: 'flex', justifyContent: 'center' }}><Poly sides={p.sides} /></div></PromptCard>
        <ChoiceGrid options={p.options.map((o) => ({ value: o, node: <span style={{ fontSize: 16, fontWeight: 800 }}>{o}</span> }))} correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={1} />
      </>
    );
  }
  if (p.mode === 'polyline') {
    return (
      <>
        <PromptCard question={phrase.text} answerState={answerState} say={say} sayKey={round.id}><div style={{ display: 'flex', justifyContent: 'center' }}><Polyline lens={p.lens} /></div></PromptCard>
        <ChoiceGrid options={p.options.map((n) => ({ value: n, node: <span>{n} см</span> }))} correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={3} />
      </>
    );
  }
  return (
    <>
      <PromptCard question={`Побудуй прямокутник ${p.w} × ${p.h} клітинки`} answerState={answerState} say={say} sayKey={round.id}>
        <div style={{ fontSize: 13, color: 'var(--c-mut)', textAlign: 'center' }}>Торкнись одного кута, потім — протилежного</div>
      </PromptCard>
      <div style={{ display: 'flex', justifyContent: 'center' }}><GridBuild key={round.id} disabled={disabled} onDone={onAnswer} /></div>
    </>
  );
}

const geo2: GameDefinition<Payload, Answer> = {
  id: 'geo-2',
  title: 'Геометрія 2',
  subject: 'math',
  levels: ['L3'],
  icon: '📐',
  description: 'Коло чи круг, многокутники, довжина ламаної, прямокутник у клітинку.',
  accent: '#FEF3C7',
  // прямокутник 3 × 2 можна побудувати і «лежачи», і «стоячи»
  isCorrect: (round, answer) => {
    const p = round.payload;
    if (p.mode !== 'grid') return answer === round.answer;
    return answer === `${p.w}x${p.h}` || answer === `${p.h}x${p.w}`;
  },
  skillsFor: (d) => (d === 1 ? ['math.geom.l2.circle-vs-disc', 'math.geom.l2.polygon-classify'] : d === 2 ? ['math.measure.l2.polyline-length'] : ['math.geom.l2.grid-rectangle']),
  // «чому так» — за 💡 після відповіді
  explain: (round) => {
    const p = round.payload;
    if (p.mode === 'circle') return { steps: ['Коло — це лише лінія, як обруч.', 'Круг — коло разом із серединкою, як тарілка.'] };
    if (p.mode === 'poly') return { steps: [`${p.sides} ${p.sides <= 4 ? 'кути' : 'кутів'} — ${POLY[p.sides]}.`, 'Назва многокутника — за кількістю кутів.'] };
    if (p.mode === 'polyline') return { steps: [`${p.lens.join(' + ')} = ${round.answer} см`, 'Довжина ламаної — сума довжин усіх ланок.'] };
    return { steps: [`${p.w} клітинки вздовж і ${p.h} — вгору.`, 'Протилежні сторони прямокутника рівні.'] };
  },
  generate,
  Component,
};

export default geo2;
