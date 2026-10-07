import type { ClassLevel, Difficulty, GameExplain, LevelData, Round } from '../types';
import { randInt, shuffle } from '../shared/ui';

/**
 * Текстові задачі v2 (аудит 07.10).
 *
 * Навіщо переробка: було 11 шаблонів на всі класи, а множення — один шаблон і
 * лише на «Складно» без підказки. Саме тут буксує другокласниця: «задачу
 * порахувала, але не зрозуміла, що через множення». Тепер:
 *  - задачі масштабуються за КЛАСОМ (межі чисел, набір дій);
 *  - у задачі на одну дію спершу крок «Яка тут дія?» — тренуємо СЕНС дії,
 *    а не лише обчислення; хибний вибір пояснюється ознакою з тексту
 *    («порівну», «по … у кожній», «на скільки більше»);
 *  - шаблони на × і ÷ з'являються з «Легко» у 2 класі, з підказкою групами.
 *
 * Складність: 1 — одна дія, прості сюжети, підказка є; 2 — усі типи однієї дії
 * (включно з «на … більше/менше», «у … рази»), підказка є; 3 — мікс однієї дії
 * і задач на дві дії, без підказки.
 */

export type Op = '+' | '−' | '×' | '÷';
export const OPS: Op[] = ['+', '−', '×', '÷'];
export const OP_LABEL: Record<Op, string> = { '+': 'додати', '−': 'відняти', '×': 'помножити', '÷': 'поділити' };

/** Відповідь «обрала дію»: −1…−4 (індекс у OPS). Числа-відповіді завжди ≥ 0. */
export const opAnswer = (op: Op): number => -(OPS.indexOf(op) + 1);
export const opFromAnswer = (answer: number): Op | null => (answer < 0 && answer >= -4 ? OPS[-answer - 1] : null);

/** Підказка CPA: смужки для +/−, групи для ×/÷. */
export type Hint =
  | { kind: 'bars'; steps: { emoji: string; count: number; op?: '+' | '−' }[] }
  | { kind: 'groups'; groups: number; per: number; emoji: string };

export interface WordProblemPayload {
  text: string;
  emoji: string;
  /** Дія для кроку «Яка тут дія?». null — задача на дві дії, крок пропускається. */
  op: Op | null;
  /** Операнди однієї дії — щоб розпізнати «зробила не ту дію». */
  x: number;
  y: number;
  /** Чому саме ця дія — ознака з тексту. */
  cue: string;
  /** Розв'язок по кроках, для пояснення помилки. */
  solution: string[];
  hint: Hint | null;
  /** Дії, з яких дитина обирає (у 1 класі множення ще немає). */
  ops: Op[];
}

type Problem = Omit<WordProblemPayload, 'hint' | 'ops'> & { answer: number; hint: Hint | null };

interface ClassCfg {
  addMax: number;
  /** Найбільший множник для ×/÷ (0 — множення ще не вивчали). */
  mulMax: number;
}

const CLASS_CFG: Record<ClassLevel, Record<Difficulty, ClassCfg>> = {
  // дошкілля гри не бачить (levels: L3); значення — безпечний дефолт
  preschool: { 1: { addMax: 10, mulMax: 0 }, 2: { addMax: 10, mulMax: 0 }, 3: { addMax: 20, mulMax: 0 } },
  grade1: { 1: { addMax: 20, mulMax: 0 }, 2: { addMax: 20, mulMax: 0 }, 3: { addMax: 20, mulMax: 0 } },
  grade2: { 1: { addMax: 100, mulMax: 5 }, 2: { addMax: 100, mulMax: 9 }, 3: { addMax: 100, mulMax: 9 } },
  grade3: { 1: { addMax: 500, mulMax: 9 }, 2: { addMax: 1000, mulMax: 9 }, 3: { addMax: 1000, mulMax: 9 } },
  grade4: { 1: { addMax: 1000, mulMax: 9 }, 2: { addMax: 1000, mulMax: 9 }, 3: { addMax: 1000, mulMax: 9 } },
};

const ROUNDS_PER_LEVEL = 5;

// ---------- мова ----------

/** Форми іменника: [1, 2-4, 5+]. */
type Forms = [string, string, string];

export function plural(n: number, forms: Forms): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}

