import type { Difficulty } from '../types';
import { WORDS, type Word } from './words';

/**
 * «Мої слова» — особистий словник англійської з інтервальним повтором.
 *
 * Слово проходить стани нове → вчу → знаю. Інтервали з методики vault
 * (`07_Home_Learning_OS/Methodology_and_Approach.md`): +1 день, +3, +тиждень,
 * далі +2 тижні. «Знаю» — слово пережило тижневий інтервал.
 *
 * Словник тримає не лише стартові слова: `custom` — слова, які дитина додала
 * сама (майбутня сторінка «Що в завданні?»), щоб повтор їх теж підхоплював.
 */

export const DAY = 24 * 60 * 60 * 1000;
/** Інтервал (днів) для коробки 1..5; коробка 0 — «вчу, повторити сьогодні». */
export const INTERVAL_DAYS = [0, 1, 3, 7, 14, 30];
export const KNOWN_BOX = 4;
export const NEW_PER_LESSON = 5;
export const REVIEW_MAX = 10;

export interface WordState {
  box: number;
  due: number;
  ok: number;
  bad: number;
  /** Коли дитина востаннє відповідала на це слово — для звіту «що зроблено сьогодні». */
  last?: number;
  /** Коли слово вперше з'явилось у словнику. */
  added?: number;
}

export interface Dict {
  words: Record<string, WordState>;
  /** Слова, додані дитиною поза стартовим списком. */
  custom: Word[];
}

export const emptyDict = (): Dict => ({ words: {}, custom: [] });

export type Status = 'new' | 'learning' | 'known';

export function statusOf(st: WordState | undefined): Status {
  if (!st) return 'new';
  return st.box >= KNOWN_BOX ? 'known' : 'learning';
}

export function allWords(dict: Dict): Word[] {
  const seen = new Set(WORDS.map((w) => w.en));
  return [...WORDS, ...dict.custom.filter((w) => !seen.has(w.en))];
}

export function counts(dict: Dict): Record<Status, number> {
  const out: Record<Status, number> = { new: 0, learning: 0, known: 0 };
  for (const w of allWords(dict)) out[statusOf(dict.words[w.en])]++;
  return out;
}

export function dueWords(dict: Dict, now: number): Word[] {
  return allWords(dict)
    .filter((w) => {
      const st = dict.words[w.en];
      return st && st.box < INTERVAL_DAYS.length && st.due <= now;
    })
    .sort((a, b) => dict.words[a.en].due - dict.words[b.en].due);
}

/** Нові слова для уроку: з обраної теми, інакше — з першої теми, де ще є нові. */
export function newWords(dict: Dict, topic?: string, n = NEW_PER_LESSON): Word[] {
  const fresh = allWords(dict).filter((w) => !dict.words[w.en]);
  const pool = topic ? fresh.filter((w) => w.topic === topic) : fresh.filter((w) => w.topic === fresh[0]?.topic);
  return pool.slice(0, n);
}

/**
 * Записати відповідь. Правильно з першої спроби → наступна коробка і довший
 * інтервал; помилка → коробка 0, повтор сьогодні (і ще раз у цій же сесії).
 */
export function record(dict: Dict, en: string, firstTry: boolean, now: number): Dict {
  const prev: WordState = dict.words[en] ?? { box: 0, due: now, ok: 0, bad: 0, added: now };
  const box = firstTry ? Math.min(prev.box + 1, INTERVAL_DAYS.length - 1) : 0;
  const next: WordState = {
    box,
    due: now + INTERVAL_DAYS[box] * DAY,
    ok: prev.ok + (firstTry ? 1 : 0),
    bad: prev.bad + (firstTry ? 0 : 1),
    last: now,
    added: prev.added ?? now,
  };
  return { ...dict, words: { ...dict.words, [en]: next } };
}

export function addCustom(dict: Dict, word: Omit<Word, 'topic'>): Dict {
  if (allWords(dict).some((w) => w.en === word.en)) return dict;
  return { ...dict, custom: [...dict.custom, { ...word, topic: 'mine' }] };
}

// ---------- питання ----------

/**
 * listen — почути слово, обрати картинку (без читання: для молодших і для вимови);
 * read — прочитати слово, обрати картинку;
 * translate — прочитати слово, обрати переклад.
 */
export type QuizMode = 'listen' | 'read' | 'translate';

export interface Quiz {
  word: Word;
  mode: QuizMode;
  options: Word[];
}

export function modesFor(difficulty: Difficulty): QuizMode[] {
  if (difficulty === 1) return ['listen'];
  if (difficulty === 2) return ['listen', 'read'];
  return ['listen', 'read', 'translate'];
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

/** 3 відволікачі: спершу з тієї ж теми (кольори між кольорами), без збігу картинки чи перекладу. */
export function distractors(word: Word, pool: Word[], rng: Rng, n = 3): Word[] {
  const others = pool.filter((w) => w.en !== word.en && w.emoji !== word.emoji && w.ua !== word.ua);
  const same = shuffle(others.filter((w) => w.topic === word.topic), rng);
  const rest = shuffle(others.filter((w) => w.topic !== word.topic), rng);
  return [...same, ...rest].slice(0, n);
}

export function buildQuiz(words: Word[], difficulty: Difficulty, dict: Dict, rng: Rng = Math.random): Quiz[] {
  const pool = allWords(dict);
  const modes = modesFor(difficulty);
  return shuffle(words, rng).map((word, i) => ({
    word,
    mode: modes[i % modes.length],
    options: shuffle([word, ...distractors(word, pool, rng)], rng),
  }));
}
