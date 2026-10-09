import type { Difficulty } from '../types';

/**
 * «Зливаємо склади» — «буква біжить до букви» + стежка груп (рішення 09.10.2026).
 * Злиття приголосного з голосним — окрема навичка від знання букв.
 *
 *  - Групи складів ідуть за букварем (ті самі приголосні, що дитина вже знає).
 *  - Свіжа група — ПЕРЕВІРКА: 5 разів «знайди склад, який чуєш»; 5 поспіль з першої спроби — група зарахована.
 *  - Інакше сесія: до 2 НОВИХ складів через ДОРІЖКУ (тап — буква звучить, дотягни — склад),
 *    потім ПРАКТИКА — 6 питань «знайди, який чуєш» вперемішку (нові, слабкі, повтор, відомі).
 *    Ціль ніколи не йде одразу після своєї доріжки — знання перевіряється, а не повторюється.
 *  - Склад «знає» після 2 правильних з першої спроби поспіль; повтор 1 · 3 · 7 днів → «золотий».
 *  - Слова (склад + склад) — окрема гра «Склади → слово» (рішення 09.10: не змішувати два вміння).
 * «И» поки не беремо: синтезатор читає її як «І».
 */

/** Протяжні приголосні — тап дає протяжний звук («мммм»). */
export const LONG = ['М', 'Н', 'Л', 'Р', 'С', 'З', 'В', 'Ш'] as const;
/** Короткі — тап дає назву букви (звук без голосної синтезатор не вимовляє). */
export const SHORT = ['Т', 'К', 'П', 'Б', 'Д'] as const;
export const CONSONANTS = [...LONG, ...SHORT] as const;
export const VOWELS = ['А', 'О', 'У', 'І', 'Е'] as const;
export const ROUNDS = 8;
export const KNOWN_STREAK = 2;
export const QUICK_PASS = 5;
export const NEW_PER_SESSION = 2;
export const PRACTICE = 6;
const DAY = 24 * 60 * 60 * 1000;
const BOX_DAYS = [1, 3, 7];

export const isLong = (c: string) => (LONG as readonly string[]).includes(c);

export const SGROUPS: { title: string; cs: string[]; vs: string[] }[] = [
  { title: 'МА НА ЛА ТА', cs: ['М', 'Н', 'Л', 'Т'], vs: ['А', 'О', 'У'] },
  { title: 'МІ НЕ ЛІ ТЕ', cs: ['М', 'Н', 'Л', 'Т'], vs: ['І', 'Е'] },
  { title: 'СА РО КУ ПІ', cs: ['С', 'Р', 'К', 'П'], vs: [...VOWELS] },
  { title: 'ВА ДО ЗУ БІ', cs: ['В', 'Д', 'З', 'Б'], vs: [...VOWELS] },
  { title: 'ША ШО ШУ', cs: ['Ш'], vs: [...VOWELS] },
];

export const sylsOf = (gi: number) => SGROUPS[gi].cs.flatMap((c) => SGROUPS[gi].vs.map((v) => c + v));

export interface Cvc {
  syl: string;
  end: string;
  word: string;
  emoji: string;
}

/** Слова «склад + звук» — з приголосних і голосних груп. */
export const CVC_WORDS: Cvc[] = [
  { syl: 'КІ', end: 'Т', word: 'КІТ', emoji: '🐱' },
  { syl: 'ДІ', end: 'М', word: 'ДІМ', emoji: '🏠' },
  { syl: 'НІ', end: 'С', word: 'НІС', emoji: '👃' },
  { syl: 'СО', end: 'К', word: 'СОК', emoji: '🧃' },
  { syl: 'ЛІ', end: 'С', word: 'ЛІС', emoji: '🌲' },
  { syl: 'РО', end: 'Т', word: 'РОТ', emoji: '👄' },
  { syl: 'ДУ', end: 'Б', word: 'ДУБ', emoji: '🌳' },
  { syl: 'СУ', end: 'П', word: 'СУП', emoji: '🍲' },
  { syl: 'МА', end: 'К', word: 'МАК', emoji: '🌺' },
  { syl: 'ЛЕ', end: 'В', word: 'ЛЕВ', emoji: '🦁' },
];

