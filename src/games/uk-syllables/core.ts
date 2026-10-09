import type { Difficulty } from '../types';

/**
 * «Зливаємо склади» — прийом «буква біжить до букви» (рішення 09.10.2026).
 * Злиття приголосного з голосним — окрема навичка від знання букв: дитина знає М і А,
 * але не чує МА. Тому кожен раунд — дія руками + слух:
 *  1. ДОРІЖКА: дитина веде пальцем приголосний до голосного; поки буква їде — тягнеться
 *     звук («мммм…»), на зустрічі — склад («ма»), картки зливаються в одну.
 *  2. ЗНАЙДИ: склад лише звучить, на екрані — схожі (МА / МО / НА); ціль не написана.
 *  Слово (складніше): склад + звук → слово (КІ + Т = КІТ), доріжка, потім вибрати картинку.
 * Порядок: спершу приголосні, які можна тягнути (М Н Л Р С З В Ш), потім короткі (Т К П Б Д) —
 * у них доріжка коротка, буква «стрибає». «И» поки не беремо: синтезатор читає її як «І».
 */

/** Протяжні приголосні — звук можна тягнути вздовж доріжки. */
export const LONG = ['М', 'Н', 'Л', 'Р', 'С', 'З', 'В', 'Ш'] as const;
/** Короткі (вибухові) — тягнути не можна, буква «стрибає». */
export const SHORT = ['Т', 'К', 'П', 'Б', 'Д'] as const;
export const CONSONANTS = [...LONG, ...SHORT] as const;
export const VOWELS = ['А', 'О', 'У', 'І', 'Е'] as const;
export const ROUNDS = 6;

export const isLong = (c: string) => (LONG as readonly string[]).includes(c);

export interface Cvc {
  syl: string;
  end: string;
  word: string;
  emoji: string;
}

/** Слова «склад + звук» — з тих самих приголосних і голосних. */
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

/** Склад: доріжка (left → right), потім «знайди, який чуєш». */
export interface SylQ {
  mode: 'syl';
  /** Що їде доріжкою (приголосний). */
  left: string;
  /** До чого їде (голосний). */
  right: string;
  answer: string;
  options: string[];
}

/** Слово: доріжка (склад ← звук), потім вибрати картинку. */
export interface WordQ {
  mode: 'word';
  item: Cvc;
  options: Cvc[];
}

export type Question = SylQ | WordQ;

type Rng = () => number;

const pick = <T,>(arr: readonly T[], rng: Rng): T => arr[Math.floor(rng() * arr.length)];

function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Відволікачі «на слух»: той самий приголосний з іншим голосним і навпаки (МА → МО, НА). */
export function syllableOptions(c: string, v: string, n: number, rng: Rng, cs: readonly string[] = CONSONANTS, vs: readonly string[] = VOWELS): string[] {
  const answer = c + v;
  const sameC = shuffle(vs.filter((x) => x !== v), rng).map((x) => c + x);
  const sameV = shuffle(cs.filter((x) => x !== c), rng).map((x) => x + v);
  const mixed: string[] = [];
  for (let i = 0; mixed.length < n - 1 && i < 12; i++) {
    const d = i % 2 === 0 ? sameC[i >> 1] : sameV[i >> 1];
    if (d && !mixed.includes(d)) mixed.push(d);
  }
  return shuffle([answer, ...mixed], rng);
}

/** Легко — лише протяжні + А О У; далі — усі. */
function pools(d: Difficulty): { cs: readonly string[]; vs: readonly string[] } {
  if (d === 1) return { cs: ['М', 'Н', 'Л', 'С'], vs: ['А', 'О', 'У'] };
  if (d === 2) return { cs: [...LONG], vs: VOWELS };
  return { cs: CONSONANTS, vs: VOWELS };
}

export function buildQuiz(d: Difficulty, rng: Rng = Math.random): Question[] {
  const { cs, vs } = pools(d);
  const n = d === 1 ? 3 : 4;
  const out: Question[] = [];
  let last = '';
  for (let i = 0; i < ROUNDS; i++) {
    if (d === 3 && i % 2 === 1) {
      const item = pick(CVC_WORDS, rng);
      const others = shuffle(CVC_WORDS.filter((w) => w.word !== item.word && w.emoji !== item.emoji), rng).slice(0, 2);
      out.push({ mode: 'word', item, options: shuffle([item, ...others], rng) });
      continue;
    }
    let c = pick(cs, rng);
    let v = pick(vs, rng);
    // той самий склад двічі поспіль — нудно
    for (let k = 0; k < 6 && c + v === last; k++) { c = pick(cs, rng); v = pick(vs, rng); }
    last = c + v;
    out.push({ mode: 'syl', left: c, right: v, answer: c + v, options: syllableOptions(c, v, n, rng, cs, vs) });
  }
  return out;
}
