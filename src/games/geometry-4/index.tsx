import type { ReactNode } from 'react';
import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle, randInt } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Геометрія 4» (11.10.2026) — 4 клас:
 *  d1 — кути: прямий, гострий, тупий (на SVG);
 *  d2 — вісь симетрії, геометричні тіла;
 *  d3 — сторона квадрата за периметром, сторона прямокутника за площею, прямокутник на клітинках.
 */

function pick3(ans: number, cands: number[]): number[] {
  const out: number[] = [];
  const ok = (c: number) => Number.isInteger(c) && c > 0 && c !== ans && !out.includes(c);
  for (const c of shuffle(cands)) if (ok(c) && out.length < 3) out.push(c);
  for (const k of [1, 2, 3, 4]) for (const c of [ans + k, ans - k]) if (out.length < 3 && ok(c)) out.push(c);
  return out;
}

// ---------- кути ----------
export type AngleKind = 'прямий' | 'гострий' | 'тупий';
export const angleKind = (theta: number): AngleKind => (theta === 90 ? 'прямий' : theta < 90 ? 'гострий' : 'тупий');
const ANGLE_KINDS: AngleKind[] = ['прямий', 'гострий', 'тупий'];
const thetaOf = (k: AngleKind) => (k === 'прямий' ? 90 : k === 'гострий' ? randInt(20, 60) : randInt(120, 160));

interface Ang { theta: number; rot: number }
const mkAngle = (k: AngleKind): Ang => ({ theta: thetaOf(k), rot: randInt(0, 359) });

function AngleSvg({ a, size = 160, label }: { a: Ang; size?: number; label?: string }) {
  const cx = 80, cy = 60, len = 50, r = 16;
  const pt = (deg: number, l: number) => [cx + l * Math.cos((deg * Math.PI) / 180), cy + l * Math.sin((deg * Math.PI) / 180)];
  const [x1, y1] = pt(a.rot, len);
  const [x2, y2] = pt(a.rot + a.theta, len);
  const [ax1, ay1] = pt(a.rot, r);
  const [ax2, ay2] = pt(a.rot + a.theta, r);
  return (
    <svg viewBox="0 0 160 120" width={size} height={(size * 120) / 160} role="img" aria-label="кут" style={{ display: 'block', margin: '0 auto' }}>
      {/* прямий кут — шкільним квадратиком, не дугою: дуга під поворотом читається як тупий */}
      {a.theta === 90
        ? (() => { const s = 12; const [px, py] = pt(a.rot, s); const [qx, qy] = pt(a.rot + 90, s); return <path d={`M${px},${py} L${px + qx - cx},${py + qy - cy} L${qx},${qy}`} fill="none" stroke="#F59E0B" strokeWidth={3} />; })()
        : <path d={`M${ax1},${ay1} A${r},${r} 0 0 1 ${ax2},${ay2}`} fill="none" stroke="#F59E0B" strokeWidth={3} />}
      <line x1={cx} y1={cy} x2={x1} y2={y1} stroke="#1E293B" strokeWidth={4} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="#1E293B" strokeWidth={4} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={4} fill="#1E293B" />
      {label && <text x={8} y={20} fontSize={20} fontWeight={800} fill="#475569">{label}</text>}
    </svg>
  );
}

// ---------- симетрія ----------
const sv = (children: ReactNode) => (
  <svg viewBox="0 0 160 120" width={160} height={120} role="img" aria-label="фігура" style={{ display: 'block', margin: '0 auto' }}>{children}</svg>
);
const stroke = { stroke: '#1E293B', strokeWidth: 3, fill: '#BFDBFE', strokeLinejoin: 'round' as const };
const letter = (ch: string) => sv(<text x={80} y={98} fontSize={96} fontWeight={800} textAnchor="middle" fill="#1E293B" fontFamily="Arial, sans-serif">{ch}</text>);
const HEART = 'M80,105 C20,65 25,20 55,20 C70,20 78,30 80,38 C82,30 90,20 105,20 C135,20 140,65 80,105 Z';

