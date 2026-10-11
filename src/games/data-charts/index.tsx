import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData, ClassLevel, ProfileLevel } from '../types';
import { PromptCard, ChoiceGrid, shuffle, randInt } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Діаграми» (11.10.2026) — 3 і 4 клас, стовпчаста діаграма й таблиця:
 *  3 кл: d1 прочитати значення / найвищий стовпчик; d2 на скільки більше/менше;
 *        d3 яка діаграма відповідає таблиці;
 *  4 кл: d1 сума двох стовпців / яка пара разом більша; d2 у скільки разів більше/менше;
 *        d3 яка діаграма відповідає таблиці (стовпці переставлені).
 */

type Cat = { l: string; g: string };
type Theme = { title: string; loc: string; cats: Cat[] };
export const THEMES: Theme[] = [
  { title: 'Домашні улюбленці в класі', loc: 'у класі', cats: [{ l: 'Коти', g: 'котів' }, { l: 'Собаки', g: 'собак' }, { l: 'Рибки', g: 'рибок' }, { l: 'Папуги', g: 'папуг' }, { l: 'Хомʼяки', g: 'хомʼяків' }] },
  { title: 'Фрукти в кошику', loc: 'у кошику', cats: [{ l: 'Яблука', g: 'яблук' }, { l: 'Груші', g: 'груш' }, { l: 'Сливи', g: 'слив' }, { l: 'Банани', g: 'бананів' }, { l: 'Лимони', g: 'лимонів' }] },
  { title: 'Книжки на полиці', loc: 'на полиці', cats: [{ l: 'Казки', g: 'казок' }, { l: 'Комікси', g: 'коміксів' }, { l: 'Атласи', g: 'атласів' }, { l: 'Вірші', g: 'віршів' }, { l: 'Журнали', g: 'журналів' }] },
  { title: 'Квіти на клумбі', loc: 'на клумбі', cats: [{ l: 'Лілії', g: 'лілій' }, { l: 'Ромашки', g: 'ромашок' }, { l: 'Айстри', g: 'айстр' }, { l: 'Нарциси', g: 'нарцисів' }, { l: 'Піони', g: 'піонів' }] },
];

type Base = { q: string; title: string; cats: string[]; vals: number[]; step: number; top: number; options: string[] };
export type Payload =
  | (Base & { mode: 'value' | 'diff' | 'sum' | 'ratio' | 'extreme' | 'pairs'; ask: number[]; flag: boolean })
  | (Base & { mode: 'match'; charts: Record<string, number[]> });
type Answer = string;

type Chart = { theme: Theme; idx: number[]; cats: string[]; js: number[]; vals: number[]; step: number; top: number };

function makeChart(count: number, steps: number[], maxJ: number, js?: number[]): Chart {
  const theme = shuffle(THEMES)[0];
  const idx = shuffle([0, 1, 2, 3, 4]).slice(0, count);
  const step = shuffle(steps)[0];
  const jj = js ?? shuffle(Array.from({ length: maxJ }, (_, i) => i + 1)).slice(0, count);
  return { theme, idx, cats: idx.map((i) => theme.cats[i].l), js: jj, vals: jj.map((j) => j * step), step, top: Math.max(...jj) * step };
}

function stepOptions(ans: number, extras: number[], step: number, n = 4): string[] {
  const pool: number[] = [];
  for (const e of shuffle(extras)) if (e > 0 && e !== ans && !pool.includes(e)) pool.push(e);
  for (const d of [1, -1, 2, -2, 3, -3]) {
    if (pool.length >= n - 1) break;
    const v = ans + d * step;
    if (v > 0 && v !== ans && !pool.includes(v)) pool.push(v);
  }
  return shuffle([ans, ...pool.slice(0, n - 1)]).map(String);
}

function two(c: Chart): [number, number] {
  const a = randInt(0, c.cats.length - 1);
  let b = randInt(0, c.cats.length - 1);
  while (b === a) b = randInt(0, c.cats.length - 1);
  return [a, b];
}
const gen = (c: Chart, i: number) => c.theme.cats[c.idx[i]].g;
const base = (c: Chart, q: string, options: string[]): Base => ({ q, title: c.theme.title, cats: c.cats, vals: c.vals, step: c.step, top: c.top, options });

