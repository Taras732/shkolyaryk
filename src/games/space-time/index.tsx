import { useState } from 'react';
import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Простір і довжина» (11.10.2026) — 1 клас, програма Савченко [1 МАО 4.4], [1 МАО 4.7]:
 *  d1 — полиця 3×3: що над / під / ліворуч / праворуч / між;
 *  d2 — три стрічки зі зсувом: яка найдовша / найкоротша; «Наклади» вирівнює їх зліва
 *       (порівняння накладанням). Найдальший кінець навмисно НЕ в найдовшої — пастка «на око»;
 *  d3 — час: вчора / сьогодні / завтра, дні тижня, частини доби.
 */

export const ITEMS = [
  { e: '⚽', ins: 'мʼячем', gen: 'мʼяча' }, { e: '🍎', ins: 'яблуком', gen: 'яблука' }, { e: '🧸', ins: 'ведмедиком', gen: 'ведмедика' },
  { e: '🚗', ins: 'машинкою', gen: 'машинки' }, { e: '📚', ins: 'книжками', gen: 'книжок' }, { e: '🎈', ins: 'кулькою', gen: 'кульки' },
  { e: '🧩', ins: 'пазлом', gen: 'пазла' }, { e: '🎲', ins: 'кубиком', gen: 'кубика' }, { e: '🎁', ins: 'подарунком', gen: 'подарунка' },
];
export const DAYS = ['понеділок', 'вівторок', 'середа', 'четвер', 'пʼятниця', 'субота', 'неділя'];
const PARTS = ['ранок', 'день', 'вечір', 'ніч'];
const PARTS_AFTER = ['ранку', 'дня', 'вечора', 'ночі'];
const RIBBONS = [{ c: '#EF4444', name: 'червона' }, { c: '#3B82F6', name: 'синя' }, { c: '#22C55E', name: 'зелена' }];

type Rel = 'над' | 'під' | 'ліворуч від' | 'праворуч від' | 'між';
type Payload =
  | { mode: 'shelf'; grid: string[]; rel: Rel; a: string; b?: string; options: string[] }
  | { mode: 'ribbon'; lens: number[]; offs: number[]; longest: boolean }
  | { mode: 'days'; today: number; tomorrow: boolean; options: string[] }
  | { mode: 'parts'; part: number; options: string[] };
type Answer = string;

const ROUNDS = 5;
const randInt = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const item = (e: string) => ITEMS.find((x) => x.e === e)!;

function shelfRound(): Omit<Round<Payload, Answer>, 'id'> {
  const grid = shuffle(ITEMS).map((x) => x.e);
  const at = (r: number, c: number) => grid[r * 3 + c];
  const rel = shuffle<Rel>(['над', 'під', 'ліворуч від', 'праворуч від', 'між'])[0];
  let a: string, b: string | undefined, ans: string;
  if (rel === 'між') {
    const r = randInt(0, 2);
    [a, b, ans] = [at(r, 0), at(r, 2), at(r, 1)];
  } else {
    const r = rel === 'над' ? randInt(1, 2) : rel === 'під' ? randInt(0, 1) : randInt(0, 2);
    const c = rel === 'ліворуч від' ? randInt(1, 2) : rel === 'праворуч від' ? randInt(0, 1) : randInt(0, 2);
    a = at(r, c);
    ans = rel === 'над' ? at(r - 1, c) : rel === 'під' ? at(r + 1, c) : rel === 'ліворуч від' ? at(r, c - 1) : at(r, c + 1);
  }
  const options = shuffle([ans, ...shuffle(grid.filter((x) => x !== ans && x !== a && x !== b)).slice(0, 2)]);
  return { payload: { mode: 'shelf', grid, rel, a, b, options }, answer: ans };
}

