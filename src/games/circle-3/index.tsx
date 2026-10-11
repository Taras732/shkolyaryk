import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle, randInt } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Коло» (11.10.2026) — 3 клас:
 *  d1 — центр, радіус, діаметр: що підсвічено на малюнку;
 *  d2 — діаметр удвічі більший за радіус (і навпаки);
 *  d3 — яке коло на клітинках має заданий радіус (1 клітинка = 1 см).
 */

export type Part = 'center' | 'radius' | 'diameter';
export const PART_NAME: Record<Part, string> = { center: 'центр', radius: 'радіус', diameter: 'діаметр' };

export type Payload =
  | { mode: 'kind'; q: string; what: Part; angle: number; options: string[] }
  | { mode: 'conv'; q: string; dir: 'toD' | 'toR'; given: number; angle: number; options: string[] }
  | { mode: 'grid'; q: string; asked: 'r' | 'd'; r: number; radii: Record<string, number>; options: string[] };
type Answer = string;

function numOptions(ans: number, extras: number[], n = 4, min = 1): string[] {
  const pool: number[] = [];
  for (const e of shuffle(extras)) if (e >= min && e !== ans && !pool.includes(e)) pool.push(e);
  for (const d of [1, -1, 2, -2, 3, -3, 5, -5]) {
    if (pool.length >= n - 1) break;
    const v = ans + d;
    if (v >= min && v !== ans && !pool.includes(v)) pool.push(v);
  }
  return shuffle([ans, ...pool.slice(0, n - 1)]).map((v) => `${v} см`);
}

const angle = () => randInt(0, 359);

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const items: Omit<Round<Payload, Answer>, 'id'>[] = [];
  if (difficulty === 1) {
    const whats = shuffle(['center', 'radius', 'diameter', 'radius', 'diameter'] as Part[]);
    for (const what of whats) items.push({ payload: { mode: 'kind', q: 'Що підсвічено на малюнку?', what, angle: angle(), options: shuffle(['центр', 'радіус', 'діаметр']) }, answer: PART_NAME[what] });
  } else if (difficulty === 2) {
    for (let i = 0; i < 5; i++) {
      if (i < 3) {
        const r = randInt(2, 12);
        items.push({ payload: { mode: 'conv', q: `Радіус кола ${r} см. Який діаметр цього кола?`, dir: 'toD', given: r, angle: angle(), options: numOptions(2 * r, [r, 2 * r + 2, 2 * r - 2, r + 2, 3 * r]) }, answer: `${2 * r} см` });
      } else {
        const r = randInt(2, 12), d = 2 * r;
        items.push({ payload: { mode: 'conv', q: `Діаметр кола ${d} см. Який радіус цього кола?`, dir: 'toR', given: d, angle: angle(), options: numOptions(r, [d, r + 1, r - 1, r + 2, 2 * d]) }, answer: `${r} см` });
      }
    }
  } else {
    for (let i = 0; i < 5; i++) {
      const asked = i < 3 ? 'r' : 'd';
      const r = randInt(2, 6);
      const radii = shuffle([1, 2, 3, 4, 5, 6].filter((x) => x !== r)).slice(0, 3).concat(r);
      const order = shuffle(radii);
      const letters = ['A', 'B', 'C', 'D'];
      const map: Record<string, number> = {};
      order.forEach((x, k) => { map[letters[k]] = x; });
      items.push({
        payload: { mode: 'grid', q: asked === 'r' ? `Яке коло має радіус ${r} см? Одна клітинка — 1 см.` : `Яке коло має діаметр ${2 * r} см? Одна клітинка — 1 см.`, asked, r, radii: map, options: letters },
        answer: letters[order.indexOf(r)],
      });
    }
  }
  return { difficulty, rounds: shuffle(items).map((r, i) => ({ ...r, id: `r${i}` })) };
}

const HI = '#F97316', LINE = '#334155';

function CircleSvg({ angle: deg, what, label }: { angle: number; what: Part; label?: string }) {
  const C = 100, R = 70, a = (deg * Math.PI) / 180;
  const p1 = [C + R * Math.cos(a), C + R * Math.sin(a)], p2 = [C - R * Math.cos(a), C - R * Math.sin(a)];
  const mid = what === 'radius' ? [(C + p1[0]) / 2, (C + p1[1]) / 2] : [C, C];
  const off = [-Math.sin(a) * 14, Math.cos(a) * 14];
  return (
    <svg viewBox="0 0 200 200" width={200} height={200} style={{ display: 'block', margin: '6px auto' }} role="img" aria-label="коло">
      <circle cx={C} cy={C} r={R} fill="#F8FAFC" stroke={LINE} strokeWidth={3} />
      {what === 'radius' && <><line x1={C} y1={C} x2={p1[0]} y2={p1[1]} stroke={HI} strokeWidth={6} strokeLinecap="round" /><circle cx={p1[0]} cy={p1[1]} r={5} fill={HI} /></>}
      {what === 'diameter' && <><line x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} stroke={HI} strokeWidth={6} strokeLinecap="round" /><circle cx={p1[0]} cy={p1[1]} r={5} fill={HI} /><circle cx={p2[0]} cy={p2[1]} r={5} fill={HI} /></>}
      <circle cx={C} cy={C} r={what === 'center' ? 9 : 4} fill={what === 'center' ? HI : LINE} />
      {label && <text x={mid[0] + off[0]} y={mid[1] + off[1] + 5} textAnchor="middle" fontSize={16} fontWeight={800} fill="#9A3412" stroke="#fff" strokeWidth={4} paintOrder="stroke">{label}</text>}
    </svg>
  );
}

