import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData, ClassLevel, ProfileLevel } from '../types';
import { PromptCard, ChoiceGrid, shuffle, randInt } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Дроби на смужці» (11.10.2026) — 3 і 4 клас:
 *  d1 — яка частина зафарбована (смужка або коло), скільки частин, скільки зафарбовано;
 *  d2 — частина від числа (1/3 від 12);
 *  d3 — 3 кл: число за його частиною (1/4 числа = 5);
 *      4 кл: дріб від числа (3/4 від 20) і число за дробом (2/5 числа = 8).
 */

export type Payload =
  | { mode: 'frac'; q: string; shape: 'strip' | 'pie'; n: number; shaded: number[]; options: string[] }
  | { mode: 'total'; q: string; shape: 'strip' | 'pie'; n: number; shaded: number[]; options: string[] }
  | { mode: 'shaded'; q: string; shape: 'strip' | 'pie'; n: number; shaded: number[]; options: string[] }
  | { mode: 'of'; q: string; k: number; n: number; N: number; options: string[] }
  | { mode: 'whole'; q: string; k: number; n: number; a: number; options: string[] };
type Answer = string;

export const same = (a: [number, number], b: [number, number]) => a[0] * b[1] === a[1] * b[0];
const fs = (k: number, n: number) => `${k}/${n}`;
export const parseFrac = (s: string): [number, number] => { const [k, n] = s.split('/').map(Number); return [k, n]; };

function numOptions(ans: number, extras: number[], n = 4, min = 1): string[] {
  const pool: number[] = [];
  for (const e of shuffle(extras)) if (e >= min && e !== ans && !pool.includes(e)) pool.push(e);
  for (const d of [1, -1, 2, -2, 3, -3, 5, -5, 10]) {
    if (pool.length >= n - 1) break;
    const v = ans + d;
    if (v >= min && v !== ans && !pool.includes(v)) pool.push(v);
  }
  return shuffle([ans, ...pool.slice(0, n - 1)]).map(String);
}

function fracOptions(k: number, n: number): string[] {
  const cand: [number, number][] = [[n - k, n], [k + 1, n], [k - 1, n], [k, n + 1], [k, n + 2], [k, n + 3], [k, n - k], [1, n], [k + 1, n + 1]];
  const pool: string[] = [];
  for (const [a, b] of shuffle(cand)) {
    if (a < 1 || a >= b || same([a, b], [k, n])) continue;
    const s = fs(a, b);
    if (!pool.includes(s)) pool.push(s);
  }
  return shuffle([fs(k, n), ...pool.slice(0, 3)]);
}

function shading(n: number, k: number): number[] {
  return shuffle(Array.from({ length: n }, (_, i) => i)).slice(0, k).sort((a, b) => a - b);
}