/** Довжини 3 різні (у клітинках 3–9); зсуви підібрані так, щоб найдальший кінець був не в найдовшої. */
export function ribbonRound(longest = Math.random() < 0.6): Omit<Round<Payload, Answer>, 'id'> {
  for (;;) {
    const lens = shuffle([3, 4, 5, 6, 7, 8, 9]).slice(0, 3);
    const offs = lens.map(() => randInt(0, 4));
    const ends = lens.map((l, i) => l + offs[i]);
    const target = lens.indexOf(longest ? Math.max(...lens) : Math.min(...lens));
    const farthest = ends.indexOf(Math.max(...ends));
    if (Math.max(...ends) <= 12 && farthest !== target && new Set(ends).size === 3) {
      return { payload: { mode: 'ribbon', lens, offs, longest }, answer: RIBBONS[target].c };
    }
  }
}

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  let rs: Omit<Round<Payload, Answer>, 'id'>[];
  if (difficulty === 1) rs = Array.from({ length: ROUNDS }, shelfRound);
  else if (difficulty === 2) rs = Array.from({ length: ROUNDS }, () => ribbonRound());
  else {
    const days = Array.from({ length: 3 }, () => {
      const today = randInt(0, 6);
      const tomorrow = Math.random() < 0.5;
      const ans = DAYS[(today + (tomorrow ? 1 : 6)) % 7];
      const wrong = DAYS[(today + (tomorrow ? 6 : 1)) % 7]; // протилежний напрямок — типова плутанина
      const other = shuffle(DAYS.filter((d) => d !== ans && d !== wrong && d !== DAYS[today]))[0];
      return { payload: { mode: 'days' as const, today, tomorrow, options: shuffle([ans, wrong, other]) }, answer: ans };
    });
    const parts = Array.from({ length: 2 }, () => {
      const part = randInt(0, 3);
      const ans = PARTS[(part + 1) % 4];
      return { payload: { mode: 'parts' as const, part, options: shuffle(PARTS.filter((p) => p !== PARTS[part])) }, answer: ans };
    });
    rs = shuffle([...days, ...parts]);
  }
  return { difficulty, rounds: rs.map((r, i) => ({ ...r, id: `r${i}` })) };
}

// ---------- малюнки ----------

function Shelf({ grid }: { grid: string[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 56px)', gap: 0, background: '#D6A26B', padding: 6, borderRadius: 10 }}>
      {grid.map((e, i) => (
        <div key={i} style={{ height: 56, display: 'grid', placeItems: 'center', fontSize: 34, background: '#FDF2E3', borderBottom: '6px solid #B9814A', margin: 2 }}>{e}</div>
      ))}
    </div>
  );
}

const CELL = 24;
function Ribbons({ lens, offs, aligned }: { lens: number[]; offs: number[]; aligned: boolean }) {
  return (
    <div style={{ position: 'relative', width: 12 * CELL + 8, height: 3 * 34 }}>
      {lens.map((l, i) => (
        <div key={i} style={{ position: 'absolute', top: i * 34 + 6, left: (aligned ? 0 : offs[i]) * CELL + 4, width: l * CELL, height: 20, borderRadius: 10,
          background: RIBBONS[i].c, transition: 'left .6s ease', boxShadow: '0 2px 0 rgba(0,0,0,.15)' }} />
      ))}
    </div>
  );
}

// ---------- гра ----------

/** Ключ озвучки питання полиці (крім «між» — пар забагато, читає сама). */
export const shelfKey = (rel: Rel, a: string) => `q_shelf_${['над', 'під', 'ліворуч від', 'праворуч від'].indexOf(rel)}_${ITEMS.findIndex((x) => x.e === a)}`;
export const shelfText = (rel: Rel, a: string, b?: string) =>
  rel === 'між' ? `Що лежить між ${item(a).ins} і ${item(b!).ins}?`
    : rel === 'над' || rel === 'під' ? `Що лежить ${rel} ${item(a).ins}?`
    : `Що лежить ${rel} ${item(a).gen}?`;
