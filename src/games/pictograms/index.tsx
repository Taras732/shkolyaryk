import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Піктограми» (11.10.2026) — 1 клас, програма Савченко [1 МАО 2.1]: читає дані на схематичному
 * рисунку й у таблиці, користується ними в задачах.
 *  d1 — «Скільки …?»: прочитати рядок піктограми;
 *  d2 — чого найбільше / найменше;
 *  d3 — на скільки більше одного, ніж іншого (різницеве порівняння в межах 10).
 */

/** Що рахуємо: емодзі, назва в родовому відмінку множини («груш»), назва в називному («груші»). */
const ITEMS = [
  { e: '🍎', gen: 'яблук', nom: 'яблука' },
  { e: '🍐', gen: 'груш', nom: 'груші' },
  { e: '🍌', gen: 'бананів', nom: 'банани' },
  { e: '🍓', gen: 'полуниць', nom: 'полуниці' },
  { e: '🍒', gen: 'вишень', nom: 'вишні' },
];

type Row = { e: string; n: number };
type Payload =
  | { mode: 'count'; rows: Row[]; target: string; options: number[] }
  | { mode: 'most'; rows: Row[]; most: boolean }
  | { mode: 'diff'; rows: Row[]; a: string; b: string; options: number[] };
type Answer = number | string;

const ROUNDS = 5;
const randInt = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const item = (e: string) => ITEMS.find((i) => i.e === e)!;

/** 3 рядки з різною кількістю 1–8 (різні — щоб «найбільше» було одне). */
function makeRows(): Row[] {
  const ns = shuffle([1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 3);
  return shuffle(ITEMS).slice(0, 3).map((it, k) => ({ e: it.e, n: ns[k] }));
}

const near = (n: number, lo = 0) => shuffle([n, ...shuffle([n - 1, n + 1, n + 2, n - 2].filter((x) => x >= lo && x <= 10)).slice(0, 2)]);

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const rounds: Round<Payload, Answer>[] = Array.from({ length: ROUNDS }, (_, i) => {
    const rows = makeRows();
    if (difficulty === 1) {
      const t = rows[randInt(0, 2)];
      return { id: `r${i}`, payload: { mode: 'count', rows, target: t.e, options: near(t.n, 1) }, answer: t.n };
    }
    if (difficulty === 2) {
      const most = Math.random() < 0.5;
      const pick = rows.reduce((x, y) => ((most ? y.n > x.n : y.n < x.n) ? y : x));
      return { id: `r${i}`, payload: { mode: 'most', rows, most }, answer: pick.e };
    }
    const [x, y] = [...rows].sort((p, q) => q.n - p.n);
    return { id: `r${i}`, payload: { mode: 'diff', rows, a: x.e, b: y.e, options: near(x.n - y.n, 1) }, answer: x.n - y.n };
  });
  return { difficulty, rounds };
}

function Pictogram({ rows }: { rows: Row[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
      {rows.map((r) => (
        <div key={r.e} style={{ display: 'flex', gap: 2, fontSize: 24, lineHeight: 1.1, background: '#F8FAFC', borderRadius: 10, padding: '4px 8px' }}>
          {Array.from({ length: r.n }, (_, k) => <span key={k}>{r.e}</span>)}
        </div>
      ))}
    </div>
  );
}

const PHRASE = { key: 'p_pict', text: 'Подивись на малюнок.' };

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const say = hasUkAudio(PHRASE.key) ? (again?: boolean) => (round.id === 'r0' || again ? sayUkSeq([PHRASE]) : undefined) : undefined;
  const q = p.mode === 'count' ? `Скільки ${item(p.target).gen}?`
    : p.mode === 'most' ? `Чого ${p.most ? 'найбільше' : 'найменше'}?`
    : `На скільки ${item(p.a).gen} більше, ніж ${item(p.b).gen}?`;
  return (
    <>
      <PromptCard question={q} answerState={answerState} say={say} sayKey={round.id}>
        <Pictogram rows={p.rows} />
      </PromptCard>
      {p.mode === 'most'
        ? <ChoiceGrid options={p.rows.map((r) => ({ value: r.e, node: <span style={{ fontSize: 40 }}>{r.e}</span> }))} correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={3} />
        : <ChoiceGrid options={p.options.map((n) => ({ value: n }))} correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={3} />}
    </>
  );
}

const pictograms: GameDefinition<Payload, Answer> = {
  id: 'pictograms',
  title: 'Піктограми',
  subject: 'math',
  levels: ['L3'],
  icon: '📊',
  description: 'Прочитай малюнок-таблицю: скільки, чого найбільше, на скільки більше.',
  accent: '#FEF3C7',
  skillsFor: (d, cl) => (cl === 'grade2' ? ['math.data.l2.charts'] : d === 3 ? ['math.data.l1.simple-charts', 'math.ops.l1.more-less-by'] : ['math.data.l1.simple-charts']),
  // «чому так» — за 💡 після відповіді
  explain: (round) => {
    const p = round.payload;
    const line = p.rows.map((r) => `${r.e} ${r.n}`).join(' · ');
    if (p.mode === 'count') return { steps: [line, `${item(p.target).nom[0].toUpperCase()}${item(p.target).nom.slice(1)}: ${round.answer}.`] };
    if (p.mode === 'most') return { steps: [line, `${p.most ? 'Найдовший' : 'Найкоротший'} рядок — ${round.answer}.`] };
    const [x, y] = [p.rows.find((r) => r.e === p.a)!, p.rows.find((r) => r.e === p.b)!];
    return { steps: [line, `${x.n} − ${y.n} = ${x.n - y.n}.`], why: 'Щоб дізнатись, на скільки більше, від більшого віднімаємо менше.' };
  },
  generate,
  Component,
};

export default pictograms;
