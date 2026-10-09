import type { Difficulty } from '../types';

/**
 * «Склади слово» (переробка 09.10.2026): картинка + слово звучить; внизу перемішані плитки
 * (склади або букви), дитина ставить їх по порядку — кожна звучить і летить у свою клітинку.
 * Складено — слово звучить цілим. Слова лише українські (було «КОТ» — це російське; правильно «КІТ»).
 * Плитки-склади без «И»: синтезатор читає її як «І».
 */
export interface WordEntry {
  word: string;
  /** Плитки по порядку: склади (МА·МА) або букви (К·І·Т). */
  parts: string[];
  emoji: string;
}

const L = (word: string, emoji: string): WordEntry => ({ word, parts: word.split(''), emoji });

/**
 * Слова з букв — сходинки 3 → 4 → 5 букв (рішення Тараса 09.10: дошкіллю поки вистачить букв;
 * наступна довжина відкривається, коли попередня виходить — 5 слів поспіль без помилок).
 */
export const WORDS_BY_LEN: Record<3 | 4 | 5, WordEntry[]> = {
  3: [L('КІТ', '🐱'), L('ДІМ', '🏠'), L('ЛЕВ', '🦁'), L('СОК', '🧃'), L('ДУБ', '🌳'), L('НІС', '👃'), L('МАК', '🌺'), L('РОТ', '👄'), L('СУП', '🍲'), L('СИР', '🧀')],
  4: [L('ВОДА', '💧'), L('РУКА', '✋'), L('ЖАБА', '🐸'), L('КАША', '🥣'), L('НОГА', '🦶'), L('ЛАПА', '🐾'), L('КОЗА', '🐐'), L('ЛУНА', '🌙'), L('ВОВК', '🐺'), L('СЛОН', '🐘'), L('ТОРТ', '🎂'), L('СОВА', '🦉')],
  5: [L('ЗЕБРА', '🦓'), L('КАЧКА', '🦆'), L('ЗІРКА', '⭐'), L('ЛОЖКА', '🥄'), L('ЛИМОН', '🍋'), L('ГРУША', '🍐')],
};
export const CLEAN_TO_LEVEL_UP = 5;

/** Короткі слова — букви по одній (сумісність; те саме, що WORDS_BY_LEN[3] без СИР). */
export const LETTER_WORDS: WordEntry[] = [
  { word: 'КІТ', parts: ['К', 'І', 'Т'], emoji: '🐱' },
  { word: 'ДІМ', parts: ['Д', 'І', 'М'], emoji: '🏠' },
  { word: 'ЛЕВ', parts: ['Л', 'Е', 'В'], emoji: '🦁' },
  { word: 'СОК', parts: ['С', 'О', 'К'], emoji: '🧃' },
  { word: 'ДУБ', parts: ['Д', 'У', 'Б'], emoji: '🌳' },
  { word: 'НІС', parts: ['Н', 'І', 'С'], emoji: '👃' },
  { word: 'МАК', parts: ['М', 'А', 'К'], emoji: '🌺' },
  { word: 'РОТ', parts: ['Р', 'О', 'Т'], emoji: '👄' },
  { word: 'СУП', parts: ['С', 'У', 'П'], emoji: '🍲' },
];

/** Двоскладові слова — плитки-склади. */
export const SYL_WORDS: WordEntry[] = [
  { word: 'МАМА', parts: ['МА', 'МА'], emoji: '👩' },
  { word: 'ВОДА', parts: ['ВО', 'ДА'], emoji: '💧' },
  { word: 'РУКА', parts: ['РУ', 'КА'], emoji: '✋' },
  { word: 'ЖАБА', parts: ['ЖА', 'БА'], emoji: '🐸' },
  { word: 'КАША', parts: ['КА', 'ША'], emoji: '🥣' },
  { word: 'НОГА', parts: ['НО', 'ГА'], emoji: '🦶' },
  { word: 'ЛАПА', parts: ['ЛА', 'ПА'], emoji: '🐾' },
  { word: 'КОЗА', parts: ['КО', 'ЗА'], emoji: '🐐' },
  { word: 'ВАЗА', parts: ['ВА', 'ЗА'], emoji: '🏺' },
  { word: 'ЛУНА', parts: ['ЛУ', 'НА'], emoji: '🌙' },
];

export const ROUNDS = 5;
const EXTRA_LETTERS = ['М', 'Н', 'Л', 'С', 'Р', 'Т', 'К', 'А', 'О', 'У'];
const EXTRA_SYLS = ['МО', 'НА', 'ЛО', 'СА', 'РО', 'ТУ', 'ДО', 'ПА'];

export interface Task {
  entry: WordEntry;
  /** Плитки внизу (перемішані; на «складно» — з однією зайвою). */
  tiles: string[];
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

/** Перемішати так, щоб плитки не стояли вже в правильному порядку (інакше нічого складати). */
function scramble(parts: string[], rng: Rng): string[] {
  for (let k = 0; k < 10; k++) {
    const s = shuffle(parts, rng);
    if (s.join('|') !== parts.join('|')) return s;
  }
  return [...parts].reverse();
}

/** Сесія за довжиною слова (дошкілля): лише букви, без зайвих плиток. */
export function buildByLength(len: 3 | 4 | 5, rng: Rng = Math.random): Task[] {
  return shuffle(WORDS_BY_LEN[len], rng).slice(0, ROUNDS).map((entry) => ({ entry, tiles: scramble(entry.parts, rng) }));
}

/** Скільки букв зараз: стартуємо з 3; CLEAN_TO_LEVEL_UP чистих слів поспіль — довжина +1. */
export function nextLength(len: 3 | 4 | 5, cleanRun: number): 3 | 4 | 5 {
  return cleanRun >= CLEAN_TO_LEVEL_UP && len < 5 ? ((len + 1) as 4 | 5) : len;
}

export function buildTasks(d: Difficulty, rng: Rng = Math.random): Task[] {
  const pool = d === 1 ? LETTER_WORDS : d === 2 ? [...LETTER_WORDS, ...SYL_WORDS] : SYL_WORDS.concat(LETTER_WORDS);
  return shuffle(pool, rng).slice(0, ROUNDS).map((entry) => {
    let tiles = scramble(entry.parts, rng);
    if (d === 3) {
      const extras = (entry.parts[0].length === 1 ? EXTRA_LETTERS : EXTRA_SYLS).filter((x) => !entry.parts.includes(x));
      tiles = shuffle([...tiles, extras[Math.floor(rng() * extras.length)]], rng);
    }
    return { entry, tiles };
  });
}