export interface SymItem { name: string; has: boolean; svg: ReactNode; why: string }
export const SYM_ITEMS: SymItem[] = [
  { name: 'квадрат', has: true, svg: sv(<rect x={40} y={20} width={80} height={80} {...stroke} />), why: 'Якщо скласти квадрат навпіл, половини збігаються.' },
  { name: 'рівнобедрений трикутник', has: true, svg: sv(<polygon points="80,15 35,100 125,100" {...stroke} />), why: 'Якщо скласти навпіл від вершини до основи, половини збігаються.' },
  { name: 'серце', has: true, svg: sv(<path d={HEART} {...stroke} fill="#FECACA" />), why: 'Ліва й права половинки серця однакові.' },
  { name: 'буква Ж', has: true, svg: letter('Ж'), why: 'Якщо скласти Ж по вертикалі, половини збігаються.' },
  { name: 'буква Р', has: false, svg: letter('Р'), why: 'Букву Р не скласти так, щоб половини збіглися.' },
  { name: 'буква Б', has: false, svg: letter('Б'), why: 'Букву Б не скласти так, щоб половини збіглися.' },
  { name: 'різносторонній трикутник', has: false, svg: sv(<polygon points="25,100 135,100 95,20" {...stroke} />), why: 'У нього всі сторони різні, складені половини не збігаються.' },
];

export interface AxisItem { name: string; axis: 'вертикальна' | 'горизонтальна'; svg: ReactNode }
export const AXIS_ITEMS: AxisItem[] = [
  { name: 'рівнобедрений трикутник вершиною вгору', axis: 'вертикальна', svg: sv(<polygon points="80,10 45,105 115,105" {...stroke} />) },
  { name: 'трикутник вершиною вправо', axis: 'горизонтальна', svg: sv(<polygon points="35,15 35,105 135,60" {...stroke} />) },
  { name: 'серце', axis: 'вертикальна', svg: sv(<path d={HEART} {...stroke} fill="#FECACA" />) },
  { name: 'стрілка вправо', axis: 'горизонтальна', svg: sv(<polygon points="15,45 85,45 85,20 145,60 85,100 85,75 15,75" {...stroke} />) },
];

export interface SolidItem { name: string; svg: ReactNode; why: string }
const sd = { stroke: '#1E293B', strokeWidth: 3, strokeLinejoin: 'round' as const };
export const SOLIDS: SolidItem[] = [
  {
    name: 'куля',
    svg: sv(<><circle cx={80} cy={60} r={46} fill="#93C5FD" {...sd} /><ellipse cx={62} cy={40} rx={12} ry={7} fill="#fff" opacity={0.7} /></>),
    why: 'Вона скрізь округла, як мʼяч, і не має граней.',
  },
  {
    name: 'конус',
    svg: sv(<><path d="M80,10 L36,92 A44,14 0 0 0 124,92 Z" fill="#FDE68A" {...sd} /><path d="M36,92 A44,14 0 0 1 124,92" fill="none" stroke="#1E293B" strokeWidth={2} strokeDasharray="4 4" /></>),
    why: 'Знизу круг, а зверху гостра вершина.',
  },
  {
    name: 'циліндр',
    svg: sv(<><path d="M38,30 V90 A42,13 0 0 0 122,90 V30 Z" fill="#BBF7D0" {...sd} /><ellipse cx={80} cy={30} rx={42} ry={13} fill="#DCFCE7" {...sd} /></>),
    why: 'Зверху й знизу однакові круги, а збоку — округла поверхня.',
  },
  {
    name: 'прямокутний паралелепіпед',
    svg: sv(<><polygon points="30,45 105,45 105,100 30,100" fill="#FBCFE8" {...sd} /><polygon points="30,45 55,20 130,20 105,45" fill="#FDF2F8" {...sd} /><polygon points="105,45 130,20 130,75 105,100" fill="#F9A8D4" {...sd} /></>),
    why: 'У нього шість граней-прямокутників, як у коробки.',
  },
  {
    name: 'піраміда',
    svg: sv(<><polygon points="80,10 30,95 100,95" fill="#FED7AA" {...sd} /><polygon points="80,10 100,95 130,72" fill="#FDBA74" {...sd} /><path d="M30,95 L60,72 L130,72" fill="none" stroke="#1E293B" strokeWidth={2} strokeDasharray="4 4" /></>),
    why: 'Знизу основа, а трикутні грані сходяться у вершині.',
  },
];

