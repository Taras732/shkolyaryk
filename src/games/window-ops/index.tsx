import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Віконце» (11.10.2026) — 2 клас, програма Савченко [2 МАО 4.3, 4.8, 3.3, 3.4]:
 *  d1 — невідомий зменшуваний / відʼємник у межах 100;
 *  d2 — порядок дій з дужками й без: серед варіантів — число, що виходить «не в тому порядку»;
 *  d3 — перевірка обчислень: яка дія перевіряє приклад.
 */

type Payload =
  | { mode: 'unknown'; q: string; options: number[] }
  | { mode: 'order'; q: string; options: number[] }
  | { mode: 'check'; q: string; options: string[] };
type Answer = number | string;

const ROUNDS = 5;
const randInt = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const near = (x: number, extra: number[] = []) => {
  const pool = [...extra, x + 10, x - 10, x + 1, x - 1].filter((v) => v >= 0 && v <= 99 && v !== x);
  return shuffle([x, ...[...new Set(pool)].slice(0, 2)]);
};

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const rounds: Round<Payload, Answer>[] = Array.from({ length: ROUNDS }, (_, i) => {
    if (difficulty === 1) {
      const b = randInt(11, 45), c = randInt(10, 99 - b), a = b + c;
      // a − b = c: ховаємо зменшуване або відʼємник; типова помилка — відняти замість додати (c − b)
      if (i % 2 === 0) return { id: `r${i}`, payload: { mode: 'unknown', q: `_ − ${b} = ${c}`, options: near(a, [Math.abs(c - b)]) }, answer: a };
      return { id: `r${i}`, payload: { mode: 'unknown', q: `${a} − _ = ${c}`, options: near(b, [a + c > 99 ? b + 1 : a + c]) }, answer: b };
    }
    if (difficulty === 2) {
      const x = randInt(30, 90), y = randInt(5, 20), z = randInt(2, 9);
      const brackets = i % 2 === 0;
      // з дужками: x − (y + z); без: x − y + z. Неправильний порядок дає інше число — це й є пастка
      const right = brackets ? x - (y + z) : x - y + z;
      const wrong = brackets ? x - y + z : x - (y + z);
      return { id: `r${i}`, payload: { mode: 'order', q: brackets ? `${x} − (${y} + ${z})` : `${x} − ${y} + ${z}`, options: near(right, [wrong]) }, answer: right };
    }
    const sub = i % 2 === 0;
    const a = randInt(30, 99), b = randInt(11, a - 10), c = a - b;
    // хибні — без відʼємних чисел і без другої правильної перевірки (для додавання вірні обидві: a − b і a − c)
    if (sub) {
      const right = `${c} + ${b} = ${a}`;
      return { id: `r${i}`, payload: { mode: 'check', q: `${a} − ${b} = ${c}`, options: shuffle([right, `${a} + ${b} = ${a + b}`, `${a} + ${c} = ${a + c}`]) }, answer: right };
    }
    const right = `${a} − ${b} = ${c}`;
    return { id: `r${i}`, payload: { mode: 'check', q: `${c} + ${b} = ${a}`, options: shuffle([right, `${a} + ${b} = ${a + b}`, `${b} + ${c} = ${a}`]) }, answer: right };
  });
  return { difficulty, rounds };
}

const PHRASES = {
  unknown: { key: 'p_win_unknown', text: 'Яке число у віконці?' },
  order: { key: 'p_win_order', text: 'Порахуй у правильному порядку.' },
  check: { key: 'p_win_check', text: 'Як перевірити?' },
} as const;

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = PHRASES[p.mode];
  const say = hasUkAudio(phrase.key) ? () => sayUkSeq([phrase]) : undefined;
  const big = { fontSize: 38, fontWeight: 900, textAlign: 'center' as const, fontFamily: 'var(--font-round)' };
  const q = p.mode === 'unknown'
    ? p.q.replace('_', answerState === 'correct' ? String(round.answer) : '▢')
    : p.mode === 'order' ? `${p.q} = ?` : p.q;
  return (
    <>
      <PromptCard question={phrase.text} answerState={answerState} say={say} sayKey={round.id}>
        <div style={big}>{q}</div>
      </PromptCard>
      <ChoiceGrid options={(p.options as (string | number)[]).map((o) => ({ value: o, node: p.mode === 'check' ? <span style={{ fontSize: 20, fontWeight: 800 }}>{o}</span> : undefined }))}
        correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={p.mode === 'check' ? 1 : 3} />
    </>
  );
}

const windowOps: GameDefinition<Payload, Answer> = {
  id: 'window-ops',
  title: 'Віконце',
  subject: 'math',
  levels: ['L3'],
  icon: '🪟',
  description: 'Невідоме число у віконці, порядок дій з дужками, перевірка обчислень.',
  accent: '#E0F2FE',
  skillsFor: (d) => [d === 1 ? 'math.ops.l2.unknown-component-sub' : d === 2 ? 'math.ops.l2.order-of-operations' : 'math.ops.l2.estimate-check'],
  // «чому так» — за 💡 після відповіді
  explain: (round) => {
    const p = round.payload;
    if (p.mode === 'unknown') {
      const [l, r] = p.q.split(' = ');
      const [a, , b] = l.split(' ');
      return a === '_'
        ? { steps: [`Невідоме зменшуване: ${r} + ${b} = ${round.answer}.`, 'Зменшуване = різниця + відʼємник.'] }
        : { steps: [`Невідомий відʼємник: ${a} − ${r} = ${round.answer}.`, 'Відʼємник = зменшуване − різниця.'] };
    }
    if (p.mode === 'order') return p.q.includes('(')
      ? { steps: ['Спершу дія в дужках.', `${p.q} = ${round.answer}`] }
      : { steps: ['Без дужок — по черзі зліва направо.', `${p.q} = ${round.answer}`] };
    return { steps: [`Перевірка: ${round.answer}`, p.q.includes('−') ? 'Віднімання перевіряємо додаванням: різниця + відʼємник = зменшуване.' : 'Додавання перевіряємо відніманням: сума − доданок = інший доданок.'] };
  },
  generate,
  Component,
};

export default windowOps;
