import type { Difficulty } from '../types';
import { CVC, CVC_EXTRA, LETTERS, NUMBERS, THINGS } from './data';

/**
 * «Читаю англійською» — від звуку літери до фрази (кейс 2–3 класу: «прочитала
 * лише sun, run», «не знала water, house»). Слова вже вчать «Мої слова», а тут —
 * саме ЧИТАННЯ: побачити букви й злити їх у слово.
 *
 *  1 — звук: літера → картинка, що з неї починається;
 *  2 — слово: прочитай cat → картинка; почуй cat → знайди серед cat / cot / cut;
 *  3 — фраза: «two red apples» → 🍎🍎.
 *
 * Прогрес — по кожному слову/літері: що плутається, те повертається частіше.
 */

export const SESSION = 8;
export const KNOWN_STREAK = 3;

export interface ItemState {
  streak: number;
  bad: number;
  last: number;
}
export type ReadingProgress = Record<string, ItemState>;

export interface Option {
  key: string;
  label: string;
}

export type Mode = 'sound' | 'read' | 'listen' | 'phrase';

export interface Question {
  mode: Mode;
  /** Ключ для прогресу (літера, слово чи фраза). */
  key: string;
  /** Що показати / сказати. */
  prompt: string;
  /** Що озвучити (слово-опора, слово, фраза). */
  say: string;
  answer: string;
  options: Option[];
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

const weight = (s: ItemState | undefined) => (!s ? 3 : s.streak >= KNOWN_STREAK ? 1 : s.bad > 0 ? 6 : 3);

function weightedPick<T>(items: readonly T[], key: (t: T) => string, p: ReadingProgress, rng: Rng, avoid?: string): T {
  const pool = items.filter((t) => key(t) !== avoid);
  const total = pool.reduce((s, t) => s + weight(p[key(t)]), 0);
  let r = rng() * total;
  for (const t of pool) {
    r -= weight(p[key(t)]);
    if (r < 0) return t;
  }
  return pool[pool.length - 1];
}

/** Слова, що відрізняються рівно однією літерою (cat → cot, cut, hat). */
export function oneLetterOff(word: string): string[] {
  const all = new Set([...CVC.map((c) => c.word), ...CVC_EXTRA]);
  return [...all].filter((w) => w !== word && w.length === word.length && [...w].filter((ch, i) => ch !== word[i]).length === 1);
}

function soundQ(p: ReadingProgress, rng: Rng, avoid?: string): Question {
  const k = weightedPick(LETTERS, (l) => `l:${l.letter}`, p, rng, avoid);
  const others = shuffle(LETTERS.filter((l) => l.letter !== k.letter && l.emoji !== k.emoji), rng).slice(0, 2);
  return {
    mode: 'sound',
    key: `l:${k.letter}`,
    prompt: k.letter,
    say: k.word,
    answer: k.emoji,
    options: shuffle([k, ...others], rng).map((o) => ({ key: o.emoji, label: o.emoji })),
  };
}

function readQ(p: ReadingProgress, rng: Rng, avoid?: string): Question {
  const w = weightedPick(CVC, (c) => `w:${c.word}`, p, rng, avoid);
  const others = shuffle(CVC.filter((c) => c.word !== w.word && c.emoji !== w.emoji), rng).slice(0, 2);
  return {
    mode: 'read',
    key: `w:${w.word}`,
    prompt: w.word,
    say: w.word,
    answer: w.emoji,
    options: shuffle([w, ...others], rng).map((o) => ({ key: o.emoji, label: o.emoji })),
  };
}

function listenQ(p: ReadingProgress, rng: Rng, avoid?: string): Question {
  const w = weightedPick(CVC, (c) => `w:${c.word}`, p, rng, avoid);
  const near = shuffle(oneLetterOff(w.word), rng).slice(0, 2);
  const fill = shuffle(CVC_EXTRA.filter((x) => x !== w.word && !near.includes(x)), rng).slice(0, 2 - near.length);
  return {
    mode: 'listen',
    key: `w:${w.word}`,
    prompt: '',
    say: w.word,
    answer: w.word,
    options: shuffle([w.word, ...near, ...fill], rng).map((x) => ({ key: x, label: x })),
  };
}

function phraseQ(p: ReadingProgress, rng: Rng, avoid?: string): Question {
  const combos = NUMBERS.flatMap((n) => THINGS.map((t) => ({ n, t })));
  const pick = weightedPick(combos, (c) => `p:${c.n.word}-${c.t.color}-${c.t.noun}`, p, rng, avoid);
  const text = (c: typeof pick) => `${c.n.word} ${c.t.color} ${c.t.noun}${c.n.n > 1 ? 's' : ''}`;
  const pic = (c: typeof pick) => c.t.emoji.repeat(c.n.n);
  // відволікачі: та сама річ іншою кількістю, інший колір тією ж кількістю
  const near = shuffle(
    combos.filter((c) => pic(c) !== pic(pick) && ((c.t === pick.t && c.n !== pick.n) || (c.n === pick.n && c.t.noun === pick.t.noun))),
    rng,
  ).slice(0, 2);
  return {
    mode: 'phrase',
    key: `p:${pick.n.word}-${pick.t.color}-${pick.t.noun}`,
    prompt: text(pick),
    say: text(pick),
    answer: pic(pick),
    options: shuffle([pick, ...near], rng).map((c) => ({ key: pic(c), label: pic(c) })),
  };
}

export function buildSession(d: Difficulty, p: ReadingProgress, rng: Rng = Math.random): Question[] {
  const makers = d === 1 ? [soundQ] : d === 2 ? [readQ, listenQ, readQ] : [phraseQ, readQ, listenQ, phraseQ];
  const out: Question[] = [];
  for (let i = 0; i < SESSION; i++) {
    const make = makers[i % makers.length];
    out.push(make(p, rng, out[out.length - 1]?.key));
  }
  return out;
}

export function record(p: ReadingProgress, key: string, firstTry: boolean, now: number): ReadingProgress {
  const prev = p[key] ?? { streak: 0, bad: 0, last: 0 };
  return { ...p, [key]: firstTry ? { ...prev, streak: prev.streak + 1, last: now } : { streak: 0, bad: prev.bad + 1, last: now } };
}

export function knownCount(p: ReadingProgress, prefix: 'l:' | 'w:'): number {
  return Object.entries(p).filter(([k, s]) => k.startsWith(prefix) && s.streak >= KNOWN_STREAK).length;
}