// ---------- клітинки ----------
export const GRID_W = 7;
export const GRID_H = 7;
function GridSvg({ w, h }: { w: number; h: number }) {
  const c = 14;
  const lines: ReactNode[] = [];
  for (let i = 0; i <= GRID_W; i++) lines.push(<line key={`v${i}`} x1={i * c} y1={0} x2={i * c} y2={GRID_H * c} stroke="#CBD5E1" strokeWidth={1} />);
  for (let j = 0; j <= GRID_H; j++) lines.push(<line key={`h${j}`} x1={0} y1={j * c} x2={GRID_W * c} y2={j * c} stroke="#CBD5E1" strokeWidth={1} />);
  return (
    <svg viewBox={`-2 -2 ${GRID_W * c + 4} ${GRID_H * c + 4}`} width={GRID_W * c + 8} height={GRID_H * c + 8} role="img" aria-label="клітинки">
      {lines}
      <rect x={c} y={c} width={w * c} height={h * c} fill="#FDE68A" stroke="#B45309" strokeWidth={3} />
    </svg>
  );
}

type Payload =
  | { mode: 'angle'; a: Ang; options: string[] }
  | { mode: 'which'; angles: Ang[]; target: AngleKind; options: string[] }
  | { mode: 'symYN'; idx: number; options: string[] }
  | { mode: 'axis'; idx: number; options: string[] }
  | { mode: 'solid'; idx: number; options: string[] }
  | { mode: 'sq'; p: number; options: string[] }
  | { mode: 'rect'; s: number; a: number; options: string[] }
  | { mode: 'grid'; w: number; h: number; options: string[] };
type Answer = string;
type Item = Omit<Round<Payload, Answer>, 'id'>;