export const dayText = (today: number, tomorrow: boolean) => `Сьогодні ${DAYS[today]}. ${tomorrow ? 'Який день буде завтра?' : 'Який день був учора?'}`;
export const partText = (part: number) => `Що буває після ${PARTS_AFTER[part]}?`;

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const [aligned, setAligned] = useState(false);

  if (p.mode === 'shelf') {
    const q = { key: shelfKey(p.rel, p.a), text: shelfText(p.rel, p.a, p.b) };
    const say = p.rel !== 'між' && hasUkAudio(q.key) ? () => sayUkSeq([q]) : undefined;
    return (
      <>
        <PromptCard question={q.text} answerState={answerState} say={say} sayKey={round.id}><Shelf grid={p.grid} /></PromptCard>
        <ChoiceGrid options={p.options.map((e) => ({ value: e, node: <span style={{ fontSize: 40 }}>{e}</span> }))} correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={3} />
      </>
    );
  }
  if (p.mode === 'ribbon') {
    const q = { key: p.longest ? 'p_rib_long' : 'p_rib_short', text: p.longest ? 'Яка стрічка найдовша?' : 'Яка стрічка найкоротша?' };
    const say = hasUkAudio(q.key) ? () => sayUkSeq([q]) : undefined;
    return (
      <>
        <PromptCard question={q.text} answerState={answerState} say={say} sayKey={round.id}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Ribbons lens={p.lens} offs={p.offs} aligned={aligned} />
            <button type="button" onClick={() => setAligned((a) => !a)}
              style={{ border: 0, borderRadius: 999, padding: '6px 14px', background: '#E0E7FF', color: '#3730A3', fontWeight: 800, cursor: 'pointer' }}>
              {aligned ? '↩ Як було' : '⇤ Наклади'}
            </button>
          </div>
        </PromptCard>
        <ChoiceGrid options={RIBBONS.map((r) => ({ value: r.c, node: <span aria-label={r.name} style={{ display: 'block', width: 44, height: 18, borderRadius: 9, background: r.c }} /> }))}
          correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={3} />
      </>
    );
  }
  const text = p.mode === 'days' ? dayText(p.today, p.tomorrow) : partText(p.part);
  const key = p.mode === 'days' ? `q_day_${p.today}_${p.tomorrow ? 1 : 0}` : `q_part_${p.part}`;
  const say = hasUkAudio(key) ? () => sayUkSeq([{ key, text }]) : undefined;
  return (
    <>
      <PromptCard question={text} answerState={answerState} say={say} sayKey={round.id} />
      <ChoiceGrid options={p.options.map((o) => ({ value: o }))} correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={p.mode === 'parts' ? 3 : 1} />
    </>
  );
}

const spaceTime: GameDefinition<Payload, Answer> = {
  id: 'space-time',
  title: 'Простір і довжина',
  subject: 'math',
  levels: ['L3'],
  icon: '🧭',
  description: 'Над, під, між; яка стрічка довша — наклади й побачиш; вчора, сьогодні, завтра.',
  accent: '#E0F2FE',
  skillsFor: (d) => [d === 2 ? 'math.measure.l1.length-compare' : 'math.measure.l1.space-time'],
  // «чому так» — за 💡 після відповіді
  explain: (round) => {
    const p = round.payload;
    if (p.mode === 'shelf') return { steps: [`${shelfText(p.rel, p.a, p.b).replace('Що лежить', '').replace('?', '')} — ${round.answer}.`.trim(), p.rel === 'над' ? 'Над — вище, на поличці зверху.' : p.rel === 'під' ? 'Під — нижче, на поличці знизу.' : p.rel === 'між' ? 'Між — посередині, з обох боків сусіди.' : 'Ліворуч — з боку лівої руки, праворуч — правої.'] };
    if (p.mode === 'ribbon') {
      const i = RIBBONS.findIndex((r) => r.c === round.answer);
      const n = p.lens[i];
      return { steps: [`${RIBBONS[i].name[0].toUpperCase()}${RIBBONS[i].name.slice(1)} — ${n} ${n <= 4 ? 'клітинки' : 'клітинок'}.`, 'Щоб порівняти довжину, кладемо стрічки від одного краю — накладаємо.'], why: 'Стрічка, що закінчується найдалі, не завжди найдовша: вона могла почати далі.' };
    }
    if (p.mode === 'days') return { steps: [DAYS.join(' → '), p.tomorrow ? 'Завтра — наступний день.' : 'Учора — попередній день.'] };
    return { steps: [PARTS.join(' → '), 'Після ночі знову ранок.'] };
  },
  generate,
  Component,
};

export default spaceTime;
