import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Числовий ряд» (11.10.2026) — 1 клас: лічба вперед і назад, сусідні числа, числовий промінь,
 * порядкова лічба, парні й непарні (програма Савченко [1 МАО 4.2] + підручник Гісь/Філяк).
 *  d1 — пропущене число: на промені 0–10 (вперед) або в ряду навпаки (лічба назад);
 *  d2 — котрий за рахунком: звірята в черзі до хатинки;
 *  d3 — парне чи непарне: фішки парами, одній бракує пари — непарне.
 * Фраза завдання — раз на гру (r0).
 */

/** Звірята черги: імʼя, рід (для «котрий / котра / котре» і порядкового числівника), ключ озвучки. */
type Gender = 'm' | 'f' | 'n';
export const ANIMALS: Record<string, { id: string; name: string; g: Gender }> = {
  '🐰': { id: 'bunny', name: 'зайчик', g: 'm' }, '🦊': { id: 'fox', name: 'лисичка', g: 'f' }, '🐻': { id: 'bear', name: 'ведмедик', g: 'm' },
  '🐸': { id: 'frog', name: 'жабка', g: 'f' }, '🐷': { id: 'pig', name: 'порося', g: 'n' }, '🐱': { id: 'cat', name: 'котик', g: 'm' },
  '🐶': { id: 'dog', name: 'песик', g: 'm' }, '🦔': { id: 'hedgehog', name: 'їжачок', g: 'm' }, '🐭': { id: 'mouse', name: 'мишка', g: 'f' },
};
const EMOJIS = Object.keys(ANIMALS);
const WHICH: Record<Gender, string> = { m: 'Котрий', f: 'Котра', n: 'Котре' };
const ORD: Record<Gender, string[]> = {
  m: ['перший', 'другий', 'третій', 'четвертий', 'пʼятий', 'шостий'],
  f: ['перша', 'друга', 'третя', 'четверта', 'пʼята', 'шоста'],
  n: ['перше', 'друге', 'третє', 'четверте', 'пʼяте', 'шосте'],
};
/** Закінчення скороченого порядкового числа: 4-й, 4-а, 4-е (третій: 3-й, 3-я, 3-є). */
const ordEnd = (n: number, g: Gender) => (g === 'm' ? '-й' : g === 'f' ? (n === 3 ? '-я' : '-а') : n === 3 ? '-є' : '-е');
export const orderQuestion = (emoji: string) => {
  const a = ANIMALS[emoji];
  return `${WHICH[a.g]} за рахунком ${a.name}?`;
};

type Payload =
  | { mode: 'gap'; start: number; dir: 1 | -1; hole: number; options: number[] }
  | { mode: 'order'; row: string[]; target: string; options: number[] }
  | { mode: 'parity'; n: number; options: string[] };
type Answer = number | string;

const ROUNDS = 5;
const randInt = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

/** Ряд із 5 чисел: вперед — start, start+1…; назад — start, start−1… */
export const seq = (p: { start: number; dir: 1 | -1 }) => Array.from({ length: 5 }, (_, i) => p.start + i * p.dir);

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  let rounds: Round<Payload, Answer>[];
  if (difficulty === 1) {
    // 3 вперед (промінь), 2 назад; дірка — і на краю (сусід «перед/після»), і всередині
    const dirs = shuffle<1 | -1>([1, 1, 1, -1, -1]);
    rounds = dirs.map((dir, i) => {
      const start = dir === 1 ? randInt(0, 6) : randInt(4, 10);
      const hole = randInt(0, 4);
      const answer = seq({ start, dir })[hole];
      const options = shuffle([answer, ...shuffle([answer - 1, answer + 1, answer + 2, answer - 2].filter((n) => n >= 0 && n <= 10)).slice(0, 2)]);
      return { id: `r${i}`, payload: { mode: 'gap', start, dir, hole, options }, answer };
    });
  } else if (difficulty === 2) {
    rounds = Array.from({ length: ROUNDS }, (_, i) => {
      // 6 звірят — більше не вміщається в картку на телефоні; відповідь — номер місця (1–6), цифрою
      const row = shuffle(EMOJIS).slice(0, 6);
      const k = randInt(1, 6);
      const options = shuffle([k, ...shuffle([k - 1, k + 1, k + 2, k - 2].filter((x) => x >= 1 && x <= 6)).slice(0, 2)]);
      return { id: `r${i}`, payload: { mode: 'order', row, target: row[k - 1], options }, answer: k };
    });
  } else {
    const ns = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, ROUNDS);
    rounds = ns.map((n, i) => ({ id: `r${i}`, payload: { mode: 'parity', n, options: ['парне', 'непарне'] }, answer: n % 2 === 0 ? 'парне' : 'непарне' }));
  }
  return { difficulty, rounds };
}