function angleRound(k: AngleKind): Item {
  const a = mkAngle(k);
  return { payload: { mode: 'angle', a, options: [...ANGLE_KINDS] }, answer: k };
}
function whichRound(target: AngleKind): Item {
  const kinds = shuffle([...ANGLE_KINDS]);
  const angles = kinds.map(mkAngle);
  return { payload: { mode: 'which', angles, target, options: ['А', 'Б', 'В'] }, answer: ['А', 'Б', 'В'][kinds.indexOf(target)] };
}
function symRound(idx: number): Item {
  return { payload: { mode: 'symYN', idx, options: ['так', 'ні'] }, answer: SYM_ITEMS[idx].has ? 'так' : 'ні' };
}
function axisRound(): Item {
  const idx = randInt(0, AXIS_ITEMS.length - 1);
  return { payload: { mode: 'axis', idx, options: ['вертикальна', 'горизонтальна', 'немає осі'] }, answer: AXIS_ITEMS[idx].axis };
}
function solidRound(idx: number): Item {
  const others = shuffle(SOLIDS.map((_, i) => i).filter((i) => i !== idx)).slice(0, 3);
  return { payload: { mode: 'solid', idx, options: shuffle([idx, ...others]).map((i) => SOLIDS[i].name) }, answer: SOLIDS[idx].name };
}
function sqRound(): Item {
  const a = randInt(3, 15);
  const p = a * 4;
  const d = pick3(a, [p / 2, p - 4, p / 3, a + 1, a - 1, p / 8]);
  return { payload: { mode: 'sq', p, options: shuffle([a, ...d].map((n) => `${n} см`)) }, answer: `${a} см` };
}
function rectRound(): Item {
  for (;;) {
    const a = randInt(3, 9);
    const b = randInt(4, 15);
    if (a === b) continue;
    const s = a * b;
    const d = pick3(b, [s - a, s + a, s / 2, a, b + 1, b - 1]);
    if (d.length < 3) continue;
    return { payload: { mode: 'rect', s, a, options: shuffle([b, ...d].map((n) => `${n} см`)) }, answer: `${b} см` };
  }
}
function gridRound(): Item {
  for (;;) {
    const w = randInt(3, 6);
    const h = randInt(2, 4);
    if (w === h) continue;
    const key = (x: number, y: number) => [x, y].sort().join('-');
    const target = key(w, h);
    const cands: [number, number][] = [[w + 1, h], [w, h + 1], [w - 1, h], [w, h - 1], [h + 1, h], [w, w - 1]];
    const wrong: [number, number][] = [];
    for (const [x, y] of shuffle(cands)) {
      if (x < 1 || y < 1 || x > 6 || y > 6 || key(x, y) === target || wrong.some(([p, q]) => key(p, q) === key(x, y))) continue;
      if (wrong.length < 3) wrong.push([x, y]);
    }
    if (wrong.length < 3) continue;
    const orient = ([x, y]: [number, number]): [number, number] => (Math.random() < 0.5 ? [x, y] : [y, x]);
    const all = [orient([w, h]), ...wrong.map(orient)];
    const answerDims = all[0];
    return { payload: { mode: 'grid', w, h, options: shuffle(all.map(([x, y]) => `${x}×${y}`)) }, answer: `${answerDims[0]}×${answerDims[1]}` };
  }
}

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const items: Item[] = [];
  if (difficulty === 1) {
    for (const k of shuffle([...ANGLE_KINDS, ...shuffle(ANGLE_KINDS).slice(0, 1)])) items.push(angleRound(k));
    for (const k of shuffle([...ANGLE_KINDS]).slice(0, 1)) items.push(whichRound(k));
  } else if (difficulty === 2) {
    const yes = shuffle(SYM_ITEMS.map((s, i) => ({ s, i })).filter((x) => x.s.has))[0].i;
    const no = shuffle(SYM_ITEMS.map((s, i) => ({ s, i })).filter((x) => !x.s.has))[0].i;
    items.push(symRound(yes), symRound(no), axisRound());
    for (const i of shuffle(SOLIDS.map((_, k) => k)).slice(0, 2)) items.push(solidRound(i));
  } else {
    items.push(sqRound(), sqRound(), rectRound(), gridRound(), gridRound());
  }
  return { difficulty, rounds: shuffle(items).map((r, i) => ({ ...r, id: `r${i}` })) };
}

