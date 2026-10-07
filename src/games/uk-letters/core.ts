import type { Difficulty } from '../types';
import { LETTERS, type Letter } from './letters';

/**
 * «Буква і звук» — буквар для дошкільнят (кейс Марії: букви з нуля, сильний
 * фонематичний слух — тому спираємось на звук слова, а не на назву букви).
 *
 * Кожна сесія: одна нова буква (знайомство) + 6 питань по вже відкритих буквах,
 * половина — на нову. Буква «знаю» після 3 правильних з першої спроби поспіль.
 * Нова буква відкривається, лише коли всі попередні вже «знаю» — темп дитини,
 * а не календаря.
 */

export const KNOWN_STREAK = 3;
export const QUIZ_LEN = 6;

export interface LetterState {
  streak: number;
  ok: number;
  bad: number;
  last: number;
}

export type LetterProgress = Record<string, LetterState>;

export const isKnown = (s: LetterState | undefined) => !!s && s.streak >= KNOWN_STREAK;

/** Відкриті букви: усі, що вже траплялись. */
export function unlocked(p: LetterProgress): Letter[] {
  return LETTERS.filter((l) => p[l.ch]);
}

/** Наступна нова буква — тільки коли відкриті вже всі «знаю». null — нової сьогодні немає. */
export function nextNewLetter(p: LetterProgress): Letter | null {
  const open = unlocked(p);
  if (open.some((l) => !isKnown(p[l.ch]))) return null;
  return LETTERS.find((l) => !p[l.ch]) ?? null;
}

export function record(p: LetterProgress, ch: string, firstTry: boolean, now: number): LetterProgress {
  const prev = p[ch] ?? { streak: 0, ok: 0, bad: 0, last: 0 };
  const next = firstTry
    ? { streak: prev.streak + 1, ok: prev.ok + 1, bad: prev.bad, last: now }
    : { streak: 0, ok: prev.ok, bad: prev.bad + 1, last: now };
  return { ...p, [ch]: next };
}

/** Відкрити букву (після знайомства), не зараховуючи відповіді. */
export function open(p: LetterProgress, ch: string, now: number): LetterProgress {
  return p[ch] ? p : { ...p, [ch]: { streak: 0, ok: 0, bad: 0, last: now } };
}

/**
 * same — показали букву, знайди таку саму (лише впізнати форму);
 * picture — показали букву, знайди картинку, що з неї починається;
 * letter — почуй/побач слово-картинку, знайди букву, з якої воно починається.
 */
export type Mode = 'same' | 'picture' | 'letter';

export interface Question {
  target: Letter;
  mode: Mode;
  options: Letter[];
  /** Повернуте після помилки питання — його відповідь у прогрес не пишемо вдруге. */
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

export function modesFor(d: Difficulty): Mode[] {
  if (d === 1) return ['same', 'picture'];
  if (d === 2) return ['same', 'picture', 'letter'];
  return ['picture', 'letter'];
}

/** Для И та Ь опорне слово не починається з букви — для них лише «знайди таку саму». */
function modeFor(l: Letter, modes: Mode[], i: number): Mode {
  if (!l.initial) return 'same';
  return modes[i % modes.length];
}

/**
 * Відволікачі: з відкритих, далі — з наступних за букварем. Для «картинки» —
 * лише букви з опорним словом на початку, інакше варіанти неоднозначні.
 */
function distractors(target: Letter, open: Letter[], mode: Mode, n: number, rng: Rng): Letter[] {
  const ok = (l: Letter) => l.ch !== target.ch && (mode === 'same' || l.initial) && l.word[0] !== target.word[0];
  const pool = [...shuffle(open.filter(ok), rng), ...shuffle(LETTERS.filter((l) => ok(l) && !open.includes(l)), rng)];
  return pool.slice(0, n);
}

export function buildQuiz(p: LetterProgress, fresh: Letter | null, d: Difficulty, rng: Rng = Math.random): Question[] {
  const open = unlocked(p);
  if (open.length === 0) return [];
  const modes = modesFor(d);
  const optCount = d === 3 ? 4 : 3;
  // половина питань — на нову букву, решта — на відкриті, слабкі частіше
  const targets: Letter[] = [];
  for (let i = 0; i < QUIZ_LEN; i++) {
    if (fresh && i % 2 === 0) targets.push(fresh);
    else {
      const weak = open.filter((l) => !isKnown(p[l.ch]));
      const pool = weak.length > 0 && rng() < 0.7 ? weak : open;
      targets.push(pool[Math.floor(rng() * pool.length)]);
    }
  }
  return shuffle(targets, rng).map((t, i) => {
    const mode = modeFor(t, modes, i);
    return { target: t, mode, options: shuffle([t, ...distractors(t, open, mode, optCount - 1, rng)], rng) };
  });
}
