import { GROUPS, WORDS, type Word } from './words';

/**
 * «English Words» — та сама стежка, що «Буква і звук» (uk-letters/core.ts), але одиниця — слово:
 *  - група = тема; поточна — перша, де є не «знаю»;
 *  - свіжа тема починається з перевірки: QUICK_PASS правильних з першої спроби поспіль — тема зарахована;
 *  - інакше до 2 нових слів за сесію (знайомство), далі змішана практика;
 *  - «знаю» після 3 правильних з першої спроби поспіль; повтор через 1 · 3 · 7 днів.
 * Питання одне: почуй слово — знайди картинку (дошкільня не читає).
 */

export const KNOWN_STREAK = 3;
export const QUICK_PASS = 5;
export const NEW_PER_SESSION = 2;
export const QUIZ_LEN = 8;
const DAY = 24 * 60 * 60 * 1000;
const BOX_DAYS = [1, 3, 7];

export interface WordState {
  streak: number;
  ok: number;
  bad: number;
  last: number;
  seen?: boolean;
  box?: number;
  due?: number;
}

export type WordProgress = Record<string, WordState>;
export type Status = 'locked' | 'learning' | 'known' | 'gold';

const byId = new Map(WORDS.map((w) => [w.id, w]));
export const wordOf = (id: string) => byId.get(id)!;

export const isKnown = (s: WordState | undefined) => !!s && s.streak >= KNOWN_STREAK;
export const isSeen = (s: WordState | undefined) => !!s && (!!s.seen || s.ok > 0);
export const isGold = (s: WordState | undefined) => !!s && (s.box ?? 0) >= BOX_DAYS.length;

export function statusOf(s: WordState | undefined): Status {
  if (!s) return 'locked';
  if (isGold(s)) return 'gold';
  return isKnown(s) ? 'known' : 'learning';
}

export function currentGroup(p: WordProgress): number {
  const i = GROUPS.findIndex((g) => g.words.some((w) => !isKnown(p[w.id])));
  return i === -1 ? GROUPS.length : i;
}

export const isFresh = (p: WordProgress, gi: number) => gi < GROUPS.length && GROUPS[gi].words.every((w) => !p[w.id]);

export function dueWords(p: WordProgress, now: number): Word[] {
  return WORDS.filter((w) => isKnown(p[w.id]) && !isGold(p[w.id]) && (p[w.id].due ?? 0) <= now);
}

export function newWords(p: WordProgress): Word[] {
  const gi = currentGroup(p);
  if (gi >= GROUPS.length) return [];
  const g = GROUPS[gi].words;
  const learning = g.filter((w) => isSeen(p[w.id]) && !isKnown(p[w.id])).length;
  const room = Math.max(0, NEW_PER_SESSION - learning);
  return g.filter((w) => !isSeen(p[w.id])).slice(0, Math.max(room, learning === 0 ? 1 : 0));
}

export function record(p: WordProgress, id: string, firstTry: boolean, now: number): WordProgress {
  const prev = p[id] ?? { streak: 0, ok: 0, bad: 0, last: 0 };
  if (!firstTry) return { ...p, [id]: { ...prev, streak: 0, bad: prev.bad + 1, last: now, box: 0, due: undefined } };
  const wasKnown = isKnown(prev);
  const streak = prev.streak + 1;
  let box = prev.box ?? 0;
  let due = prev.due;
  if (!wasKnown && streak >= KNOWN_STREAK) {
    box = 0;
    due = now + BOX_DAYS[0] * DAY;
  } else if (wasKnown && (prev.due ?? Infinity) <= now) {
    box = Math.min(BOX_DAYS.length, box + 1);
    due = box < BOX_DAYS.length ? now + BOX_DAYS[box] * DAY : undefined;
  }
  return { ...p, [id]: { ...prev, streak, ok: prev.ok + 1, last: now, box, due } };
}

export function open(p: WordProgress, id: string, now: number): WordProgress {
  const prev = p[id] ?? { streak: 0, ok: 0, bad: 0, last: now };
  return { ...p, [id]: { ...prev, seen: true } };
}

export function passGroup(p: WordProgress, gi: number, now: number): WordProgress {
  const out = { ...p };
  for (const w of GROUPS[gi].words) {
    const prev = out[w.id] ?? { streak: 0, ok: 0, bad: 0, last: now };
    out[w.id] = { ...prev, seen: true, streak: Math.max(prev.streak, KNOWN_STREAK), last: now, box: 0, due: now + BOX_DAYS[0] * DAY };
  }
  return out;
}

export interface Question {
  target: Word;
  options: Word[];
  retry?: boolean;
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

/** Відволікачі: спершу з тієї ж теми й відкритих слів, далі — з наступних тем. */
function question(t: Word, near: Word[], n: number, rng: Rng): Question {
  const ok = (w: Word) => w.id !== t.id;
  const pool = [...shuffle(near.filter(ok), rng), ...shuffle(WORDS.filter((w) => ok(w) && !near.includes(w)), rng)];
  return { target: t, options: shuffle([t, ...pool.slice(0, n - 1)], rng) };
}

/** Те саме слово не двічі поспіль (коли можливо). */
function spread(targets: Word[], rng: Rng): Word[] {
  const rest = shuffle(targets, rng);
  const out: Word[] = [];
  while (rest.length) {
    const last = out[out.length - 1]?.id;
    const left = (id: string) => rest.filter((x) => x.id === id).length;
    const cand = rest.filter((x) => x.id !== last).sort((x, y) => left(y.id) - left(x.id));
    const pick = cand[0] ?? rest[0];
    rest.splice(rest.indexOf(pick), 1);
    out.push(pick);
  }
  return out;
}

const optionsFor = (d: number) => (d === 1 ? 3 : 4);

export function buildCheck(gi: number, d: number, rng: Rng = Math.random): Question[] {
  const g = GROUPS[gi].words;
  const targets: Word[] = [];
  while (targets.length < QUICK_PASS) targets.push(...shuffle(g, rng));
  return spread(targets.slice(0, QUICK_PASS), rng).map((t) => question(t, g, optionsFor(d), rng));
}

export function buildQuiz(p: WordProgress, fresh: Word[], d: number, rng: Rng = Math.random, now = Date.now()): Question[] {
  const opened = WORDS.filter((w) => p[w.id]);
  if (opened.length === 0 && fresh.length === 0) return [];
  const gi = currentGroup(p);
  const group = gi < GROUPS.length ? GROUPS[gi].words : [];
  const near = [...new Set([...group, ...opened])];

  const targets: Word[] = [];
  for (const f of fresh) targets.push(f, f);
  const weak = group.filter((w) => isSeen(p[w.id]) && !isKnown(p[w.id]) && !fresh.includes(w));
  targets.push(...shuffle(weak, rng).slice(0, 3));
  targets.push(...shuffle(dueWords(p, now), rng).slice(0, 3));
  const known = opened.filter((w) => isKnown(p[w.id]) && !targets.includes(w));
  while (targets.length < QUIZ_LEN && (known.length || weak.length || fresh.length)) {
    const pool = known.length ? known : weak.length ? weak : fresh;
    targets.push(pool[Math.floor(rng() * pool.length)]);
  }
  return spread(targets.slice(0, QUIZ_LEN), rng).map((t) => question(t, near, optionsFor(d), rng));
}