// ---------- малюнки ----------

const INK = 'var(--c-ink)';

/** Числовий промінь 0–10: позначки з числами, ряд підсвічено, на дірці — «?». */
function Ray({ nums, hole }: { nums: number[]; hole: number }) {
  const S = 26;
  const X = (n: number) => 14 + n * S;
  return (
    <svg viewBox={`0 0 ${X(10) + 30} 64`} style={{ width: 320, maxWidth: '100%' }} aria-hidden>
      <line x1={X(0)} y1={22} x2={X(10) + 22} y2={22} stroke={INK} strokeWidth={3} />
      <polygon points={`${X(10) + 28},22 ${X(10) + 18},16 ${X(10) + 18},28`} fill={INK} />
      {Array.from({ length: 11 }, (_, n) => {
        const k = nums.indexOf(n);
        const lit = k >= 0;
        return (
          <g key={n}>
            <line x1={X(n)} y1={14} x2={X(n)} y2={30} stroke={INK} strokeWidth={lit ? 3 : 1.5} />
            <text x={X(n)} y={52} fontSize={lit ? 20 : 14} fontWeight={lit ? 900 : 600} textAnchor="middle" fill={k === hole ? 'var(--c-primary)' : lit ? INK : '#A3A8B8'}>
              {k === hole ? '?' : n}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Cards({ nums, hole }: { nums: number[]; hole: number }) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', fontFamily: 'var(--font-round)' }}>
      {nums.map((n, i) => (
        <span key={i} style={{ width: 46, height: 52, borderRadius: 14, display: 'grid', placeItems: 'center', fontSize: 26, fontWeight: 900,
          background: i === hole ? 'transparent' : '#fff', border: i === hole ? '3px dashed var(--c-primary)' : '0', boxShadow: i === hole ? 'none' : '0 3px 0 #EED9BF',
          color: i === hole ? 'var(--c-primary)' : INK }}>{i === hole ? '?' : n}</span>
      ))}
    </div>
  );
}

function Queue({ row }: { row: string[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 2 }}>
      <span style={{ fontSize: 32 }}>🏠</span>
      {row.map((a, i) => <span key={i} style={{ fontSize: 25 }}>{a}</span>)}
    </div>
  );
}

/** Фішки парами (стовпчиками по дві); непарна — остання сама. */
function Pairs({ n }: { n: number }) {
  const cols = Math.ceil(n / 2);
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {Array.from({ length: cols }, (_, c) => (
        <div key={c} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[0, 1].map((r) => {
            const on = c * 2 + r < n;
            return <span key={r} style={{ width: 28, height: 28, borderRadius: 14, background: on ? '#3B82F6' : 'transparent', border: on ? '0' : '2px dashed #C9CDD8' }} />;
          })}
        </div>
      ))}
    </div>
  );
}

// ---------- гра ----------

const PHRASES = {
  gap: { key: 'p_nl_gap', text: 'Яке число пропущено?' },
  order: { key: 'p_nl_order', text: 'Котрий за рахунком?' },
  parity: { key: 'p_nl_parity', text: 'Парне чи непарне?' },
} as const;

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = PHRASES[p.mode];
  // «котрий за рахунком» звучить щоразу повністю — звірятко щоразу інше, без імені питання незрозуміле
  const orderQ = p.mode === 'order' ? { key: `q_order_${ANIMALS[p.target].id}`, text: orderQuestion(p.target) } : null;
  const say = orderQ
    ? (hasUkAudio(orderQ.key) ? () => sayUkSeq([orderQ]) : undefined)
    : hasUkAudio(phrase.key) ? (again?: boolean) => (round.id === 'r0' || again ? sayUkSeq([phrase]) : undefined) : undefined;

  if (p.mode === 'gap') {
    const nums = seq(p);
    return (
      <>
        <PromptCard question={p.dir === 1 ? phrase.text : `${phrase.text} Лічимо назад.`} answerState={answerState} say={say} sayKey={round.id}>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
            {p.dir === 1 ? <Ray nums={nums} hole={p.hole} /> : <Cards nums={nums} hole={p.hole} />}
          </div>
        </PromptCard>
        <ChoiceGrid options={p.options.map((n) => ({ value: n }))} correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={3} />
      </>
    );
  }

  if (p.mode === 'order') {
    return (
      <>
        <PromptCard question={`${orderQuestion(p.target)} ${p.target} Рахуй від хатинки.`} answerState={answerState} say={say} sayKey={round.id}>
          <Queue row={p.row} />
        </PromptCard>
        <ChoiceGrid options={p.options.map((n) => ({ value: n, node: <span>{n}<small style={{ fontSize: '0.5em' }}>{ordEnd(n, ANIMALS[p.target].g)}</small></span> }))}
          correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={3} />
      </>
    );
  }

  return (
    <>
      <PromptCard question={`${p.n} — ${phrase.text.toLowerCase()}`} answerState={answerState} say={say} sayKey={round.id}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <span style={{ fontSize: 48, fontWeight: 900, color: 'var(--c-primary)' }}>{p.n}</span>
          <Pairs n={p.n} />
        </div>
      </PromptCard>
      <ChoiceGrid options={p.options.map((o) => ({ value: o }))} correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={2} />
    </>
  );
}