function matchRound(c: Chart, grade4: boolean): Omit<Round<Payload, Answer>, 'id'> {
  const n = c.vals.length;
  const variants: number[][] = [c.js];
  const pairs = shuffle(Array.from({ length: n }, (_, i) => i).flatMap((i) => Array.from({ length: n - i - 1 }, (_, k) => [i, i + 1 + k] as [number, number])));
  const swap = (js: number[], [a, b]: [number, number]) => { const r = js.slice(); [r[a], r[b]] = [r[b], r[a]]; return r; };
  variants.push(swap(c.js, pairs[0]), swap(c.js, pairs[1]));
  if (!grade4 && Math.random() < 0.5) {
    const i = randInt(0, n - 1);
    const r = c.js.slice();
    r[i] = r[i] + (r[i] > 1 && Math.random() < 0.5 ? -1 : 1);
    if (!r.some((x, k) => k !== i && x === r[i])) variants[2] = r;
  }
  const order = shuffle(variants);
  const letters = ['A', 'B', 'C'];
  const charts: Record<string, number[]> = {};
  order.forEach((js, k) => { charts[letters[k]] = js.map((j) => j * c.step); });
  const top = Math.max(...order.flat()) * c.step;
  const answer = letters[order.indexOf(c.js)];
  return { payload: { mode: 'match', ...base(c, 'Яка діаграма відповідає таблиці?', letters), top, charts }, answer };
}

export function generate(difficulty: Difficulty, _level?: ProfileLevel, classLevel?: ClassLevel): LevelData<Payload, Answer> {
  const g4 = classLevel === 'grade4';
  const items: Omit<Round<Payload, Answer>, 'id'>[] = [];
  const cnt = () => randInt(4, 5);
  const steps3 = [2, 5, 10], steps4 = [5, 10];
  for (let r = 0; r < 5; r++) {
    if (!g4 && difficulty === 1) {
      const c = makeChart(cnt(), steps3, 6);
      if (r < 3) {
        const i = randInt(0, c.vals.length - 1);
        items.push({ payload: { mode: 'value', ...base(c, `Скільки ${gen(c, i)} ${c.theme.loc}?`, stepOptions(c.vals[i], c.vals, c.step)), ask: [i], flag: true }, answer: String(c.vals[i]) });
      } else {
        const high = r === 3;
        const pick = c.cats.map((_, i) => i);
        const best = pick.reduce((m, i) => ((high ? c.vals[i] > c.vals[m] : c.vals[i] < c.vals[m]) ? i : m), 0);
        const others = shuffle(pick.filter((i) => i !== best)).slice(0, 3);
        items.push({ payload: { mode: 'extreme', ...base(c, high ? 'Який стовпчик найвищий?' : 'Який стовпчик найнижчий?', shuffle([best, ...others]).map((i) => c.cats[i])), ask: [best], flag: high }, answer: c.cats[best] });
      }
    } else if (!g4 && difficulty === 2) {
      const c = makeChart(cnt(), steps3, 6);
      const [a, b] = two(c);
      const more = Math.random() < 0.5;
      const hi = c.vals[a] > c.vals[b] ? a : b, lo = hi === a ? b : a;
      const ans = c.vals[hi] - c.vals[lo];
      const first = more ? hi : lo, second = more ? lo : hi;
      const q = more ? `На скільки більше ${gen(c, first)}, ніж ${gen(c, second)}, ${c.theme.loc}?` : `На скільки менше ${gen(c, first)}, ніж ${gen(c, second)}, ${c.theme.loc}?`;
      items.push({ payload: { mode: 'diff', ...base(c, q, stepOptions(ans, [c.vals[a] + c.vals[b], c.vals[hi], c.vals[lo]], c.step)), ask: [first, second], flag: more }, answer: String(ans) });
    } else if (difficulty === 3) {
      const c = makeChart(g4 ? 5 : cnt(), g4 ? steps4 : steps3, g4 ? 7 : 6);
      items.push(matchRound(c, g4));
    } else if (g4 && difficulty === 1) {
      const c = makeChart(5, steps4, 7);
      if (r < 3) {
        const [a, b] = two(c);
        const ans = c.vals[a] + c.vals[b];
        items.push({ payload: { mode: 'sum', ...base(c, `Скільки разом ${gen(c, a)} і ${gen(c, b)} ${c.theme.loc}?`, stepOptions(ans, [Math.abs(c.vals[a] - c.vals[b]), c.vals[a], c.vals[b]], c.step)), ask: [a, b], flag: true }, answer: String(ans) });
      } else {
        let ps: [number, number][];
        let guard = 0;
        do {
          ps = [two(c), two(c), two(c)];
          guard++;
        } while (guard < 500 && (new Set(ps.map(([a, b]) => c.vals[a] + c.vals[b])).size < 3 || new Set(ps.map(([a, b]) => [a, b].sort().join())).size < 3));
        const label = ([a, b]: [number, number]) => `${c.cats[a]} + ${c.cats[b]}`;
        const sums = ps.map(([a, b]) => c.vals[a] + c.vals[b]);
        const best = sums.indexOf(Math.max(...sums));
        items.push({ payload: { mode: 'pairs', ...base(c, 'Які два стовпчики разом вищі?', ps.map(label)), ask: ps.flat(), flag: true }, answer: label(ps[best]) });
      }
    } else {
      // 4 клас, d2: у скільки разів більше/менше
      const k = randInt(2, 4);
      const jSmall = randInt(1, Math.floor(8 / k));
      const jBig = k * jSmall;
      const rest = shuffle(Array.from({ length: 8 }, (_, i) => i + 1).filter((j) => j !== jSmall && j !== jBig));
      const count = cnt();
      const js = shuffle([jSmall, jBig, ...rest.slice(0, count - 2)]);
      const c = makeChart(count, steps4, 8, js);
      const iBig = js.indexOf(jBig), iSmall = js.indexOf(jSmall);
      const more = Math.random() < 0.5;
      const q = more ? `У скільки разів більше ${gen(c, iBig)}, ніж ${gen(c, iSmall)}, ${c.theme.loc}?` : `У скільки разів менше ${gen(c, iSmall)}, ніж ${gen(c, iBig)}, ${c.theme.loc}?`;
      const options = shuffle([k, ...shuffle([2, 3, 4, 5, 6].filter((x) => x !== k)).slice(0, 3)]).map(String);
      items.push({ payload: { mode: 'ratio', ...base(c, q, options), ask: [iBig, iSmall], flag: more }, answer: String(k) });
    }
  }
  return { difficulty, rounds: shuffle(items).map((r, i) => ({ ...r, id: `r${i}` })) };
}

