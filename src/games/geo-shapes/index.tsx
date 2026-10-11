import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Фігури» для 1 класу (11.10.2026), програма Савченко [1 МАО 4.5]: трикутник, чотирикутник, квадрат,
 * круг; куб, куля, циліндр, конус, піраміда; кути й сторони.
 * Фігури в незвичних положеннях і розмірах — щоб упізнавалась форма, а не одна картинка
 * (квадрат, повернутий ромбиком, — теж квадрат).
 *  d1 — знайди плоску фігуру;
 *  d2 — знайди тіло або «яку форму має» предмет (співвіднести предмет з моделлю);
 *  d3 — скільки кутів / сторін.
 * Квадрат — теж чотирикутник: коли просимо «чотирикутник», квадрата серед варіантів немає.
 */

export type Flat = 'triangle' | 'quad' | 'square' | 'circle';
export type Solid = 'cube' | 'sphere' | 'cylinder' | 'cone' | 'pyramid';

const FLAT_NAMES: Record<Flat, { title: string; say: string; rule: string }> = {
  triangle: { title: 'трикутник', say: 'трикутник', rule: 'У трикутника 3 сторони і 3 кути.' },
  quad: { title: 'чотирикутник', say: 'чотирикутник', rule: 'У чотирикутника 4 сторони і 4 кути.' },
  square: { title: 'квадрат', say: 'квадрат', rule: 'Квадрат: 4 однакові сторони і 4 прямі кути — навіть коли повернутий.' },
  circle: { title: 'круг', say: 'круг', rule: 'У круга немає ні сторін, ні кутів.' },
};
const SOLID_NAMES: Record<Solid, { title: string; say: string; rule: string }> = {
  cube: { title: 'куб', say: 'куб', rule: 'У куба 6 однакових граней-квадратів.' },
  sphere: { title: 'кулю', say: 'кулю', rule: 'Куля кругла з усіх боків — котиться куди завгодно.' },
  cylinder: { title: 'циліндр', say: 'циліндр', rule: 'У циліндра два круги-основи; котиться лише вперед-назад.' },
  cone: { title: 'конус', say: 'конус', rule: 'У конуса круг-основа і гострий верх — вершина.' },
  pyramid: { title: 'піраміду', say: 'піраміду', rule: 'У піраміди основа-многокутник, а трикутні грані сходяться у вершині.' },
};
/** Предмети для «яку форму має»: емодзі, назва, підпис для озвучки, правильне тіло. */
export const OBJECTS = [
  { id: 'dice', emoji: '🎲', name: 'кубик', like: 'схожий', solid: 'cube' as Solid },
  { id: 'ball', emoji: '⚽', name: 'мʼяч', like: 'схожий', solid: 'sphere' as Solid },
  { id: 'can', emoji: '🥫', name: 'банка', like: 'схожа', solid: 'cylinder' as Solid },
  { id: 'cone', emoji: '🍦', name: 'ріжок морозива', like: 'схожий', solid: 'cone' as Solid },
];

type Payload =
  | { mode: 'flat'; target: Flat; options: { kind: Flat; rot: number; scale: number; hue: number }[] }
  | { mode: 'solid'; target: Solid; object?: string; options: Solid[] }
  | { mode: 'count'; what: 'кутів' | 'сторін'; sides: number; rot: number; options: number[] };
type Answer = string | number;

const ROUNDS = 5;
const randInt = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const pick = <T,>(a: readonly T[]) => a[randInt(0, a.length - 1)];