/**
 * Число для тексту: уникає «одиничної» форми (21, 31…), бо там, де іменник —
 * знахідний відмінок («дала 21 гривню»), plural() дає називний.
 */
function safe(min: number, max: number): number {
  const n = randInt(min, Math.max(min, max));
  if (n % 10 === 1 && n % 100 !== 11 && n > 1) return n + 1 <= max ? n + 1 : Math.max(min, n - 1);
  return n;
}

/** «у 3 рази», «у 5 разів». */
const times = (k: number) => `${k} ${plural(k, ['раз', 'рази', 'разів'])}`;

const pick = <T,>(arr: readonly T[]): T => arr[randInt(0, arr.length - 1)];

interface Name {
  nom: string;
  gen: string;
  /** «прочитав» / «прочитала» — рід для дієслова минулого часу */
  read: string;
}

const NAMES: Name[] = [
  { nom: 'Оленка', gen: 'Оленки', read: 'прочитала' },
  { nom: 'Максим', gen: 'Максима', read: 'прочитав' },
  { nom: 'Софійка', gen: 'Софійки', read: 'прочитала' },
  { nom: 'Іван', gen: 'Івана', read: 'прочитав' },
  { nom: 'Марійка', gen: 'Марійки', read: 'прочитала' },
  { nom: 'Олег', gen: 'Олега', read: 'прочитав' },
  { nom: 'Назар', gen: 'Назара', read: 'прочитав' },
];

function twoNames(): [Name, Name] {
  const a = pick(NAMES);
  let b = pick(NAMES);
  while (b === a) b = pick(NAMES);
  return [a, b];
}

/** Межа для доданків: старшим — тризначні числа, але задача лишається «читабельною». */
function addRange(cfg: ClassCfg): [number, number] {
  if (cfg.addMax <= 20) return [2, 20];
  if (cfg.addMax <= 100) return [12, 99];
  return [120, Math.min(cfg.addMax, 900)];
}

// ---------- шаблони на одну дію ----------

type Template = (cfg: ClassCfg) => Problem;

const addJoin: Template = (cfg) => {
  const [lo, hi] = addRange(cfg);
  const f: Forms = ['книжка', 'книжки', 'книжок'];
  const a = safe(lo, Math.floor(hi * 0.6));
  const b = safe(Math.max(2, Math.floor(lo / 2)), hi - a);
  return {
    text: `На полиці стояло ${a} ${plural(a, f)}. Бібліотекарка поставила ще ${b}. Скільки книжок стало на полиці?`,
    emoji: '📚', op: '+', x: a, y: b, answer: a + b,
    cue: '«Поставили ще», «стало» — кількість збільшилась: додаємо',
    solution: [`${a} + ${b} = ${a + b}`],
    hint: { kind: 'bars', steps: [{ emoji: '📕', count: a }, { emoji: '📕', count: b, op: '+' }] },
  };
};

const subTake: Template = (cfg) => {
  const [lo, hi] = addRange(cfg);
  const f: Forms = ['цукерка', 'цукерки', 'цукерок'];
  const a = safe(Math.max(lo, 8), hi);
  const b = safe(2, a - 2);
  return {
    text: `У вазі було ${a} ${plural(a, f)}. Діти з'їли ${b}. Скільки цукерок залишилось у вазі?`,
    emoji: '🍬', op: '−', x: a, y: b, answer: a - b,
    cue: '«З\'їли», «залишилось» — кількість зменшилась: віднімаємо',
    solution: [`${a} − ${b} = ${a - b}`],
    hint: { kind: 'bars', steps: [{ emoji: '🍬', count: a }, { emoji: '🍬', count: b, op: '−' }] },
  };
};

const addMore: Template = (cfg) => {
  const [lo, hi] = addRange(cfg);
  const f: Forms = ['марка', 'марки', 'марок'];
  const [p, q] = twoNames();
  const a = safe(lo, Math.floor(hi * 0.6));
  const b = safe(2, Math.min(hi - a, Math.max(9, Math.floor(hi / 3))));
  return {
    text: `У ${p.gen} ${a} ${plural(a, f)}, а в ${q.gen} — на ${b} більше. Скільки марок у ${q.gen}?`,
    emoji: '✉️', op: '+', x: a, y: b, answer: a + b,
    cue: `«На ${b} більше» — це стільки ж, та ще ${b}: додаємо`,
    solution: [`${a} + ${b} = ${a + b}`],
    hint: { kind: 'bars', steps: [{ emoji: '✉️', count: a }, { emoji: '✉️', count: b, op: '+' }] },
  };
};