const PHRASES = {
  angle: { key: 'p_geo4_angle', text: 'Який це кут: прямий, гострий чи тупий?' },
  which: { key: 'p_geo4_which', text: 'Який з кутів потрібного виду?' },
  symYN: { key: 'p_geo4_symyn', text: 'Чи має ця фігура вісь симетрії?' },
  axis: { key: 'p_geo4_axis', text: 'Де проходить вісь симетрії фігури?' },
  solid: { key: 'p_geo4_solid', text: 'Як називається це геометричне тіло?' },
  sq: { key: 'p_geo4_sq', text: 'Знайди сторону квадрата за його периметром.' },
  rect: { key: 'p_geo4_rect', text: 'Знайди сторону прямокутника за його площею.' },
  grid: { key: 'p_geo4_grid', text: 'Який прямокутник має такі сторони?' },
} as const;

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = PHRASES[p.mode];
  const say = hasUkAudio(phrase.key) ? () => sayUkSeq([phrase]) : undefined;
  let q = '';
  let body: ReactNode = null;
  let cols = 2;
  let optNodes: ((o: string) => ReactNode) | null = null;
  if (p.mode === 'angle') { q = 'Який це кут?'; body = <AngleSvg a={p.a} size={200} />; cols = 3; }
  else if (p.mode === 'which') {
    q = `Який кут ${p.target}?`;
    body = <div style={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>{p.angles.map((a, i) => <AngleSvg key={i} a={a} size={104} label={p.options[i]} />)}</div>;
    cols = 3;
  } else if (p.mode === 'symYN') { q = 'Чи має фігура вісь симетрії?'; body = SYM_ITEMS[p.idx].svg; }
  else if (p.mode === 'axis') { q = 'Де вісь симетрії?'; body = AXIS_ITEMS[p.idx].svg; cols = 1; }
  else if (p.mode === 'solid') { q = 'Яке це тіло?'; body = SOLIDS[p.idx].svg; }
  else if (p.mode === 'sq') { q = `Периметр квадрата — ${p.p} см. Яка його сторона?`; }
  else if (p.mode === 'rect') { q = `Площа прямокутника — ${p.s} см², одна сторона — ${p.a} см. Яка інша сторона?`; }
  else {
    q = `Який прямокутник має сторони ${p.w} см і ${p.h} см? (1 клітинка = 1 см)`;
    optNodes = (o) => { const [x, y] = o.split('×').map(Number); return <GridSvg w={x} h={y} />; };
  }
  return (
    <>
      <PromptCard question={q} answerState={answerState} say={say} sayKey={round.id}>{body}</PromptCard>
      <ChoiceGrid
        options={p.options.map((o) => ({ value: o, node: optNodes ? optNodes(o) : <span style={{ fontSize: 18, fontWeight: 800 }}>{o}</span> }))}
        correct={round.answer}
        disabled={disabled}
        answerState={answerState}
        onPick={onAnswer}
        columns={cols}
      />
    </>
  );
}

const geometry4: GameDefinition<Payload, Answer> = {
  id: 'geometry-4',
  title: 'Геометрія 4',
  subject: 'math',
  levels: ['L3'],
  icon: '📐',
  description: 'Кути, вісь симетрії, геометричні тіла, периметр і площа на клітинках.',
  accent: '#FFEDD5',
  skillsFor: (d) =>
    d === 1
      ? ['math.geom.l4.angles']
      : d === 2
        ? ['math.geom.l4.symmetry', 'math.geom.l4.solids']
        : ['math.measure.l4.square-side-by-perimeter', 'math.geom.l4.shape-construction'],
  explain: (round) => {
    const p = round.payload;
    if (p.mode === 'angle') return { steps: ['Прямий кут — як кут аркуша чи квадрата (90°).', 'Гострий — менший за прямий, тупий — більший за прямий.', `Цей кут — ${round.answer}.`] };
    if (p.mode === 'which') return { steps: ['Прямий кут — як кут аркуша. Гострий — вужчий, тупий — ширший.', `Кут ${p.target} — під буквою ${round.answer}.`] };
    if (p.mode === 'symYN') return { steps: [`Уяви, що фігуру складають навпіл: ${SYM_ITEMS[p.idx].why}`, round.answer === 'так' ? 'Тож вісь симетрії є.' : 'Тож осі симетрії немає.'] };
    if (p.mode === 'axis') return { steps: [`Вісь — лінія, по якій фігуру складають навпіл: у цієї фігури вона ${round.answer}.`] };
    if (p.mode === 'solid') return { steps: [`Це ${round.answer}.`, SOLIDS[p.idx].why] };
    if (p.mode === 'sq') return { steps: ['У квадрата чотири однакові сторони.', `Сторона = периметр : 4 = ${p.p} : 4 = ${round.answer}.`] };
    if (p.mode === 'rect') return { steps: ['Площа = довжина · ширина.', `Інша сторона = площа : відома сторона = ${p.s} : ${p.a} = ${round.answer}.`] };
    return { steps: [`${p.w} см — це ${p.w} клітинок, ${p.h} см — це ${p.h} клітинок.`, 'Шукай прямокутник з такою кількістю клітинок по довжині й по ширині.'] };
  },
  generate,
  Component,
};

export default geometry4;