export function generate(difficulty: Difficulty, _level?: ProfileLevel, classLevel?: ClassLevel): LevelData<Payload, Answer> {
  const g4 = classLevel === 'grade4';
  const items: Omit<Round<Payload, Answer>, 'id'>[] = [];
  if (difficulty === 1) {
    const modes = ['frac', 'frac', 'frac', 'total', 'shaded'] as const;
    for (const mode of modes) {
      const n = randInt(2, 8), k = randInt(1, n - 1);
      const shape = Math.random() < 0.5 ? 'strip' : 'pie';
      const shaded = shading(n, k);
      if (mode === 'frac') items.push({ payload: { mode, q: 'Яка частина зафарбована?', shape, n, shaded, options: fracOptions(k, n) }, answer: fs(k, n) });
      else if (mode === 'total') items.push({ payload: { mode, q: 'На скільки рівних частин поділено фігуру?', shape, n, shaded, options: numOptions(n, [k, n - k, n + 1, n - 1], 4, 2) }, answer: String(n) });
      else items.push({ payload: { mode, q: 'Скільки частин зафарбовано?', shape, n, shaded, options: numOptions(k, [n, n - k, k + 1, k - 1], 4, 1) }, answer: String(k) });
    }
  } else if (difficulty === 2) {
    for (let i = 0; i < 5; i++) {
      const n = shuffle(g4 ? [2, 3, 4, 5, 6, 8, 10] : [2, 3, 4, 5, 6, 10])[0];
      const m = g4 ? randInt(5, 20) : randInt(2, 9);
      const N = n * m;
      items.push({ payload: { mode: 'of', q: 'Скільки це?', k: 1, n, N, options: numOptions(m, [N - m, n, N, m + n, m * 2, m + 1, m - 1], 4, 1) }, answer: String(m) });
    }
  } else if (g4) {
    for (let i = 0; i < 5; i++) {
      const n = randInt(3, 10);
      const k = randInt(2, Math.min(n - 1, 7));
      const m = randInt(2, 12);
      if (i < 3) {
        const N = n * m, ans = m * k;
        items.push({ payload: { mode: 'of', q: 'Скільки це?', k, n, N, options: numOptions(ans, [m, N - ans, N, ans + m, ans - m, ans + k], 4, 1) }, answer: String(ans) });
      } else {
        const a = k * m, x = n * m;
        items.push({ payload: { mode: 'whole', q: 'Яке це число?', k, n, a, options: numOptions(x, [a, a * n, a + n, x + n, x - n, m], 4, 1) }, answer: String(x) });
      }
    }
  } else {
    for (let i = 0; i < 5; i++) {
      const n = shuffle([2, 3, 4, 5, 6, 10])[0];
      const a = randInt(2, 9), x = n * a;
      items.push({ payload: { mode: 'whole', q: 'Яке це число?', k: 1, n, a, options: numOptions(x, [a + n, a, x + n, x - n, a * 2, x + 1], 4, 1) }, answer: String(x) });
    }
  }
  return { difficulty, rounds: shuffle(items).map((r, i) => ({ ...r, id: `r${i}` })) };
}

export function Frac({ k, n, size = 26 }: { k: number | string; n: number | string; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle', lineHeight: 1.1, fontWeight: 900, fontSize: size, margin: '0 4px' }}>
      <span style={{ padding: '0 6px' }}>{k}</span>
      <span style={{ alignSelf: 'stretch', borderTop: `${Math.max(2, Math.round(size / 10))}px solid currentColor`, margin: '2px 0' }} />
      <span style={{ padding: '0 6px' }}>{n}</span>
    </span>
  );
}

const FILL = '#F59E0B', EMPTY = '#FFFFFF', LINE = '#334155';

function Shape({ shape, n, shaded }: { shape: 'strip' | 'pie'; n: number; shaded: number[] }) {
  if (shape === 'strip') {
    const W = 280, H = 44, w = W / n;
    return (
      <svg viewBox={`0 0 ${W + 4} ${H + 4}`} width="100%" style={{ maxWidth: 320, display: 'block', margin: '8px auto' }} role="img" aria-label="смужка">
        {Array.from({ length: n }, (_, i) => (
          <rect key={i} x={2 + i * w} y={2} width={w} height={H} fill={shaded.includes(i) ? FILL : EMPTY} stroke={LINE} strokeWidth={2} />
        ))}
      </svg>
    );
  }
  const R = 62, C = 70;
  const pt = (a: number) => [C + R * Math.cos(a), C + R * Math.sin(a)];
  return (
    <svg viewBox="0 0 140 140" width={150} height={150} style={{ display: 'block', margin: '8px auto' }} role="img" aria-label="коло">
      {Array.from({ length: n }, (_, i) => {
        const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / n, a1 = -Math.PI / 2 + ((i + 1) * 2 * Math.PI) / n;
        const [x0, y0] = pt(a0), [x1, y1] = pt(a1);
        return <path key={i} d={`M ${C} ${C} L ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1} Z`} fill={shaded.includes(i) ? FILL : EMPTY} stroke={LINE} strokeWidth={2} strokeLinejoin="round" />;
      })}
    </svg>
  );
}