const subLess: Template = (cfg) => {
  const [lo, hi] = addRange(cfg);
  const f: Forms = ['наліпка', 'наліпки', 'наліпок'];
  const [p, q] = twoNames();
  const a = safe(Math.max(lo, 10), hi);
  const b = safe(2, Math.min(a - 2, Math.max(9, Math.floor(hi / 3))));
  return {
    text: `У ${p.gen} ${a} ${plural(a, f)}, а в ${q.gen} — на ${b} менше. Скільки наліпок у ${q.gen}?`,
    emoji: '⭐', op: '−', x: a, y: b, answer: a - b,
    cue: `«На ${b} менше» — це стільки ж, але без ${b}: віднімаємо`,
    solution: [`${a} − ${b} = ${a - b}`],
    hint: { kind: 'bars', steps: [{ emoji: '⭐', count: a }, { emoji: '⭐', count: b, op: '−' }] },
  };
};

const subCompare: Template = (cfg) => {
  const [lo, hi] = addRange(cfg);
  const f: Forms = ['намистинка', 'намистинки', 'намистинок'];
  const [p, q] = twoNames();
  const a = safe(Math.max(lo, 10), hi);
  const b = safe(Math.max(2, Math.floor(a / 3)), a - 2);
  return {
    text: `У ${p.gen} ${a} ${plural(a, f)}, а в ${q.gen} — ${b} ${plural(b, f)}. На скільки намистинок у ${p.gen} більше?`,
    emoji: '📿', op: '−', x: a, y: b, answer: a - b,
    cue: '«На скільки більше?» — порівнюємо: від більшого віднімаємо менше',
    solution: [`${a} − ${b} = ${a - b}`],
    hint: { kind: 'bars', steps: [{ emoji: '📿', count: a }, { emoji: '📿', count: b, op: '−' }] },
  };
};

const mulGroups: Template = (cfg) => {
  const f: Forms = ['олівець', 'олівці', 'олівців'];
  const k = randInt(2, cfg.mulMax);
  const n = randInt(2, cfg.mulMax);
  return {
    text: `У кожній з ${k} коробок лежить по ${n} ${plural(n, f)}. Скільки всього олівців?`,
    emoji: '✏️', op: '×', x: n, y: k, answer: n * k,
    cue: `Однакові групи: ${k} разів по ${n} — це множення`,
    solution: [`${n} × ${k} = ${n * k}`],
    hint: { kind: 'groups', groups: k, per: n, emoji: '✏️' },
  };
};

const mulTimes: Template = (cfg) => {
  const f: Forms = ['сторінку', 'сторінки', 'сторінок'];
  const [p, q] = twoNames();
  const n = randInt(2, cfg.mulMax);
  const k = randInt(2, Math.min(cfg.mulMax, 5));
  return {
    text: `${p.nom} ${p.read} ${n} ${plural(n, f)}, а ${q.nom} — у ${times(k)} більше. Скільки сторінок ${q.read} ${q.nom}?`,
    emoji: '📖', op: '×', x: n, y: k, answer: n * k,
    cue: `«У ${times(k)} більше» — ${k} разів по ${n}: множимо`,
    solution: [`${n} × ${k} = ${n * k}`],
    hint: { kind: 'groups', groups: k, per: n, emoji: '📄' },
  };
};

const divShare: Template = (cfg) => {
  const f: Forms = ['яблуко', 'яблука', 'яблук'];
  const k = randInt(2, cfg.mulMax);
  const n = randInt(2, cfg.mulMax);
  const a = n * k;
  return {
    text: `Мама розділила ${a} ${plural(a, f)} порівну між ${k} дітьми. Скільки яблук отримала кожна дитина?`,
    emoji: '🍎', op: '÷', x: a, y: k, answer: n,
    cue: '«Порівну між» — ділимо на рівні частини: це ділення',
    solution: [`${a} ÷ ${k} = ${n}`, `Перевірка: ${n} × ${k} = ${a}`],
    hint: { kind: 'groups', groups: k, per: n, emoji: '🍎' },
  };
};