function flatOptions(target: Flat): Flat[] {
  // квадрат — теж чотирикутник: просимо «чотирикутник» — квадрата серед варіантів немає
  const pool = (['triangle', 'quad', 'square', 'circle'] as Flat[]).filter((k) => k !== target && !(target === 'quad' && k === 'square'));
  return shuffle([target, ...shuffle(pool).slice(0, 2)]);
}

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  let rounds: Round<Payload, Answer>[];
  if (difficulty === 1) {
    const targets = shuffle<Flat>(['triangle', 'quad', 'square', 'circle', pick<Flat>(['square', 'quad', 'triangle'])]);
    rounds = targets.map((target, i) => ({
      id: `r${i}`,
      payload: { mode: 'flat', target, options: flatOptions(target).map((kind) => ({ kind, rot: pick([0, 15, 30, 45, -20]), scale: pick([0.7, 0.85, 1]), hue: randInt(0, 5) })) },
      answer: target,
    }));
  } else if (difficulty === 2) {
    // 3 раунди «знайди тіло» + 2 «яку форму має предмет»
    const finds = shuffle<Solid>(['cube', 'sphere', 'cylinder', 'cone', 'pyramid']).slice(0, 3);
    const objs = shuffle(OBJECTS).slice(0, 2);
    const all: { target: Solid; object?: string }[] = shuffle([...finds.map((t) => ({ target: t })), ...objs.map((o) => ({ target: o.solid, object: o.id }))]);
    rounds = all.map((r, i) => {
      const pool = (['cube', 'sphere', 'cylinder', 'cone', 'pyramid'] as Solid[]).filter((k) => k !== r.target);
      return { id: `r${i}`, payload: { mode: 'solid', target: r.target, object: r.object, options: shuffle([r.target, ...shuffle(pool).slice(0, 2)]) }, answer: r.target };
    });
  } else {
    rounds = Array.from({ length: ROUNDS }, (_, i) => {
      const sides = pick([3, 4, 3, 4, 5]);
      const what = pick(['кутів', 'сторін'] as const);
      return { id: `r${i}`, payload: { mode: 'count', what, sides, rot: randInt(-30, 30), options: [3, 4, 5] }, answer: sides };
    });
  }
  return { difficulty, rounds };
}

// ---------- малюнки ----------

const HUES = ['#EF4444', '#F59E0B', '#22C55E', '#3B82F6', '#A855F7', '#EC4899'];
const INK = '#1F2333';

function FlatPic({ kind, rot, scale, hue }: { kind: Flat; rot: number; scale: number; hue: number }) {
  const fill = HUES[hue % HUES.length];
  const s = { fill, stroke: INK, strokeWidth: 3, strokeLinejoin: 'round' as const };
  const shape =
    kind === 'triangle' ? <polygon points="40,10 72,66 8,62" {...s} />
    : kind === 'square' ? <rect x={14} y={14} width={52} height={52} {...s} />
    : kind === 'quad' ? <polygon points="6,60 24,20 56,20 74,60" {...s} />
    : <circle cx={40} cy={40} r={28} {...s} />;
  return (
    <svg viewBox="0 0 80 80" width={70} height={70} aria-hidden>
      <g transform={`translate(40 40) rotate(${kind === 'circle' ? 0 : rot}) scale(${scale}) translate(-40 -40)`}>{shape}</g>
    </svg>
  );
}

/** Тіла — прості обʼємні моделі (світла й тінь граней). */
export function SolidPic({ kind, size = 70 }: { kind: Solid; size?: number }) {
  const st = { stroke: INK, strokeWidth: 2.5, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} aria-hidden>
      <defs>
        <radialGradient id="sph" cx="35%" cy="35%" r="70%"><stop offset="0" stopColor="#BFDBFE" /><stop offset="1" stopColor="#2563EB" /></radialGradient>
      </defs>
      {kind === 'cube' && (<>
        <polygon points="16,28 48,28 48,64 16,64" fill="#93C5FD" {...st} />
        <polygon points="16,28 30,16 62,16 48,28" fill="#DBEAFE" {...st} />
        <polygon points="48,28 62,16 62,52 48,64" fill="#60A5FA" {...st} />
      </>)}
      {kind === 'sphere' && <circle cx={40} cy={40} r={28} fill="url(#sph)" {...st} />}
      {kind === 'cylinder' && (<>
        <path d="M16 20 L16 60 A24 8 0 0 0 64 60 L64 20" fill="#86EFAC" {...st} />
        <ellipse cx={40} cy={20} rx={24} ry={8} fill="#DCFCE7" {...st} />
      </>)}
      {kind === 'cone' && (<>
        <path d="M40 10 L16 60 A24 8 0 0 0 64 60 Z" fill="#FCD34D" {...st} />
        <path d="M16 60 A24 8 0 0 1 64 60" fill="none" stroke={INK} strokeWidth={1.5} strokeDasharray="3 3" />
      </>)}
      {kind === 'pyramid' && (<>
        <polygon points="40,10 14,58 40,68" fill="#FDBA74" {...st} />
        <polygon points="40,10 40,68 66,56" fill="#F97316" {...st} />
      </>)}
    </svg>
  );
}

