import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData, ClassLevel } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Десятки й одиниці» (11.10.2026) — 1 клас, програма Савченко [1 МАО 4.1–4.2]: числа 11–100,
 * десятки й одиниці двоцифрового числа, порівняння до 100. Від предмета до числа:
 *  d1 — 11–20: зв'язка-десяток і кубики → яке число;
 *  d2 — до 100: десятки й одиниці → число, або «скільки десятків / одиниць у 47»;
 *  d3 — яке число більше (до 100): спершу десятки, порівну — одиниці.
 */

type Payload =
  | { mode: 'build'; n: number; options: number[] }
  | { mode: 'part'; n: number; ask: 'десятків' | 'одиниць'; options: number[] }
  | { mode: 'compare'; a: number; b: number }
  | { mode: 'split'; n: number; options: number[] };
type Answer = number;

const ROUNDS = 5;
const randInt = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

/** Відволікачі для числа: переставлені цифри (типова помилка 47 ↔ 74), ±1, ±10. */
function numberOptions(n: number, lo: number, hi: number): number[] {
  const swapped = n % 10 !== 0 ? (n % 10) * 10 + Math.floor(n / 10) : -1;
  const pool = [swapped, n + 1, n - 1, n + 10, n - 10].filter((x) => x >= lo && x <= hi && x !== n);
  return shuffle([n, ...[...new Set(pool)].slice(0, 2)]);
}

export function generate(difficulty: Difficulty, _level?: unknown, classLevel?: ClassLevel): LevelData<Payload, Answer> {
  let rounds: Round<Payload, Answer>[];
  if (classLevel === 'grade2' && difficulty === 2) {
    // 2 клас (11.10): розрядний склад — сума розрядних доданків «47 = 40 + _» або «47 = _ + 7»
    rounds = Array.from({ length: ROUNDS }, (_, i) => {
      const n = randInt(21, 99);
      const ones = n % 10 === 0 ? 1 : n % 10;
      const m = Math.floor(n / 10) * 10 + ones;
      return { id: `r${i}`, payload: { mode: 'split', n: m, options: shuffle([...new Set([ones, Math.floor(m / 10), ones + 10 <= 99 ? ones + 10 : ones + 1])]) }, answer: ones };
    });
    return { difficulty, rounds };
  }
  if (classLevel === 'grade2' && difficulty === 1) {
    // 2 клас: одразу двоцифрові 21–99 (11–20 — це 1 клас)
    rounds = Array.from({ length: ROUNDS }, (_, i) => { const n = randInt(21, 99); return { id: `r${i}`, payload: { mode: 'build', n, options: numberOptions(n, 10, 99) }, answer: n }; });
    return { difficulty, rounds };
  }
  if (difficulty === 1) {
    const ns = shuffle([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]).slice(0, ROUNDS);
    rounds = ns.map((n, i) => ({ id: `r${i}`, payload: { mode: 'build', n, options: numberOptions(n, 10, 20) }, answer: n }));
  } else if (difficulty === 2) {
    rounds = Array.from({ length: ROUNDS }, (_, i) => {
      const n = randInt(21, 99);
      if (i % 2 === 0) return { id: `r${i}`, payload: { mode: 'build', n, options: numberOptions(n, 10, 99) }, answer: n };
      const ask = Math.random() < 0.5 ? 'десятків' as const : 'одиниць' as const;
      const ans = ask === 'десятків' ? Math.floor(n / 10) : n % 10;
      const other = ask === 'десятків' ? n % 10 : Math.floor(n / 10);
      const opts = shuffle([...new Set([ans, other, ans + 1 <= 9 ? ans + 1 : ans - 1])].filter((x) => x >= 0)).slice(0, 3);
      return { id: `r${i}`, payload: { mode: 'part', n, ask, options: opts.includes(ans) ? opts : [ans, ...opts.slice(0, 2)] }, answer: ans };
    });
  } else {
    rounds = Array.from({ length: ROUNDS }, (_, i) => {
      const a = randInt(10, 99);
      // половина пар — однакові десятки (вирішують одиниці), решта — переставлені цифри чи різні десятки
      const r = Math.random();
      let b = r < 0.4 ? Math.floor(a / 10) * 10 + randInt(0, 9) : r < 0.7 && a % 10 !== 0 ? (a % 10) * 10 + Math.floor(a / 10) : randInt(10, 99);
      if (b === a) b = a === 99 ? 98 : a + 1;
      return { id: `r${i}`, payload: { mode: 'compare', a, b }, answer: Math.max(a, b) };
    });
  }
  return { difficulty, rounds };
}

// ---------- малюнок: десятки-стовпчики й кубики ----------

function Blocks({ n }: { n: number }) {
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  const C = 11;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 5, flexWrap: 'wrap', maxWidth: 300 }}>
      {Array.from({ length: tens }, (_, t) => (
        <svg key={`t${t}`} width={C + 4} height={C * 10 + 4} viewBox={`0 0 ${C + 4} ${C * 10 + 4}`} aria-hidden>
          {Array.from({ length: 10 }, (_, k) => <rect key={k} x={2} y={2 + k * C} width={C} height={C} fill="#60A5FA" stroke="#1E3A8A" strokeWidth={1} />)}
        </svg>
      ))}
      {ones > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column-reverse', flexWrap: 'wrap', height: C * 5 + 4, gap: 0, marginLeft: 6 }}>
          {Array.from({ length: ones }, (_, k) => (
            <svg key={k} width={C + 4} height={C + 2} viewBox={`0 0 ${C + 4} ${C + 2}`} aria-hidden>
              <rect x={2} y={1} width={C} height={C} fill="#FCA5A5" stroke="#7F1D1D" strokeWidth={1} />
            </svg>
          ))}
        </div>
      )}
    </div>
  );
}