const divGroup: Template = (cfg) => {
  const f: Forms = ['квітку', 'квітки', 'квіток'];
  const n = randInt(2, cfg.mulMax);
  const k = randInt(2, cfg.mulMax);
  const a = n * k;
  return {
    text: `Оленка розставила ${a} ${plural(a, f)} у вази, по ${n} у кожну. Скільки ваз знадобилось?`,
    emoji: '💐', op: '÷', x: a, y: n, answer: k,
    cue: `Скільки разів по ${n} вміщується в ${a} — це ділення`,
    solution: [`${a} ÷ ${n} = ${k}`, `Перевірка: ${n} × ${k} = ${a}`],
    hint: { kind: 'groups', groups: k, per: n, emoji: '🌷' },
  };
};

const divTimes: Template = (cfg) => {
  const f: Forms = ['машинка', 'машинки', 'машинок'];
  const [p, q] = twoNames();
  const n = randInt(2, cfg.mulMax);
  const k = randInt(2, Math.min(cfg.mulMax, 5));
  const a = n * k;
  return {
    text: `У ${p.gen} ${a} ${plural(a, f)}, а в ${q.gen} — у ${times(k)} менше. Скільки машинок у ${q.gen}?`,
    emoji: '🚗', op: '÷', x: a, y: k, answer: n,
    cue: `«У ${times(k)} менше» — ділимо на ${k}`,
    solution: [`${a} ÷ ${k} = ${n}`],
    hint: { kind: 'groups', groups: k, per: n, emoji: '🚗' },
  };
};

// ---------- на дві дії (лише «Складно», без кроку вибору дії) ----------

const twoAddSub: Template = (cfg) => {
  const [lo, hi] = addRange(cfg);
  const f: Forms = ['цукерка', 'цукерки', 'цукерок'];
  const a = safe(Math.max(lo, 6), Math.floor(hi * 0.5));
  const b = safe(2, Math.floor((hi - a) * 0.6));
  const c = safe(2, a + b - 2);
  return {
    text: `У магазині було ${a} ${plural(a, f)}. Привезли ще ${b}, а потім продали ${c}. Скільки цукерок залишилось?`,
    emoji: '🏪', op: null, x: 0, y: 0, answer: a + b - c,
    cue: 'Дві дії: спершу скільки стало (+), потім скільки залишилось (−)',
    solution: [`1) ${a} + ${b} = ${a + b}`, `2) ${a + b} − ${c} = ${a + b - c}`],
    hint: null,
  };
};

const twoGroupsSub: Template = (cfg) => {
  const f: Forms = ['пакет', 'пакети', 'пакетів'];
  const k = randInt(2, cfg.mulMax);
  const n = randInt(3, cfg.mulMax);
  const c = randInt(1, n * k - 2);
  return {
    text: `Тато купив ${k} ${plural(k, f)} кульок, у кожному по ${n}. На святі лопнуло ${c}. Скільки кульок лишилось?`,
    emoji: '🎈', op: null, x: 0, y: 0, answer: n * k - c,
    cue: 'Дві дії: спершу скільки всього (×), потім скільки лишилось (−)',
    solution: [`1) ${n} × ${k} = ${n * k}`, `2) ${n * k} − ${c} = ${n * k - c}`],
    hint: null,
  };
};

const twoShareAdd: Template = (cfg) => {
  const k = randInt(2, cfg.mulMax);
  const n = randInt(2, cfg.mulMax);
  const c = randInt(2, 9);
  const a = n * k;
  return {
    text: `Білка розклала ${a} ${plural(a, ['горіх', 'горіхи', 'горіхів'])} порівну в ${k} ${plural(k, ['дупло', 'дупла', 'дупел'])}. Потім у кожне дупло додала ще ${c}. Скільки горіхів тепер у кожному дуплі?`,
    emoji: '🐿️', op: null, x: 0, y: 0, answer: n + c,
    cue: 'Дві дії: спершу порівну (÷), потім додала (+)',
    solution: [`1) ${a} ÷ ${k} = ${n}`, `2) ${n} + ${c} = ${n + c}`],
    hint: null,
  };
};

