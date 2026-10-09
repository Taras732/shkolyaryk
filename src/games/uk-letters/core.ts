import type { Difficulty } from '../types';
import { LETTERS, withRandomWord, type Letter } from './letters';

/**
 * «Буква і звук» — буквар дошкілля як стежка з груп (рішення 09.10.2026, Scope §1.1 станції 7–8).
 *
 *  - 8 груп у порядку букваря; група = станція. Поточна — перша, де є не «знаю».
 *  - Свіжа група починається з ПЕРЕВІРКИ: 5 питань по її буквах; 5 правильних поспіль з першої
 *    спроби — уся група зарахована (швидкий прохід: хто знає — пробігає, рівень визначає гра).
 *  - Інакше вчимо: до 2 нових букв за сесію (знайомство), далі змішана практика.
 *  - Буква «знаю» після 3 правильних з першої спроби поспіль.
 *  - Вид питання росте з буквою: почуй і знайди (same) → картинка на букву (picture) → буква до слова (letter).
 *  - Повтор через 1 · 3 · 7 днів; пройшла третій повтор — «золота». Помилка в повторі — знову вчимо.
 *
 * Сумісність: LetterProgress лишається словником ch → стан; нові поля (seen, box, due) необовʼязкові.
 */

export const KNOWN_STREAK = 3;
export const QUICK_PASS = 5;
export const NEW_PER_SESSION = 2;
export const QUIZ_LEN = 8;
const DAY = 24 * 60 * 60 * 1000;
/** Інтервали повтору за коробками: після «знаю» → 1 день, далі 3, далі 7. */
const BOX_DAYS = [1, 3, 7];

export const GROUPS: { title: string; letters: string[] }[] = [
  { title: 'Голосні', letters: ['А', 'О', 'У', 'И', 'І', 'Е'] },
  { title: 'М Т Н Л', letters: ['М', 'Т', 'Н', 'Л'] },
  { title: 'С Р К П', letters: ['С', 'Р', 'К', 'П'] },
  { title: 'В Д З Б', letters: ['В', 'Д', 'З', 'Б'] },
  { title: 'Я Ю Є Ї', letters: ['Я', 'Ю', 'Є', 'Ї'] },
  { title: 'Г Ш Ч Х', letters: ['Г', 'Ш', 'Ч', 'Х'] },
  { title: 'Ж Ц Й Ф', letters: ['Ж', 'Ц', 'Й', 'Ф'] },
  { title: 'Щ Ґ Ь', letters: ['Щ', 'Ґ', 'Ь'] },
];

export interface LetterState {
  streak: number;
  ok: number;
  bad: number;
  last: number;
  /** Було знайомство з буквою (екран «Нова буква»). */
  seen?: boolean;
  /** Коробка повтору: 0 — ще вчимо; 1..3 — пройдено стільки повторів; 3 — «золота». */
  box?: number;
  /** Коли повторити (мс). */
  due?: number;
}

export type LetterProgress = Record<string, LetterState>;
export type Status = 'locked' | 'learning' | 'known' | 'gold';

const byCh = new Map(LETTERS.map((l) => [l.ch, l]));
export const letterOf = (ch: string) => byCh.get(ch)!;

export const isKnown = (s: LetterState | undefined) => !!s && s.streak >= KNOWN_STREAK;
/** Знайома: було знайомство або вже відповідала правильно (старий прогрес без поля seen, перевірка групи). */
export const isSeen = (s: LetterState | undefined) => !!s && (!!s.seen || s.ok > 0);
export const isGold = (s: LetterState | undefined) => !!s && (s.box ?? 0) >= BOX_DAYS.length;

export function statusOf(s: LetterState | undefined): Status {
  if (!s) return 'locked';
  if (isGold(s)) return 'gold';
  return isKnown(s) ? 'known' : 'learning';
}

/** Відкриті букви: усі, що вже траплялись. */
export function unlocked(p: LetterProgress): Letter[] {
  return LETTERS.filter((l) => p[l.ch]);
}

