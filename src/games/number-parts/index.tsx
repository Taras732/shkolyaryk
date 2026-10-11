import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Склад числа» (11.10.2026) — числа 2–10 з двох частин, 1 клас (програма Савченко [1 МАО 4.2], [1 МАО 4.8]).
 * Від предметів до числа:
 *  d1 — «Скільки сховалось?»: рамка на 10, частина фішок видна, решта під хмаркою;
 *  d2 — «Що разом дає N?»: знайти пару серед виразів;
 *  d3 — «Яке число пропущено?»: N = a + □ без картинки (невідомий доданок).
 * Числа в раундах ростуть; фраза завдання — раз на гру (r0), далі лише число.
 */

type Payload =
  | { mode: 'hidden'; total: number; seen: number; options: number[] }
  | { mode: 'pair'; total: number; options: string[] }
  | { mode: 'missing'; total: number; seen: number; options: number[] };
type Answer = number | string;

const ROUNDS = 5;
const randInt = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

/** Загальні числа раундів: від менших до більших, без повторів підряд. */
function totals(): number[] {
  const lo = shuffle([3, 4, 5, 6]).slice(0, 2);
  const hi = shuffle([7, 8, 9, 10]).slice(0, ROUNDS - 2);
  return [...lo.sort((a, b) => a - b), ...hi.sort((a, b) => a - b)];
}

function numberOptions(answer: number, max: number): number[] {
  const near = shuffle([answer - 1, answer + 1, answer - 2, answer + 2].filter((n) => n >= 0 && n <= max));
  return shuffle([answer, ...near.slice(0, 2)]);
}

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const rounds: Round<Payload, Answer>[] = totals().map((total, i) => {
    const seen = randInt(1, total - 1);
    const hidden = total - seen;
    if (difficulty === 2) {
      const right = `${seen} + ${hidden}`;
      // хибні пари: сума на 1 більша або менша
      const wrong = shuffle([
        `${seen} + ${hidden + 1}`,
        `${Math.max(1, seen - 1)} + ${hidden}`,
        `${seen + 1} + ${hidden}`,
        `${seen} + ${Math.max(1, hidden - 1)}`,
      ].filter((w) => w !== right && eval2(w) !== total));
      return { id: `r${i}`, payload: { mode: 'pair', total, options: shuffle([right, ...[...new Set(wrong)].slice(0, 2)]) }, answer: right };
    }
    const mode = difficulty === 1 ? 'hidden' : 'missing';
    return { id: `r${i}`, payload: { mode, total, seen, options: numberOptions(hidden, total) }, answer: hidden };
  });
  return { difficulty, rounds };
}

function eval2(expr: string): number {
  const [a, b] = expr.split(' + ').map(Number);
  return a + b;
}

// ---------- малюнок: рамка на 10 ----------

const CELL = 44;

function TenFrame({ total, seen }: { total: number; seen: number }) {
  const cells = Array.from({ length: 10 }, (_, i) => i);
  return (
    <svg viewBox={`0 0 ${5 * CELL + 8} ${2 * CELL + 8}`} style={{ width: '100%', maxWidth: 300 }} aria-hidden>
      {cells.map((i) => {
        const x = 4 + (i % 5) * CELL;
        const y = 4 + Math.floor(i / 5) * CELL;
        return (
          <g key={i}>
            <rect x={x} y={y} width={CELL} height={CELL} fill="#fff" stroke="#C9CDD8" strokeWidth={2} />
            {i < seen && <circle cx={x + CELL / 2} cy={y + CELL / 2} r={15} fill="#EF4444" />}
          </g>
        );
      })}
      {/* хмарка накриває ВСЮ решту рамки: скільки під нею — видно лише з числа, перелічити клітинки не вийде */}
      {total > seen && <HiddenCloud seen={seen} />}
    </svg>
  );
}

/** Хмарка накриває клітинки від seen до кінця рамки (10). */
function HiddenCloud({ seen }: { seen: number }) {
  const rows: { x: number; y: number; w: number }[] = [];
  for (const row of [0, 1]) {
    const from = Math.max(seen, row * 5);
    const to = row * 5 + 5;
    if (to > from) rows.push({ x: 4 + (from % 5) * CELL, y: 4 + row * CELL, w: (to - from) * CELL });
  }
  return (
    <g>
      {rows.map((r, i) => (
        <rect key={i} x={r.x + 2} y={r.y + 2} width={r.w - 4} height={CELL - 4} rx={18} fill="#CBD5E1" />
      ))}
      {rows[0] && <text x={rows[0].x + rows[0].w / 2} y={rows[0].y + CELL / 2 + 8} textAnchor="middle" fontSize={24} fontWeight={900} fill="#64748B">?</text>}
    </g>
  );
}