// ---------- прогрес ----------

export interface SylState {
  streak: number;
  ok: number;
  bad: number;
  last: number;
  seen?: boolean;
  box?: number;
  due?: number;
}
export type SylProgress = Record<string, SylState>;
export type Status = 'locked' | 'learning' | 'known' | 'gold';

export const isKnown = (s?: SylState) => !!s && s.streak >= KNOWN_STREAK;
export const isGold = (s?: SylState) => !!s && (s.box ?? 0) >= BOX_DAYS.length;
export const isSeen = (s?: SylState) => !!s && (!!s.seen || s.ok > 0);
export function statusOf(s?: SylState): Status {
  if (!s) return 'locked';
  if (isGold(s)) return 'gold';
  return isKnown(s) ? 'known' : 'learning';
}

export function currentGroup(p: SylProgress): number {
  const i = SGROUPS.findIndex((_, gi) => sylsOf(gi).some((s) => !isKnown(p[s])));
  return i === -1 ? SGROUPS.length : i;
}
export const isFresh = (p: SylProgress, gi: number) => gi < SGROUPS.length && sylsOf(gi).every((s) => !p[s]);

export function record(p: SylProgress, syl: string, firstTry: boolean, now: number): SylProgress {
  const prev = p[syl] ?? { streak: 0, ok: 0, bad: 0, last: 0 };
  if (!firstTry) return { ...p, [syl]: { ...prev, streak: 0, bad: prev.bad + 1, last: now, box: 0, due: undefined } };
  const wasKnown = isKnown(prev);
  const streak = prev.streak + 1;
  let box = prev.box ?? 0;
  let due = prev.due;
  if (!wasKnown && streak >= KNOWN_STREAK) { box = 0; due = now + BOX_DAYS[0] * DAY; }
  else if (wasKnown && (prev.due ?? Infinity) <= now) {
    box = Math.min(BOX_DAYS.length, box + 1);
    due = box < BOX_DAYS.length ? now + BOX_DAYS[box] * DAY : undefined;
  }
  return { ...p, [syl]: { ...prev, streak, ok: prev.ok + 1, last: now, box, due } };
}

export function open(p: SylProgress, syl: string, now: number): SylProgress {
  const prev = p[syl] ?? { streak: 0, ok: 0, bad: 0, last: now };
  return { ...p, [syl]: { ...prev, seen: true } };
}

export function passGroup(p: SylProgress, gi: number, now: number): SylProgress {
  const out = { ...p };
  for (const s of sylsOf(gi)) {
    const prev = out[s] ?? { streak: 0, ok: 0, bad: 0, last: now };
    out[s] = { ...prev, seen: true, streak: Math.max(prev.streak, KNOWN_STREAK), last: now, box: 0, due: now + BOX_DAYS[0] * DAY };
  }
  return out;
}

// ---------- кроки сесії ----------

export type Step =
  | { kind: 'slide'; left: string; right: string; syl: string }
  | { kind: 'find'; target: string; options: string[] }
  | { kind: 'word'; item: Cvc; options: Cvc[] };

export interface Session {
  check: boolean;
  group: number;
  steps: Step[];
}

type Rng = () => number;
function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Відволікачі «на слух» з дозволеного набору: той самий приголосний або той самий голосний. */
export function syllableOptions(c: string, v: string, n: number, rng: Rng, cs: readonly string[] = CONSONANTS, vs: readonly string[] = VOWELS): string[] {
  const answer = c + v;
  const sameC = shuffle(vs.filter((x) => x !== v), rng).map((x) => c + x);
  const sameV = shuffle(cs.filter((x) => x !== c), rng).map((x) => x + v);
  const mixed: string[] = [];
  for (let i = 0; mixed.length < n - 1 && i < 14; i++) {
    const d = i % 2 === 0 ? sameC[i >> 1] : sameV[i >> 1];
    if (d && !mixed.includes(d)) mixed.push(d);
  }
  return shuffle([answer, ...mixed], rng);
}

