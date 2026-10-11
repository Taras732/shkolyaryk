import { useState } from 'react';
import type { GameDefinition, GameComponentProps, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Склади задачу» (11.10.2026) — 1 клас, програма Савченко [1 МАО 1.2] «складає прості сюжетні задачі»:
 *  d1 — яке питання підходить до історії (стало / лишилось / про інше);
 *  d2 — яка історія підходить до виразу «5 − 2» (пастки: та сама пара з іншою дією; інші числа);
 *  d3 — збери задачу до малюнка з трьох частин: скільки було · що сталося · що питаємо.
 */

/** Предмет історії: місце, хто додає / що забирає, форми іменника за числом (1 · 2–4 · 5+ / родовий мн.). */
export const THINGS = [
  { e: '🍎', place: 'У кошику', add: 'Мама поклала ще', sub: 'Діти зʼїли', f: ['яблуко', 'яблука', 'яблук'] },
  { e: '🐦', place: 'На гілці', add: 'Прилетіли ще', sub: 'Полетіли', f: ['пташка', 'пташки', 'пташок'] },
  { e: '🎈', place: 'В Олі', add: 'Тато купив ще', sub: 'Лопнули', f: ['кулька', 'кульки', 'кульок'] },
  { e: '🍬', place: 'У вазі', add: 'Бабуся поклала ще', sub: 'Діти зʼїли', f: ['цукерка', 'цукерки', 'цукерок'] },
  { e: '🐟', place: 'В акваріумі', add: 'Купили ще', sub: 'Віддали сусідам', f: ['рибка', 'рибки', 'рибок'] },
];
type Thing = (typeof THINGS)[number];

/** Форма іменника для числа: 1 — яблуко, 2–4 — яблука, 0 і 5+ — яблук (у межах 10 цього досить). */
export const noun = (t: Thing, n: number) => (n === 1 ? t.f[0] : n >= 2 && n <= 4 ? t.f[1] : t.f[2]);
const was = (t: Thing, n: number) => `${t.place} було ${n} ${noun(t, n)}.`;
const act = (t: Thing, op: '+' | '−', b: number) => `${op === '+' ? t.add : t.sub} ${b} ${noun(t, b)}.`;
const ask = (t: Thing, op: '+' | '−') => `Скільки ${t.f[2]} ${op === '+' ? 'стало' : 'лишилось'}?`;
export const story = (t: Thing, a: number, op: '+' | '−', b: number) => `${was(t, a)} ${act(t, op, b)}`;

type Payload =
  | { mode: 'question'; e: string; a: number; op: '+' | '−'; b: number; text: string; options: string[] }
  | { mode: 'story'; expr: string; options: string[] }
  | { mode: 'build'; e: string; a: number; op: '+' | '−'; b: number; slots: string[][] };
type Answer = string;

const ROUNDS = 5;
const randInt = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

/** Пара в межах 10: для + сума ≤ 10, для − від більшого. */
function pair(op: '+' | '−'): [number, number] {
  if (op === '+') { const a = randInt(2, 7); return [a, randInt(1, 10 - a)]; }
  const a = randInt(3, 9); return [a, randInt(1, a - 1)];
}

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const rounds = Array.from({ length: ROUNDS }, (_, i) => {
    const t = THINGS[randInt(0, THINGS.length - 1)];
    const op = Math.random() < 0.5 ? '+' as const : '−' as const;
    const [a, b] = pair(op);
    if (difficulty === 1) {
      const other = THINGS.find((x) => x !== t)!;
      const options = shuffle([ask(t, op), ask(t, op === '+' ? '−' : '+'), ask(other, op)]);
      return { id: `r${i}`, payload: { mode: 'question' as const, e: t.e, a, op, b, text: story(t, a, op, b), options }, answer: ask(t, op) };
    }
    if (difficulty === 2) {
      const right = `${story(t, a, op, b)} ${ask(t, op)}`;
      const flip = op === '−' ? `${story(t, a, '+', b)} ${ask(t, '+')}` : `${story(t, a + b, '−', b)} ${ask(t, '−')}`;
      const [a2, b2] = op === '+' ? [Math.min(9, a + 1), b] : [a, Math.max(1, b === 1 ? 2 : b - 1)];
      const nums = `${story(t, a2, op, b2)} ${ask(t, op)}`;
      return { id: `r${i}`, payload: { mode: 'story' as const, expr: `${a} ${op} ${b}`, options: shuffle([...new Set([right, flip, nums])]) }, answer: right };
    }
    // d3: три частини, у кожній — правильна й хибна
    const wrongA = a + (a <= 2 ? 1 : -1);
    const slots = [shuffle([was(t, a), was(t, wrongA)]), shuffle([act(t, op, b), act(t, op === '+' ? '−' : '+', b)]), shuffle([ask(t, op), ask(t, op === '+' ? '−' : '+')])];
    return { id: `r${i}`, payload: { mode: 'build' as const, e: t.e, a, op, b, slots }, answer: [was(t, a), act(t, op, b), ask(t, op)].join(' ') };
  });
  return { difficulty, rounds };
}