export function BarChart({ cats, vals, step, top, compact }: { cats: string[]; vals: number[]; step: number; top: number; compact?: boolean }) {
  const W = 320, H = compact ? 160 : 200, L = 34, B = 26, T = 10, R = 8;
  const ph = H - B - T, pw = W - L - R, slot = pw / cats.length, bw = slot * 0.6;
  const y = (v: number) => T + ph - (v / top) * ph;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 380, display: 'block', margin: '6px auto' }} role="img" aria-label="стовпчаста діаграма">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke={t === 0 ? '#334155' : '#E2E8F0'} strokeWidth={t === 0 ? 2 : 1} />
          <text x={L - 5} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#475569">{t}</text>
        </g>
      ))}
      <line x1={L} x2={L} y1={T} y2={y(0)} stroke="#334155" strokeWidth={2} />
      {cats.map((c, i) => (
        <g key={c}>
          <rect x={L + slot * i + (slot - bw) / 2} y={y(vals[i])} width={bw} height={y(0) - y(vals[i])} fill="#3B82F6" rx={2} />
          <text x={L + slot * i + slot / 2} y={H - 8} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="#1E293B">{c}</text>
        </g>
      ))}
    </svg>
  );
}

function DataTable({ title, cats, vals }: { title: string; cats: string[]; vals: number[] }) {
  const cell = { border: '1px solid #CBD5E1', padding: '3px 8px', textAlign: 'center' as const, fontSize: 15 };
  return (
    <table style={{ borderCollapse: 'collapse', margin: '6px auto' }}>
      <caption style={{ fontWeight: 800, marginBottom: 6 }}>{title}</caption>
      <tbody>
        {/* вертикально: 5 колонок у рядок не влазять на 390 px */}
        {cats.map((c, i) => <tr key={c}><td style={{ ...cell, fontWeight: 700, textAlign: 'left' }}>{c}</td><td style={cell}>{vals[i]}</td></tr>)}
      </tbody>
    </table>
  );
}