const numberLine: GameDefinition<Payload, Answer> = {
  id: 'number-line',
  title: 'Числовий ряд',
  subject: 'math',
  levels: ['L3'],
  icon: '🔢',
  description: 'Пропущене число на промені, котрий за рахунком, парне чи непарне.',
  accent: '#DCFCE7',
  skillsFor: (d) => (d === 1 ? ['math.count.l1.forward-back-1-10', 'math.count.l1.neighbors', 'math.count.l1.number-line'] : d === 2 ? ['math.count.l1.ordinal-1-10'] : ['math.count.l1.even-odd']),
  // «чому так» — за 💡 після відповіді
  explain: (round) => {
    const p = round.payload;
    if (p.mode === 'gap') {
      const nums = seq(p);
      return p.dir === 1
        ? { steps: [nums.join(', '), 'На промені кожне наступне число — на 1 більше.'] }
        : { steps: [nums.join(', '), 'Лічимо назад: кожне наступне — на 1 менше.'] };
    }
    if (p.mode === 'order') {
      const k = p.row.indexOf(p.target);
      const a = ANIMALS[p.target];
      return { steps: [`Від хатинки: ${p.row.slice(0, k + 1).map((e, i) => `${ORD[ANIMALS[e].g][i]} ${e}`).join(', ')}.`, `${a.name[0].toUpperCase()}${a.name.slice(1)} — ${ORD[a.g][k]}.`] };
    }
    return p.n % 2 === 0
      ? { steps: [`${p.n} фішок стали парами — кожна має пару.`, `${p.n} — парне.`] }
      : { steps: [`${p.n} фішок: одна лишилась без пари.`, `${p.n} — непарне.`] };
  },
  generate,
  Component,
};

export default numberLine;