/** Малюнок: було a предметів, потім +b (нові підсвічені) або −b (закреслені). */
function Picture({ e, a, op, b }: { e: string; a: number; op: '+' | '−'; b: number }) {
  const total = op === '+' ? a + b : a;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', maxWidth: 280, fontSize: 30 }}>
      {Array.from({ length: total }, (_, k) => {
        const added = op === '+' && k >= a;
        const gone = op === '−' && k >= a - b;
        return (
          <span key={k} style={{ position: 'relative', opacity: gone ? 0.35 : 1, borderRadius: 10, background: added ? '#DCFCE7' : undefined }}>
            {e}
            {gone && <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#DC2626', fontWeight: 900 }}>✕</span>}
          </span>
        );
      })}
    </div>
  );
}

const PHRASES = {
  question: { key: 'p_mp_question', text: 'Яке питання підходить?' },
  story: { key: 'p_mp_story', text: 'Яка задача до виразу?' },
  build: { key: 'p_mp_build', text: 'Склади задачу до малюнка.' },
} as const;

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = PHRASES[p.mode];
  const say = hasUkAudio(phrase.key) ? (again?: boolean) => (round.id === 'r0' || again ? sayUkSeq([phrase]) : undefined) : undefined;
  const [picked, setPicked] = useState<string[]>([]);

  if (p.mode === 'question') {
    return (
      <>
        <PromptCard question={phrase.text} answerState={answerState} say={say} sayKey={round.id}>
          <Picture e={p.e} a={p.a} op={p.op} b={p.b} />
          <div style={{ fontSize: 18, fontWeight: 700, textAlign: 'center', marginTop: 8 }}>{p.text}</div>
        </PromptCard>
        <ChoiceGrid options={p.options.map((o) => ({ value: o, node: <span style={{ fontSize: 16, fontWeight: 800 }}>{o}</span> }))} correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={1} />
      </>
    );
  }
  if (p.mode === 'story') {
    return (
      <>
        <PromptCard question={phrase.text} answerState={answerState} say={say} sayKey={round.id}>
          <div style={{ fontSize: 44, fontWeight: 900, textAlign: 'center' }}>{p.expr}</div>
        </PromptCard>
        <ChoiceGrid options={p.options.map((o) => ({ value: o, node: <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{o}</span> }))} correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={1} />
      </>
    );
  }
  // build: частина за частиною; зібрано — відповідь цілим реченням
  const step = picked.length;
  const choose = (s: string) => {
    if (disabled) return;
    const nx = [...picked, s];
    if (nx.length === p.slots.length) { onAnswer(nx.join(' ')); setPicked([]); } else setPicked(nx);
  };
  return (
    <>
      <PromptCard question={phrase.text} answerState={answerState} say={say} sayKey={round.id}>
        <Picture e={p.e} a={p.a} op={p.op} b={p.b} />
        <div style={{ fontSize: 17, fontWeight: 700, textAlign: 'center', marginTop: 8, minHeight: 24 }}>{picked.join(' ') || '…'}</div>
      </PromptCard>
      <div style={{ textAlign: 'center', fontWeight: 800, color: 'var(--c-mut)', marginBottom: 6 }}>
        {['1. Скільки було?', '2. Що сталося?', '3. Що питаємо?'][Math.min(step, 2)]}
      </div>
      <ChoiceGrid key={step} options={p.slots[Math.min(step, 2)].map((o) => ({ value: o, node: <span style={{ fontSize: 16, fontWeight: 800 }}>{o}</span> }))}
        correct={round.answer} disabled={disabled} answerState="idle" onPick={choose} columns={1} />
    </>
  );
}

const makeProblem: GameDefinition<Payload, Answer> = {
  id: 'make-problem',
  title: 'Склади задачу',
  subject: 'math',
  levels: ['L3'],
  icon: '📝',
  description: 'Питання до історії, історія до виразу, задача до малюнка.',
  accent: '#FFEDD5',
  skillsFor: (d) => (d === 1 ? ['math.ops.l1.word-problems-simple', 'math.ops.l1.compose-problems'] : ['math.ops.l1.compose-problems']),
  // «чому так» — за 💡 після відповіді
  explain: (round) => {
    const p = round.payload;
    if (p.mode === 'story') return { steps: [String(round.answer), p.expr.includes('+') ? 'Плюс — щось додали, питаємо, скільки стало.' : 'Мінус — щось забрали, питаємо, скільки лишилось.'] };
    const op = p.op;
    return { steps: [String(round.answer), op === '+' ? 'Додали — питаємо, скільки стало.' : 'Забрали — питаємо, скільки лишилось.'], why: 'Питання задачі має бути про те саме, про що історія.' };
  },
  generate,
  Component,
};

export default makeProblem;