/** Індекс поточної групи (перша, де є не «знаю»); GROUPS.length — буквар пройдено. */
export function currentGroup(p: LetterProgress): number {
  const i = GROUPS.findIndex((g) => g.letters.some((ch) => !isKnown(p[ch])));
  return i === -1 ? GROUPS.length : i;
}

/** Свіжа група — жодна її буква ще не траплялась: починаємо з перевірки. */
export const isFresh = (p: LetterProgress, gi: number) => gi < GROUPS.length && GROUPS[gi].letters.every((ch) => !p[ch]);

/** Букви, яким настав день повтору. */
export function dueLetters(p: LetterProgress, now: number): Letter[] {
  return LETTERS.filter((l) => isKnown(p[l.ch]) && !isGold(p[l.ch]) && (p[l.ch].due ?? 0) <= now);
}

/** Сумісність зі старими викликами: наступна нова буква поточної групи (без знайомства). */
export function nextNewLetter(p: LetterProgress): Letter | null {
  const gi = currentGroup(p);
  if (gi >= GROUPS.length) return null;
  const ch = GROUPS[gi].letters.find((c) => !isSeen(p[c]));
  return ch ? letterOf(ch) : null;
}

/** Нові букви на сьогодні: незнайомі букви поточної групи, до NEW_PER_SESSION. */
export function newLetters(p: LetterProgress): Letter[] {
  const gi = currentGroup(p);
  if (gi >= GROUPS.length) return [];
  const g = GROUPS[gi].letters;
  // не більше двох «вчу» одночасно — інакше перевантаження
  const learning = g.filter((ch) => isSeen(p[ch]) && !isKnown(p[ch])).length;
  const room = Math.max(0, NEW_PER_SESSION - learning);
  return g.filter((ch) => !isSeen(p[ch])).slice(0, Math.max(room, learning === 0 ? 1 : 0)).map(letterOf);
}

export function record(p: LetterProgress, ch: string, firstTry: boolean, now: number): LetterProgress {
  const prev = p[ch] ?? { streak: 0, ok: 0, bad: 0, last: 0 };
  if (!firstTry) {
    // помилка: серія з нуля, повтор скасовано — знову вчимо
    return { ...p, [ch]: { ...prev, streak: 0, bad: prev.bad + 1, last: now, box: 0, due: undefined } };
  }
  const wasKnown = isKnown(prev);
  const streak = prev.streak + 1;
  let box = prev.box ?? 0;
  let due = prev.due;
  if (!wasKnown && streak >= KNOWN_STREAK) {
    box = 0;
    due = now + BOX_DAYS[0] * DAY; // щойно вивчили — повтор завтра
  } else if (wasKnown && (prev.due ?? Infinity) <= now) {
    box = Math.min(BOX_DAYS.length, box + 1); // вчасний повтор пройдено
    due = box < BOX_DAYS.length ? now + BOX_DAYS[box] * DAY : undefined;
  }
  return { ...p, [ch]: { ...prev, streak, ok: prev.ok + 1, last: now, box, due } };
}

/** Знайомство з буквою (після екрана «Нова буква»), відповіді не зараховуємо. */
export function open(p: LetterProgress, ch: string, now: number): LetterProgress {
  const prev = p[ch] ?? { streak: 0, ok: 0, bad: 0, last: now };
  return { ...p, [ch]: { ...prev, seen: true } };
}

/** Швидкий прохід: уся група — «знаю», повтор завтра. */
export function passGroup(p: LetterProgress, gi: number, now: number): LetterProgress {
  const out = { ...p };
  for (const ch of GROUPS[gi].letters) {
    const prev = out[ch] ?? { streak: 0, ok: 0, bad: 0, last: now };
    out[ch] = { ...prev, seen: true, streak: Math.max(prev.streak, KNOWN_STREAK), last: now, box: 0, due: now + BOX_DAYS[0] * DAY };
  }
  return out;
}

/**
 * same — почуй букву, знайди її (лише впізнати форму);
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

/** Вид питання росте разом із буквою; И та Ь — лише «почуй і знайди» (слово не з них починається). */
export function modeFor(l: Letter, s: LetterState | undefined, d: Difficulty): Mode {
  if (!l.initial) return 'same';
  const streak = s?.streak ?? 0;
  const step = Math.min(2, streak + (d === 3 ? 1 : 0));
  return (['same', 'picture', 'letter'] as const)[step];
}