export const GRID_N = 14;
function GridCircle({ r }: { r: number }) {
  const c = 11, N = GRID_N, S = N * c;
  return (
    <svg viewBox={`0 0 ${S} ${S}`} width="100%" style={{ maxWidth: 154, display: 'block', margin: '4px auto' }} role="img" aria-label="коло на клітинках">
      <rect x={0} y={0} width={S} height={S} fill="#fff" />
      {Array.from({ length: N + 1 }, (_, i) => (
        <g key={i}>
          <line x1={i * c} y1={0} x2={i * c} y2={S} stroke="#CBD5E1" strokeWidth={0.7} />
          <line x1={0} y1={i * c} x2={S} y2={i * c} stroke="#CBD5E1" strokeWidth={0.7} />
        </g>
      ))}
      <circle cx={S / 2} cy={S / 2} r={r * c} fill="none" stroke="#2563EB" strokeWidth={2} />
      <circle cx={S / 2} cy={S / 2} r={2.2} fill="#EF4444" />
    </svg>
  );
}

export const PHRASES = {
  kind: { key: 'p_circle_kind', text: 'Що підсвічено на малюнку: центр, радіус чи діаметр?' },
  conv: { key: 'p_circle_conv', text: 'Діаметр удвічі більший за радіус. Знайди відповідь.' },
  grid: { key: 'p_circle_grid', text: 'Яке коло має потрібний розмір? Одна клітинка дорівнює одному сантиметру.' },
} as const;

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = PHRASES[p.mode];
  const say = hasUkAudio(phrase.key) ? () => sayUkSeq([phrase]) : undefined;
  if (p.mode === 'grid') {
    return (
      <>
        <PromptCard question={p.q} answerState={answerState} say={say} sayKey={round.id} />
        <ChoiceGrid options={p.options.map((o) => ({ value: o, node: <div style={{ width: '100%' }}><div style={{ fontWeight: 900, fontSize: 18 }}>{o}</div><GridCircle r={p.radii[o]} /></div> }))}
          correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={2} />
      </>
    );
  }
  return (
    <>
      <PromptCard question={p.q} answerState={answerState} say={say} sayKey={round.id}>
        {p.mode === 'kind' ? <CircleSvg angle={p.angle} what={p.what} /> : <CircleSvg angle={p.angle} what={p.dir === 'toD' ? 'radius' : 'diameter'} label={`${p.dir === 'toD' ? 'r' : 'd'} = ${p.given} см`} />}
      </PromptCard>
      <ChoiceGrid options={p.options.map((o) => ({ value: o, node: <span style={{ fontSize: p.mode === 'kind' ? 20 : 24, fontWeight: 800 }}>{o}</span> }))}
        correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={p.mode === 'kind' ? 3 : 2} />
    </>
  );
}

const circle3: GameDefinition<Payload, Answer> = {
  id: 'circle-3',
  title: 'Коло',
  subject: 'math',
  levels: ['L3'],
  icon: '⭕',
  description: 'Центр, радіус і діаметр кола; діаметр удвічі більший за радіус.',
  accent: '#FCE7F3',
  skillsFor: () => ['math.geom.l3.compass-circle'],
  explain: (round) => {
    const p = round.payload;
    if (p.mode === 'kind') {
      const why: Record<Part, string> = {
        center: 'Центр — точка всередині кола, однаково віддалена від усіх точок кола.',
        radius: 'Радіус — відрізок від центра до будь-якої точки кола.',
        diameter: 'Діаметр — відрізок, що зʼєднує дві точки кола й проходить через центр.',
      };
      return { steps: [`Це ${round.answer}.`, why[p.what]] };
    }
    if (p.mode === 'conv') {
      return p.dir === 'toD'
        ? { steps: ['Діаметр складається з двох радіусів.', `${p.given} · 2 = ${p.given * 2} см.`] }
        : { steps: ['Радіус — половина діаметра.', `${p.given} : 2 = ${p.given / 2} см.`] };
    }
    return p.asked === 'r'
      ? { steps: [`Радіус — відстань від центра до кола. Полічи клітинки від центра вправо: має бути ${p.r}.`, `Це коло ${round.answer}.`] }
      : { steps: [`Діаметр ${2 * p.r} см, тож радіус ${2 * p.r} : 2 = ${p.r} см.`, `Полічи клітинки від центра до кола: має бути ${p.r}. Це коло ${round.answer}.`] };
  },
  generate,
  Component,
};

export default circle3;
