import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Множення: як воно працює» (11.10.2026) — 2 клас, програма Савченко [2 МАО 4.1, 4.3, 4.8, 3.2]:
 *  d1 — групи предметів → вираз (3 групи по 4 — це 3 × 4, а не 3 + 4);
 *  d2 — 0 і 1, переставний закон, ділення на 0 не можна;
 *  d3 — невідомий множник / ділене / дільник і «у скільки разів більше».
 * Числа — таблиці на 2 і 3 (програма 2 класу).
 */

type Payload =
  | { mode: 'groups'; k: number; n: number; e: string; options: string[] }
  | { mode: 'special'; q: string; kind: 'one' | 'zero' | 'swap' | 'divzero'; options: string[] }
  | { mode: 'unknown'; q: string; options: string[] }
  | { mode: 'times'; a: number; b: number; e: string; options: string[] };
type Answer = string;

const ROUNDS = 5;
const randInt = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const pick = <T,>(a: readonly T[]) => a[randInt(0, a.length - 1)];
const EMOJI = ['🍎', '🍬', '⭐', '🐟', '🌸'];
const T = [2, 3];
const nums = (ans: number, lo = 0) => shuffle([...new Set([ans, ans + 1, ans - 1, ans + 2].filter((x) => x >= lo))].slice(0, 3)).map(String);

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const rounds: Round<Payload, Answer>[] = Array.from({ length: ROUNDS }, (_, i) => {
    if (difficulty === 1) {
      const k = randInt(2, 4), n = pick(T) === 2 ? randInt(2, 5) : randInt(2, 4);
      const right = `${k} × ${n}`;
      // відволікачі — лише з ІНШИМ значенням: «4 + 4» для 2 груп по 4 теж правильно, тож його не даємо
      const val = (e: string) => { const [a, op, b] = e.split(' '); return op === '×' ? Number(a) * Number(b) : Number(a) + Number(b); };
      const wrong = shuffle([`${k} + ${n}`, `${n} × ${n}`, `${k + 1} × ${n}`, `${k} × ${n + 1}`]).filter((e, j, arr) => val(e) !== k * n && arr.indexOf(e) === j);
      const options = [right, ...wrong.slice(0, 2)];
      return { id: `r${i}`, payload: { mode: 'groups', k, n, e: pick(EMOJI), options: shuffle(options) }, answer: right };
    }
    if (difficulty === 2) {
      const kind = (['one', 'zero', 'swap', 'divzero', pick(['one', 'zero'] as const)] as const)[i];
      const a = randInt(2, 9), t = pick(T);
      if (kind === 'one') { const mul = Math.random() < 0.6; return { id: `r${i}`, payload: { mode: 'special', kind, q: mul ? `${a} × 1 = ?` : `${a} : 1 = ?`, options: shuffle([String(a), '1', String(a + 1)]) }, answer: String(a) }; }
      if (kind === 'zero') { const mul = Math.random() < 0.6; return { id: `r${i}`, payload: { mode: 'special', kind, q: mul ? `0 × ${a} = ?` : `0 : ${a} = ?`, options: shuffle(['0', String(a), '1']) }, answer: '0' }; }
      // множники різні — інакше «2 × 2 = 2 × ?» дає однакові варіанти
      if (kind === 'swap') { const x = a === t ? a + 1 : a; return { id: `r${i}`, payload: { mode: 'special', kind, q: `${x} × ${t} = ${t} × ?`, options: shuffle([String(x), String(t), String(x * t)]) }, answer: String(x) }; }
      return { id: `r${i}`, payload: { mode: 'special', kind, q: `${a} : 0 = ?`, options: shuffle(['0', String(a), 'не можна']) }, answer: 'не можна' };
    }
    if (i % 2 === 0) {
      const t = pick(T), x = randInt(2, 9), p = t * x;
      const form = randInt(0, 2);
      const q = form === 0 ? `? × ${t} = ${p}` : form === 1 ? `? : ${t} = ${x}` : `${p} : ? = ${x}`;
      const ans = form === 0 ? x : form === 1 ? p : t;
      return { id: `r${i}`, payload: { mode: 'unknown', q, options: nums(ans, 1) }, answer: String(ans) };
    }
    const b = randInt(1, 3), k = pick(T), a = b * k;
    return { id: `r${i}`, payload: { mode: 'times', a, b, e: pick(EMOJI), options: shuffle([String(k), String(a - b), String(k + 1)].filter((v, j, arr) => arr.indexOf(v) === j)) }, answer: String(k) };
  });
  return { difficulty, rounds };
}