function CountPic({ sides, rot }: { sides: number; rot: number }) {
  const pts = Array.from({ length: sides }, (_, i) => {
    const a = (Math.PI * 2 * i) / sides - Math.PI / 2;
    return `${40 + 30 * Math.cos(a)},${42 + 30 * Math.sin(a)}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 80 84" width={130} height={136} aria-hidden>
      <g transform={`rotate(${rot} 40 42)`}><polygon points={pts} fill="#E9D5FF" stroke={INK} strokeWidth={3} strokeLinejoin="round" /></g>
    </svg>
  );
}

// ---------- гра ----------

const FIND = { key: 'p_find_sym', text: 'Знайди' };

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const first = round.id === 'r0';

  if (p.mode === 'flat') {
    const name = { key: `shp_${p.target}`, text: FLAT_NAMES[p.target].say };
    const say = hasUkAudio(name.key) ? (again?: boolean) => sayUkSeq(again || !first ? [name] : [FIND, name]) : undefined;
    return (
      <>
        <PromptCard question={`Знайди ${FLAT_NAMES[p.target].title}`} answerState={answerState} say={say} sayKey={round.id} />
        <ChoiceGrid options={p.options.map((o) => ({ value: o.kind, node: <span aria-label={FLAT_NAMES[o.kind].title} style={{ display: 'block', lineHeight: 0 }}><FlatPic {...o} /></span> }))}
          correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={3} />
      </>
    );
  }

  if (p.mode === 'solid') {
    const obj = OBJECTS.find((o) => o.id === p.object);
    const q = obj
      ? { key: `q_form_${obj.id}`, text: `Яку форму має ${obj.name}?` }
      : { key: `sld_${p.target}`, text: SOLID_NAMES[p.target].say };
    const say = hasUkAudio(q.key) ? (again?: boolean) => sayUkSeq(obj || again || !first ? [q] : [FIND, q]) : undefined;
    return (
      <>
        <PromptCard question={obj ? q.text : `Знайди ${SOLID_NAMES[p.target].title}`} answerState={answerState} say={say} sayKey={round.id}>
          {obj && <div style={{ fontSize: 72, textAlign: 'center', lineHeight: 1.1 }}>{obj.emoji}</div>}
        </PromptCard>
        <ChoiceGrid options={p.options.map((k) => ({ value: k, node: <span aria-label={SOLID_NAMES[k].title} style={{ display: 'block', lineHeight: 0 }}><SolidPic kind={k} /></span> }))}
          correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={3} />
      </>
    );
  }

  const q = { key: p.what === 'кутів' ? 'p_shp_angles' : 'p_shp_sides', text: `Скільки ${p.what}?` };
  const say = hasUkAudio(q.key) ? () => sayUkSeq([q]) : undefined;
  return (
    <>
      <PromptCard question={q.text} answerState={answerState} say={say} sayKey={round.id}>
        <div style={{ display: 'flex', justifyContent: 'center' }}><CountPic sides={p.sides} rot={p.rot} /></div>
      </PromptCard>
      <ChoiceGrid options={p.options.map((n) => ({ value: n }))} correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={3} />
    </>
  );
}

const geoShapes: GameDefinition<Payload, Answer> = {
  id: 'geo-shapes',
  title: 'Фігури й тіла',
  subject: 'math',
  levels: ['L3'],
  icon: '🔺',
  description: 'Трикутник, чотирикутник, квадрат, круг; куб, куля, циліндр, конус, піраміда; кути й сторони.',
  accent: '#FCE7F3',
  skillsFor: (d) => [d === 1 ? 'math.geom.l1.flat-shapes' : d === 2 ? 'math.geom.l1.spatial-shapes' : 'math.geom.l1.shape-properties'],
  // «чому так» — за 💡 після відповіді
  explain: (round) => {
    const p = round.payload;
    if (p.mode === 'flat') return { steps: [FLAT_NAMES[p.target].rule] };
    if (p.mode === 'solid') {
      const obj = OBJECTS.find((o) => o.id === p.object);
      const steps = [SOLID_NAMES[p.target].rule];
      if (obj) steps.unshift(`${obj.name[0].toUpperCase()}${obj.name.slice(1)} ${obj.like} на ${SOLID_NAMES[p.target].title}.`);
      return { steps };
    }
    const [sw, aw] = p.sides === 5 ? ['сторін', 'кутів'] : ['сторони', 'кути'];
    return { steps: [`Тут ${p.sides} ${sw} і ${p.sides} ${aw}.`, 'Скільки сторін — стільки й кутів.'] };
  },
  generate,
  Component,
};

export default geoShapes;