export const PHRASES = {
  value: { key: 'p_chart_value', text: 'Подивися на діаграму й знайди потрібне значення.' },
  extreme: { key: 'p_chart_extreme', text: 'Подивися на діаграму. Який стовпчик найвищий або найнижчий?' },
  diff: { key: 'p_chart_diff', text: 'Порівняй два стовпчики діаграми. На скільки одне число більше за інше?' },
  sum: { key: 'p_chart_sum', text: 'Подивися на діаграму й знайди суму двох стовпчиків.' },
  pairs: { key: 'p_chart_pairs', text: 'Яка пара стовпчиків разом вища?' },
  ratio: { key: 'p_chart_ratio', text: 'Порівняй два стовпчики. У скільки разів одне число більше за інше?' },
  match: { key: 'p_chart_match', text: 'Яка діаграма відповідає таблиці?' },
} as const;

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = PHRASES[p.mode];
  const say = hasUkAudio(phrase.key) ? () => sayUkSeq([phrase]) : undefined;
  if (p.mode === 'match') {
    return (
      <>
        <PromptCard question={p.q} answerState={answerState} say={say} sayKey={round.id}>
          <DataTable title={p.title} cats={p.cats} vals={p.vals} />
        </PromptCard>
        <ChoiceGrid options={p.options.map((o) => ({ value: o, node: <div style={{ width: '100%' }}><div style={{ fontWeight: 900, fontSize: 18 }}>{o}</div><BarChart cats={p.cats} vals={p.charts[o]} step={p.step} top={p.top} compact /></div> }))}
          correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={1} />
      </>
    );
  }
  const textual = p.mode === 'extreme' || p.mode === 'pairs';
  return (
    <>
      <PromptCard question={p.q} answerState={answerState} say={say} sayKey={round.id}>
        <div style={{ fontWeight: 800, textAlign: 'center', fontSize: 15 }}>{p.title}</div>
        <BarChart cats={p.cats} vals={p.vals} step={p.step} top={p.top} />
      </PromptCard>
      <ChoiceGrid options={p.options.map((o) => ({ value: o, node: <span style={{ fontSize: textual ? 17 : 24, fontWeight: 800 }}>{o}</span> }))}
        correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={p.mode === 'pairs' ? 1 : 2} />
    </>
  );
}

const dataCharts: GameDefinition<Payload, Answer> = {
  id: 'data-charts',
  title: 'Діаграми',
  subject: 'math',
  levels: ['L3'],
  icon: '📊',
  description: 'Стовпчасті діаграми й таблиці: читаємо, порівнюємо, обираємо правильну діаграму.',
  accent: '#DBEAFE',
  skillsFor: (_d, cls) => (cls === 'grade4' ? ['math.data.l4.data-analysis'] : ['math.data.l3.line-charts']),
  explain: (round) => {
    const p = round.payload;
    if (p.mode === 'match') return { steps: ['Порівняй стовпчики з числами в таблиці: кожен стовпчик має сягати свого числа на шкалі.', `Правильна діаграма — ${round.answer}.`] };
    const [a, b] = p.ask;
    const va = p.vals[a], vb = p.vals[b];
    if (p.mode === 'value') return { steps: ['Знайди потрібний стовпчик і подивися, проти якого числа на шкалі закінчується його верхівка.', `Відповідь: ${round.answer}.`] };
    if (p.mode === 'extreme') return { steps: [p.flag ? 'Найвищий стовпчик має найбільше значення.' : 'Найнижчий стовпчик має найменше значення.', `Це «${round.answer}».`] };
    if (p.mode === 'diff') return { steps: [`Читаємо стовпчики: ${Math.max(va, vb)} і ${Math.min(va, vb)}.`, `Щоб дізнатись, на скільки більше, віднімаємо: ${Math.max(va, vb)} − ${Math.min(va, vb)} = ${round.answer}.`] };
    if (p.mode === 'sum') return { steps: [`Читаємо стовпчики: ${va} і ${vb}.`, `Разом: ${va} + ${vb} = ${round.answer}.`] };
    if (p.mode === 'ratio') return { steps: [`Читаємо стовпчики: ${va} і ${vb}.`, `${Math.max(va, vb)} : ${Math.min(va, vb)} = ${round.answer}.`] };
    return { steps: ['Для кожної пари додай значення двох стовпчиків.', `Найбільша сума в парі: ${round.answer}.`] };
  },
  generate,
  Component,
};

export default dataCharts;