/**
 * Відволікачі: спершу з тієї ж групи й відкритих, далі — з наступних за букварем.
 * Для «картинки» і «букви до слова» — лише букви з опорним словом на початку, слова на різні букви.
 */
function distractors(target: Letter, near: Letter[], mode: Mode, n: number, rng: Rng): Letter[] {
  const ok = (l: Letter) => l.ch !== target.ch && (mode === 'same' || l.initial) && l.word[0] !== target.word[0];
  const pool = [...shuffle(near.filter(ok), rng), ...shuffle(LETTERS.filter((l) => ok(l) && !near.includes(l)), rng)];
  return pool.slice(0, n);
}

function question(t: Letter, p: LetterProgress, near: Letter[], d: Difficulty, rng: Rng, mode?: Mode): Question {
  const m = mode ?? modeFor(t, p[t.ch], d);
  const n = d === 3 ? 4 : 3;
  // щоразу інше слово-картинка (банк MORE): «окуляри» більше не на кожне О
  const target = withRandomWord(t, rng);
  const others = distractors(t, near, m, n - 1, rng).map((l) => withRandomWord(l, rng));
  return { target, mode: m, options: shuffle([target, ...others], rng) };
}

/**
 * Перемішати так, щоб та сама буква не йшла двічі поспіль (коли це можливо):
 * жадібно беремо ту, якої лишилось найбільше, але не ту, що щойно була.
 */
function spread(targets: Letter[], rng: Rng): Letter[] {
  const rest = shuffle(targets, rng);
  const out: Letter[] = [];
  while (rest.length) {
    const last = out[out.length - 1]?.ch;
    const left = (ch: string) => rest.filter((x) => x.ch === ch).length;
    const cand = rest.filter((x) => x.ch !== last).sort((x, y) => left(y.ch) - left(x.ch));
    const pick = cand[0] ?? rest[0];
    rest.splice(rest.indexOf(pick), 1);
    out.push(pick);
  }
  return out;
}

/** Перевірка свіжої групи: QUICK_PASS питань «почуй і знайди» по її буквах. */
export function buildCheck(p: LetterProgress, gi: number, d: Difficulty, rng: Rng = Math.random): Question[] {
  const g = GROUPS[gi].letters.map(letterOf);
  const targets: Letter[] = [];
  while (targets.length < QUICK_PASS) targets.push(...shuffle(g, rng));
  return spread(targets.slice(0, QUICK_PASS), rng).map((t) => question(t, p, g, d, rng, 'same'));
}

/**
 * Практика сесії: нові букви (по 2 питання), слабкі букви групи, повтор за днями,
 * одна-дві вже відомі з попередніх груп — щоб не забувались.
 */
export function buildQuiz(p: LetterProgress, fresh: Letter[] | Letter | null, d: Difficulty, rng: Rng = Math.random, now = Date.now()): Question[] {
  const freshList = fresh === null ? [] : Array.isArray(fresh) ? fresh : [fresh];
  const open = unlocked(p);
  if (open.length === 0 && freshList.length === 0) return [];
  const gi = currentGroup(p);
  const group = gi < GROUPS.length ? GROUPS[gi].letters.map(letterOf) : [];
  const near = [...new Set([...group, ...open])];

  const targets: Letter[] = [];
  for (const f of freshList) targets.push(f, f);
  const weak = group.filter((l) => isSeen(p[l.ch]) && !isKnown(p[l.ch]) && !freshList.includes(l));
  targets.push(...shuffle(weak, rng).slice(0, 3));
  targets.push(...shuffle(dueLetters(p, now), rng).slice(0, 3));
  const known = open.filter((l) => isKnown(p[l.ch]) && !targets.includes(l));
  while (targets.length < QUIZ_LEN && (known.length || weak.length || freshList.length)) {
    const pool = known.length ? known : weak.length ? weak : freshList;
    targets.push(pool[Math.floor(rng() * pool.length)]);
  }
  return spread(targets.slice(0, QUIZ_LEN), rng).map((t) => question(t, p, near, d, rng));
}