// ---------- гра ----------

const numKey = (n: number) => (n === 10 ? 'n_10' : `d_${n}`);
const NUM_TEXT = ['нуль', 'один', 'два', 'три', 'чотири', 'пʼять', 'шість', 'сім', 'вісім', 'девʼять', 'десять'];

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const first = round.id === 'r0';
  const num = { key: numKey(p.total), text: NUM_TEXT[p.total] };

  if (p.mode === 'hidden') {
    const phrase = { key: 'p_parts_hidden', text: 'Скільки сховалось?' };
    const say = hasUkAudio(phrase.key) ? (again?: boolean) => (first || again ? sayUkSeq([phrase]) : undefined) : undefined;
    return (
      <>
        <PromptCard question={`Усього ${p.total}. Скільки сховалось?`} answerState={answerState} say={say} sayKey={round.id}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginTop: 8 }}>
            <span style={{ fontSize: 44, fontWeight: 900, color: 'var(--c-primary)' }}>{p.total}</span>
            <TenFrame total={p.total} seen={p.seen} />
          </div>
        </PromptCard>
        <ChoiceGrid options={p.options.map((n) => ({ value: n }))} correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={3} />
      </>
    );
  }

  if (p.mode === 'pair') {
    const phrase = { key: 'p_parts_pair', text: 'Що разом дає' };
    const say = hasUkAudio(num.key) ? (again?: boolean) => sayUkSeq(again || !first ? [num] : [phrase, num]) : undefined;
    return (
      <>
        <PromptCard question={`Що разом дає ${p.total}?`} answerState={answerState} say={say} sayKey={round.id}>
          <div style={{ fontSize: 56, fontWeight: 900, color: 'var(--c-primary)', textAlign: 'center' }}>{p.total}</div>
        </PromptCard>
        <ChoiceGrid options={p.options.map((o) => ({ value: o }))} correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={3} />
      </>
    );
  }

  const phrase = { key: 'p_parts_missing', text: 'Яке число пропущено?' };
  const say = hasUkAudio(phrase.key) ? (again?: boolean) => (first || again ? sayUkSeq([phrase]) : undefined) : undefined;
  return (
    <>
      <PromptCard question="Яке число пропущено?" answerState={answerState} say={say} sayKey={round.id}>
        <div style={{ fontSize: 48, fontWeight: 900, textAlign: 'center', letterSpacing: 2 }}>
          {p.total} = {p.seen} + <span style={{ display: 'inline-block', minWidth: 54, borderBottom: '4px solid var(--c-primary)', color: answerState === 'correct' ? '#16A34A' : 'transparent' }}>{p.total - p.seen}</span>
        </div>
      </PromptCard>
      <ChoiceGrid options={p.options.map((n) => ({ value: n }))} correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={3} />
    </>
  );
}

const numberParts: GameDefinition<Payload, Answer> = {
  id: 'number-parts',
  title: 'Склад числа',
  subject: 'math',
  levels: ['L3'],
  icon: '🧮',
  description: 'Числа 2–10 з двох частин: скільки сховалось, яка пара, яке число пропущено.',
  accent: '#FEE2E2',
  skillsFor: (d) => (d === 3 ? ['math.count.l1.compose-10', 'math.ops.l1.unknown-addend'] : ['math.count.l1.compose-10']),
  // 11.10: «чому так» — за 💡 після відповіді
  explain: (round) => {
    const p = round.payload;
    if (p.mode === 'pair') return { steps: [`${round.answer} = ${p.total}.`, `${String(round.answer).replace(' + ', ' і ще ')} — це ${p.total}.`] };
    const h = p.total - p.seen;
    if (p.mode === 'hidden') return { steps: [`Усього ${p.total}, видно ${p.seen}.`, `${p.total} − ${p.seen} = ${h}, отже сховалось ${h}.`, `Перевір: ${p.seen} + ${h} = ${p.total}.`] };
    return { steps: [`${p.total} = ${p.seen} + ${h}`, `${p.seen} і ще ${h} — це ${p.total}.`] };
  },
  generate,
  Component,
};

export default numberParts;