function Groups({ k, n, e }: { k: number; n: number; e: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
      {Array.from({ length: k }, (_, g) => (
        <div key={g} style={{ border: '2px dashed #CBD5E1', borderRadius: 14, padding: '4px 6px', fontSize: 22, display: 'flex', gap: 1 }}>
          {Array.from({ length: n }, (_, j) => <span key={j}>{e}</span>)}
        </div>
      ))}
    </div>
  );
}

const Row = ({ n, e, label }: { n: number; e: string; label: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <span style={{ width: 52, fontWeight: 800, fontSize: 14 }}>{label}</span>
    <span style={{ fontSize: 22 }}>{Array.from({ length: n }, () => e).join('')}</span>
  </div>
);

const PHRASES = {
  groups: { key: 'p_mm_groups', text: 'Запиши множенням.' },
  special: { key: 'p_mm_special', text: 'Скільки вийде?' },
  unknown: { key: 'p_mm_unknown', text: 'Яке число сховалось?' },
  times: { key: 'p_mm_times', text: 'У скільки разів більше?' },
} as const;

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = PHRASES[p.mode];
  const say = hasUkAudio(phrase.key) ? () => sayUkSeq([phrase]) : undefined;
  const big = { fontSize: 40, fontWeight: 900, textAlign: 'center' as const, fontFamily: 'var(--font-round)' };
  return (
    <>
      <PromptCard question={p.mode === 'times' ? `У Олі ${p.a}, у Петра ${p.b}. У скільки разів в Олі більше?` : phrase.text} answerState={answerState} say={say} sayKey={round.id}>
        {p.mode === 'groups' && <Groups k={p.k} n={p.n} e={p.e} />}
        {(p.mode === 'special' || p.mode === 'unknown') && <div style={big}>{p.q}</div>}
        {p.mode === 'times' && <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><Row n={p.a} e={p.e} label="Оля" /><Row n={p.b} e={p.e} label="Петро" /></div>}
      </PromptCard>
      <ChoiceGrid options={p.options.map((o) => ({ value: o }))} correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={3} />
    </>
  );
}

const multMeaning: GameDefinition<Payload, Answer> = {
  id: 'mult-meaning',
  title: 'Множення: як воно працює',
  subject: 'math',
  levels: ['L3'],
  icon: '✖️',
  description: 'Групи → множення, 0 і 1, переставний закон, невідомий множник, у скільки разів.',
  accent: '#FCE7F3',
  skillsFor: (d) => (d === 1 ? ['math.ops.l2.mult-table-2-3', 'math.ops.l2.mult-laws'] : d === 2 ? ['math.ops.l2.mult-special-0-1', 'math.ops.l2.mult-laws'] : ['math.ops.l2.unknown-component-mult', 'math.ops.l2.times-more-less']),
  // «чому так» — за 💡 після відповіді
  explain: (round) => {
    const p = round.payload;
    if (p.mode === 'groups') return { steps: [`${p.k} групи по ${p.n} — це ${p.k} × ${p.n} = ${p.k * p.n}.`, 'Множення — це додавання однакових доданків: ' + Array.from({ length: p.k }, () => p.n).join(' + ') + '.'] };
    if (p.mode === 'special') {
      if (p.kind === 'one') return { steps: [p.q.replace('?', String(round.answer)), 'Помножити чи поділити на 1 — число не змінюється.'] };
      if (p.kind === 'zero') return { steps: [p.q.replace('?', '0'), 'Нуль, помножений чи поділений на число, — нуль.'] };
      if (p.kind === 'swap') return { steps: [p.q.replace('?', String(round.answer)), 'Від перестановки множників добуток не змінюється.'] };
      return { steps: ['На нуль ділити не можна.', 'Немає числа, яке, помножене на 0, дало б не нуль.'] };
    }
    if (p.mode === 'unknown') return { steps: [p.q.replace('?', String(round.answer)), 'Невідомий множник: добуток ділимо на відомий множник. Ділене: частку множимо на дільник.'] };
    return { steps: [`${p.a} : ${p.b} = ${round.answer}`, 'Щоб дізнатись, у скільки разів більше, — більше число ділимо на менше.'], why: `«На скільки більше» — це віднімання (${p.a} − ${p.b}), а «у скільки разів» — ділення.` };
  },
  generate,
  Component,
};

export default multMeaning;