/**
 * Розкласти так, щоб та сама ціль не йшла двічі поспіль (жадібно, найчастіші — першими).
 * before — що було перед першим (остання доріжка): перша ціль теж не має з ним збігатися.
 */
function spread(targets: string[], rng: Rng, before?: string): string[] {
  const rest = shuffle(targets, rng);
  const out: string[] = [];
  while (rest.length) {
    const last = out.length ? out[out.length - 1] : before;
    const left = (s: string) => rest.filter((x) => x === s).length;
    const cand = rest.filter((x) => x !== last).sort((a, b) => left(b) - left(a));
    const pickIt = cand[0] ?? rest[0];
    rest.splice(rest.indexOf(pickIt), 1);
    out.push(pickIt);
  }
  return out;
}

function findStep(target: string, gi: number, d: Difficulty, rng: Rng): Step {
  const g = SGROUPS[Math.min(gi, SGROUPS.length - 1)];
  const n = d === 1 ? 3 : 4;
  // відволікачі з тієї ж групи (дитина знає ці букви) — схожі на слух
  const cs = g.cs.includes(target[0]) ? g.cs : [target[0], ...g.cs];
  const vs = g.vs.includes(target[1]) ? g.vs : [target[1], ...g.vs];
  return { kind: 'find', target, options: syllableOptions(target[0], target[1], n, rng, cs, vs) };
}

export function buildSession(p: SylProgress, d: Difficulty, rng: Rng = Math.random, now = Date.now()): Session {
  const gi = Math.min(currentGroup(p), SGROUPS.length - 1);
  const syls = sylsOf(gi);

  // свіжа група — перевірка: 5 різних (по змозі) складів на слух
  if (isFresh(p, gi)) {
    const targets = spread(shuffle(syls, rng).slice(0, QUICK_PASS).concat(syls).slice(0, QUICK_PASS), rng);
    return { check: true, group: gi, steps: targets.map((t) => findStep(t, gi, d, rng)) };
  }

  // нові склади: до 2, поки «вчу» не більше двох
  const learning = syls.filter((s) => isSeen(p[s]) && !isKnown(p[s])).length;
  const fresh = shuffle(syls.filter((s) => !isSeen(p[s])), rng).slice(0, Math.max(0, NEW_PER_SESSION - learning) || (learning === 0 ? 1 : 0));

  // практика: нові ×2, слабкі, повтор за днями, відомі — для впевненості
  const weak = syls.filter((s) => isSeen(p[s]) && !isKnown(p[s]));
  const due = Object.keys(p).filter((s) => isKnown(p[s]) && !isGold(p[s]) && (p[s].due ?? 0) <= now);
  const known = Object.keys(p).filter((s) => isKnown(p[s]));
  const targets: string[] = [];
  for (const f of fresh) targets.push(f, f);
  targets.push(...shuffle(weak, rng).slice(0, 3), ...shuffle(due, rng).slice(0, 2));
  // добір: кожна ціль не більше двох разів; спершу відомі, далі слабкі, далі інші склади групи
  const count = (t: string) => targets.filter((x) => x === t).length;
  const filler = [...shuffle(known, rng), ...shuffle(weak, rng), ...shuffle(syls, rng)];
  for (const t of filler) {
    if (targets.length >= PRACTICE) break;
    if (count(t) < 2 && !targets.slice(-1).includes(t)) targets.push(t);
  }
  // ціль не йде одразу після своєї доріжки — розкладка знає, що було перед нею
  const practice = spread(targets.slice(0, PRACTICE), rng, fresh[fresh.length - 1]);

  const steps: Step[] = [
    ...fresh.map((s) => ({ kind: 'slide' as const, left: s[0], right: s[1], syl: s })),
    ...practice.map((t) => findStep(t, gi, d, rng)),
  ];
  return { check: false, group: gi, steps };
}