const twoAddOnly: Template = (cfg) => {
  // 1 клас: дві дії без множення
  const [, hi] = addRange(cfg);
  const a = safe(3, Math.floor(hi / 2));
  const b = safe(2, Math.floor((hi - a) / 2));
  const c = safe(1, Math.max(1, hi - a - b));
  return {
    text: `На гілці сиділо ${a} ${plural(a, ['пташка', 'пташки', 'пташок'])}. Прилетіло ще ${b}, а потім ще ${c}. Скільки пташок стало на гілці?`,
    emoji: '🐦', op: null, x: 0, y: 0, answer: a + b + c,
    cue: 'Дві дії: двічі додаємо',
    solution: [`1) ${a} + ${b} = ${a + b}`, `2) ${a + b} + ${c} = ${a + b + c}`],
    hint: null,
  };
};

// ---------- підбір ----------

const ADD_SUB_BASIC = [addJoin, subTake];
const ADD_SUB_ALL = [addJoin, subTake, addMore, subLess, subCompare];
const MUL_BASIC = [mulGroups, divShare];
const MUL_ALL = [mulGroups, mulTimes, divShare, divGroup, divTimes];

/** 5 шаблонів на рівень. У класах з множенням — хоч дві задачі на ×/÷ щоразу. */
export function templatesFor(classLevel: ClassLevel, difficulty: Difficulty): Template[] {
  const cfg = CLASS_CFG[classLevel][difficulty];
  const hasMul = cfg.mulMax > 0;
  if (!hasMul) {
    if (difficulty === 1) return Array.from({ length: ROUNDS_PER_LEVEL }, () => pick(ADD_SUB_BASIC));
    if (difficulty === 2) return Array.from({ length: ROUNDS_PER_LEVEL }, () => pick(ADD_SUB_ALL));
    return shuffle([pick(ADD_SUB_ALL), pick(ADD_SUB_ALL), pick(ADD_SUB_ALL), twoAddSub, twoAddOnly]);
  }
  if (difficulty === 1) return shuffle([pick(MUL_BASIC), pick(MUL_BASIC), pick(ADD_SUB_BASIC), pick(ADD_SUB_BASIC), pick([...MUL_BASIC, ...ADD_SUB_BASIC])]);
  if (difficulty === 2) return shuffle([pick(MUL_ALL), pick(MUL_ALL), pick(ADD_SUB_ALL), pick(ADD_SUB_ALL), pick([...MUL_ALL, ...ADD_SUB_ALL])]);
  return shuffle([pick(MUL_ALL), pick(MUL_ALL), pick(ADD_SUB_ALL), pick([twoAddSub, twoGroupsSub, twoShareAdd]), pick([twoGroupsSub, twoShareAdd])]);
}

/** Дії, з яких дитина обирає: у 1 класі множення ще немає. */
export function opsFor(classLevel: ClassLevel): Op[] {
  return CLASS_CFG[classLevel][3].mulMax > 0 ? OPS : ['+', '−'];
}

export function generate(difficulty: Difficulty, _level?: unknown, classLevel: ClassLevel = 'grade2'): LevelData<WordProblemPayload, number> {
  const cfg = CLASS_CFG[classLevel][difficulty];
  const rounds: Round<WordProblemPayload, number>[] = templatesFor(classLevel, difficulty).map((tmpl, i) => {
    const { answer, ...p } = tmpl(cfg);
    return { id: `r${i}`, payload: { ...p, hint: difficulty === 3 ? null : p.hint, ops: opsFor(classLevel) }, answer };
  });
  return { difficulty, rounds };
}

function apply(op: Op, x: number, y: number): number {
  if (op === '+') return x + y;
  if (op === '−') return x - y;
  if (op === '×') return x * y;
  return y !== 0 && x % y === 0 ? x / y : NaN;
}

/** EP1: хибна дія → ознака з тексту; хибне число → розв'язок, а якщо це інша дія — так і кажемо. */
export function explainWordProblem(round: Round<WordProblemPayload, number>, answer: number): GameExplain {
  const p = round.payload;
  const chosen = opFromAnswer(answer);
  if (chosen && p.op) {
    return { steps: [p.cue, `Отже, треба ${OP_LABEL[p.op]}`], why: `«${OP_LABEL[chosen]}» тут не підходить` };
  }
  if (p.op) {
    const other = OPS.find((o) => o !== p.op && apply(o, p.x, p.y) === answer);
    if (other) return { steps: p.solution, why: `Це ${p.x} ${other} ${p.y}. А тут треба ${OP_LABEL[p.op]}` };
  }
  return { steps: p.solution };
}
