import { SYL_WORDS, type WordEntry } from '../syllable-build/core';

/**
 * «Склади → слово» (рішення 09.10.2026): друге вміння після «Зливаємо склади».
 * Та сама доріжка, але на картках склади: тап — склад звучить; дотягни склад до складу —
 * виходить слово (МА + МА → МАМА) і зʼявляється картинка.
 * Сесія: 3 слова через доріжку → 3 перевірки «знайди картинку слова, яке я скажу»
 * (перша перевірка — не те слово, що щойно злили).
 */
export const SLIDES = 3;
export const FINDS = 3;

export type Step =
  | { kind: 'slide'; word: WordEntry }
  | { kind: 'find'; word: WordEntry; options: WordEntry[] };

type Rng = () => number;
function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function buildSession(rng: Rng = Math.random, pool: WordEntry[] = SYL_WORDS): Step[] {
  const words = shuffle(pool, rng).slice(0, SLIDES);
  const last = words[words.length - 1];
  let order = shuffle(words, rng);
  if (order[0] === last && order.length > 1) order = [order[1], order[0], ...order.slice(2)];
  const finds = order.slice(0, FINDS).map((w) => ({
    kind: 'find' as const,
    word: w,
    options: shuffle([w, ...shuffle(pool.filter((o) => o.word !== w.word && o.emoji !== w.emoji), rng).slice(0, 2)], rng),
  }));
  return [...words.map((w) => ({ kind: 'slide' as const, word: w })), ...finds];
}