const PHRASES = {
  build: { key: 'p_to_build', text: 'Яке це число?' },
  part: { key: 'p_to_part', text: 'Скільки в числі' },
  compare: { key: 'p_to_compare', text: 'Яке число більше?' },
  split: { key: 'p_to_split', text: 'Розклади на десятки й одиниці' },
} as const;

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = PHRASES[p.mode];
  const say = hasUkAudio(phrase.key) && p.mode !== 'part' ? (again?: boolean) => (round.id === 'r0' || again ? sayUkSeq([phrase]) : undefined) : undefined;

  if (p.mode === 'build') {
    return (
      <>
        <PromptCard question={`${phrase.text} Стовпчик — десяток, кубик — одиниця.`} answerState={answerState} say={say} sayKey={round.id}>
          <Blocks n={p.n} />
        </PromptCard>
        <ChoiceGrid options={p.options.map((n) => ({ value: n }))} correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={3} />
      </>
    );
  }
  if (p.mode === 'part') {
    return (
      <>
        <PromptCard question={`Скільки ${p.ask} у числі ${p.n}?`} answerState={answerState} sayKey={round.id}>
          <div style={{ fontSize: 64, fontWeight: 900, textAlign: 'center', letterSpacing: 6, fontFamily: 'var(--font-round)' }}>
            <span style={{ color: p.ask === 'десятків' ? '#2563EB' : 'var(--c-ink)' }}>{Math.floor(p.n / 10)}</span>
            <span style={{ color: p.ask === 'одиниць' ? '#DC2626' : 'var(--c-ink)' }}>{p.n % 10}</span>
          </div>
        </PromptCard>
        <ChoiceGrid options={p.options.map((n) => ({ value: n }))} correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={3} />
      </>
    );
  }
  if (p.mode === 'split') {
    const tens = p.n - (p.n % 10);
    return (
      <>
        <PromptCard question="Розклади на десятки й одиниці" answerState={answerState} sayKey={round.id}>
          <div style={{ fontSize: 48, fontWeight: 900, textAlign: 'center', fontFamily: 'var(--font-round)' }}>
            {p.n} = <span style={{ color: '#2563EB' }}>{tens}</span> + <span style={{ display: 'inline-block', minWidth: 50, borderBottom: '4px solid #DC2626', color: '#16A34A' }}>{answerState === 'correct' ? round.answer : ''}</span>
          </div>
        </PromptCard>
        <ChoiceGrid options={p.options.map((n) => ({ value: n }))} correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={3} />
      </>
    );
  }
  return (
    <>
      <PromptCard question={phrase.text} answerState={answerState} say={say} sayKey={round.id} />
      <ChoiceGrid options={[p.a, p.b].map((n) => ({ value: n, node: <span style={{ fontSize: 40, fontWeight: 900 }}>{n}</span> }))}
        correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={2} />
    </>
  );
}

const tensOnes: GameDefinition<Payload, Answer> = {
  id: 'tens-ones',
  title: 'Десятки й одиниці',
  subject: 'math',
  levels: ['L3'],
  icon: '🧱',
  description: 'Числа 11–100: десятки й одиниці, яке число, яке більше.',
  accent: '#DBEAFE',
  skillsFor: (d, cl) => (d === 1 ? ['math.count.l1.numbers-11-20', 'math.ops.l1.compose-decompose-20'] : d === 2 ? [cl === 'grade2' ? 'math.count.l2.place-value-sum' : 'math.count.l1.numbers-100'] : ['math.count.l1.compare-100']),
  // «чому так» — за 💡 після відповіді
  explain: (round) => {
    const p = round.payload;
    if (p.mode === 'build') {
      const t = Math.floor(p.n / 10), o = p.n % 10;
      return { steps: [`${t} ${t === 1 ? 'десяток' : t < 5 ? 'десятки' : 'десятків'} і ${o} ${o === 1 ? 'одиниця' : o >= 2 && o <= 4 ? 'одиниці' : 'одиниць'}.`, `${t * 10} + ${o} = ${p.n}.`], why: 'Спершу пишемо десятки, потім одиниці: 4 десятки і 7 одиниць — 47, а не 74.' };
    }
    if (p.mode === 'part') return { steps: [`У числі ${p.n}: ${Math.floor(p.n / 10)} — десятки, ${p.n % 10} — одиниці.`, 'Ліва цифра — десятки, права — одиниці.'] };
    if (p.mode === 'split') return { steps: [`${p.n} = ${p.n - (p.n % 10)} + ${p.n % 10}`, `${Math.floor(p.n / 10)} десятки — це ${p.n - (p.n % 10)}, а ${p.n % 10} — одиниці.`] };
    const [ta, tb] = [Math.floor(p.a / 10), Math.floor(p.b / 10)];
    return ta !== tb
      ? { steps: [`Порівнюємо десятки: ${ta} і ${tb}.`, `Більше десятків — більше число: ${Math.max(p.a, p.b)}.`] }
      : { steps: [`Десятків порівну (${ta}) — дивимось на одиниці: ${p.a % 10} і ${p.b % 10}.`, `Більше число: ${Math.max(p.a, p.b)}.`] };
  },
  generate,
  Component,
};

export default tensOnes;
