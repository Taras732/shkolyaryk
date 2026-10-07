import type { Difficulty } from '../types';

/**
 * «Зливаємо склади» — кейс Дарини (3 р.): «КІ не злила… МАК — ще ні».
 *
 * Злиття приголосного з голосним — окрема навичка від знання букв: дитина знає
 * М і А, але не чує МА. Тому три ступені:
 *  1 — побачити злиття (М + А → МА) і обрати, як це читається разом;
 *  2 — почути склад і знайти його серед схожих (МА / МО / НА);
 *  3 — склад + звук = слово (МА + К = МАК), обрати картинку.
 * Без українського голосу на пристрої крок 2 стає зоровим (показуємо склад).
 */

export const CONSONANTS = ['М', 'Н', 'Т', 'Л', 'К', 'Р', 'С', 'П', 'Б', 'Д'] as const;
export const VOWELS = ['А', 'О', 'У', 'И', 'І'] as const;
export const ROUNDS = 6;

export interface Cvc {
  syl: string;
  end: string;
  word: string;
  emoji: string;
}

/** Слова «склад + звук» — лише з того набору приголосних і голосних, що вище. */
export const CVC_WORDS: Cvc[] = [
  { syl: 'КИ', end: 'Т', word: 'КИТ', emoji: '🐋' },
  { syl: 'КІ', end: 'Т', word: 'КІТ', emoji: '🐱' },
  { syl: 'ДІ', end: 'М', word: 'ДІМ', emoji: '🏠' },
  { syl: 'НІ', end: 'С', word: 'НІС', emoji: '👃' },
  { syl: 'СО', end: 'К', word: 'СОК', emoji: '🧃' },
  { syl: 'ЛІ', end: 'С', word: 'ЛІС', emoji: '🌲' },
  { syl: 'РО', end: 'Т', word: 'РОТ', emoji: '👄' },
  { syl: 'БА', end: 'Л', word: 'БАЛ', emoji: '💃' },
  { syl: 'ДУ', end: 'Б', word: 'ДУБ', emoji: '🌳' },
  { syl: 'СУ', end: 'П', word: 'СУП', emoji: '🍲' },
];

export type Mode = 'merge' | 'hear' | 'word';

export interface MergeQ {
  mode: 'merge' | 'hear';
  c: string;
  v: string;
  answer: string;
  options: string[];
}

export interface WordQ {
  mode: 'word';
  item: Cvc;
  options: Cvc[];
}

export type Question = MergeQ | WordQ;

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
export function syllableOptions(c: string, v: string, n: number, rng: Rng): string[] {
  const answer = c + v;
  const sameC = shuffle(VOWELS.filter((x) => x !== v), rng).map((x) => c + x);
  const sameV = shuffle(CONSONANTS.filter((x) => x !== c), rng).map((x) => x + v);
  const mixed: string[] = [];
  for (let i = 0; mixed.length < n - 1 && i < 10; i++) {
    const d = i % 2 === 0 ? sameC[i >> 1] : sameV[i >> 1];
    if (d && !mixed.includes(d)) mixed.push(d);
  }
  return shuffle([answer, ...mixed], rng);
}

/** Перші склади — з найлегших звуків (сонорні М, Н, Л + А, О, У), далі ширше. */
function pools(d: Difficulty): { cs: readonly string[]; vs: readonly string[] } {
  if (d === 1) return { cs: ['М', 'Н', 'Л', 'Т'], vs: ['А', 'О', 'У'] };
  return { cs: CONSONANTS, vs: VOWELS };
}

export function buildQuiz(d: Difficulty, canHear: boolean, rng: Rng = Math.random): Question[] {
  const { cs, vs } = pools(d);
  const n = d === 1 ? 3 : 4;
  const out: Question[] = [];
  for (let i = 0; i < ROUNDS; i++) {
    const mode: Mode = d === 1 ? 'merge' : d === 2 ? (i % 2 === 0 && canHear ? 'hear' : 'merge') : i % 2 === 0 ? 'word' : canHear ? 'hear' : 'merge';
    if (mode === 'word') {
      const item = pick(CVC_WORDS, rng);
      const others = shuffle(CVC_WORDS.filter((w) => w.word !== item.word && w.emoji !== item.emoji), rng).slice(0, 2);
      out.push({ mode, item, options: shuffle([item, ...others], rng) });
    } else {
      const c = pick(cs, rng);
      const v = pick(vs, rng);
      out.push({ mode, c, v, answer: c + v, options: syllableOptions(c, v, n, rng) });
    }
  }
  return out;
}