export const PHRASES = {
  frac: { key: 'p_frac_frac', text: 'Яка частина фігури зафарбована?' },
  total: { key: 'p_frac_total', text: 'На скільки рівних частин поділено фігуру?' },
  shaded: { key: 'p_frac_shaded', text: 'Скільки частин зафарбовано?' },
  of: { key: 'p_frac_of', text: 'Знайди частину від числа.' },
  whole: { key: 'p_frac_whole', text: 'Знайди число за його частиною.' },
} as const;

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = PHRASES[p.mode];
  const say = hasUkAudio(phrase.key) ? () => sayUkSeq([phrase]) : undefined;
  const row = { fontSize: 26, fontWeight: 900, textAlign: 'center' as const, margin: '8px 0' };
  const isFrac = p.mode === 'frac';
  return (
    <>
      <PromptCard question={p.q} answerState={answerState} say={say} sayKey={round.id}>
        {(p.mode === 'frac' || p.mode === 'total' || p.mode === 'shaded') && <Shape shape={p.shape} n={p.n} shaded={p.shaded} />}
        {p.mode === 'of' && <div style={row}><Frac k={p.k} n={p.n} /> від {p.N} = ?</div>}
        {p.mode === 'whole' && <div style={row}><Frac k={p.k} n={p.n} /> числа дорівнює {p.a}</div>}
      </PromptCard>
      <ChoiceGrid options={p.options.map((o) => {
        const f = isFrac ? parseFrac(o) : null;
        return { value: o, node: f ? <Frac k={f[0]} n={f[1]} size={28} /> : <span style={{ fontSize: 24, fontWeight: 800 }}>{o}</span> };
      })} correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={2} />
    </>
  );
}

const fractionStrip: GameDefinition<Payload, Answer> = {
  id: 'fraction-strip',
  title: 'Дроби на смужці',
  subject: 'math',
  levels: ['L3'],
  icon: '🍕',
  description: 'Частини цілого на смужці та колі, частина від числа, число за його частиною.',
  accent: '#FFEDD5',
  skillsFor: (d, cls) =>
    d === 1 ? ['math.ops.l3.fractions-part-whole']
      : cls === 'grade4' ? ['math.ops.l4.fraction-of-number']
        : ['math.ops.l3.fraction-parts'],
  explain: (round) => {
    const p = round.payload;
    if (p.mode === 'frac') {
      return { steps: [`Фігуру поділено на ${p.n} рівних частин: це знаменник.`, `Зафарбовано ${p.shaded.length}: це чисельник.`, `Зафарбована частина: ${round.answer}.`] };
    }
    if (p.mode === 'total') return { steps: [`Порахуй усі частини фігури, і зафарбовані, і ні: їх ${p.n}.`] };
    if (p.mode === 'shaded') return { steps: [`Порахуй лише зафарбовані частини: їх ${p.shaded.length}.`] };
    if (p.mode === 'of') {
      const m = p.N / p.n;
      return p.k === 1
        ? { steps: [`Щоб знайти 1/${p.n} числа, ділимо його на ${p.n}.`, `${p.N} : ${p.n} = ${m}.`] }
        : { steps: [`Спершу знайдемо 1/${p.n}: ${p.N} : ${p.n} = ${m}.`, `Потім беремо ${p.k} таких частин: ${m} · ${p.k} = ${m * p.k}.`] };
    }
    const m = p.a / p.k;
    return p.k === 1
      ? { steps: [`Одна частина з ${p.n} дорівнює ${p.a}.`, `Усе число — ${p.n} таких частин: ${p.a} · ${p.n} = ${p.a * p.n}.`] }
      : { steps: [`${p.k} частин дорівнюють ${p.a}, тому одна частина: ${p.a} : ${p.k} = ${m}.`, `Усього частин ${p.n}: ${m} · ${p.n} = ${m * p.n}.`] };
  },
  generate,
  Component,
};

export default fractionStrip;
