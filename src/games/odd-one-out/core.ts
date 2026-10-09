import type { Difficulty } from '../types';

/**
 * «Що тут зайве?» — лише КЛАСИФІКАЦІЯ (рішення Тараса 09.10.2026: однакові картинки не змушують думати).
 * Чотири картки: три з однієї категорії, одна — ні. Після відповіді зайчик пояснює: «Решта — меблі».
 * Сходинки — наскільки близько зайва:
 *  1 — з ДАЛЕКОЇ категорії (інша «сімʼя»: меблі + рослина);
 *  2 — з СУСІДНЬОЇ категорії тієї ж сімʼї (фрукти + овоч, тварини + морський мешканець);
 *  3 — за ОЗНАКОЮ (літають / плавають / домашні тварини / солодке).
 */
export type Family = 'living' | 'food' | 'things';

export interface Category {
  id: string;
  /** «Решта — …» */
  plural: string;
  family: Family;
  items: string[];
}

/** Категорії (кожен емодзі — лише в одній; перевіряє тест). */
export const CATEGORIES: Category[] = [
  { id: 'animals', plural: 'тварини', family: 'living', items: ['🐶', '🐱', '🐰', '🐻', '🐼', '🦁', '🐯', '🐸'] },
  { id: 'sea', plural: 'морські мешканці', family: 'living', items: ['🐟', '🐠', '🐙', '🦀', '🐳'] },
  { id: 'plants', plural: 'рослини', family: 'living', items: ['🌳', '🌵', '🌲', '🌴', '🪴'] },
  { id: 'flowers', plural: 'квіти', family: 'living', items: ['🌸', '🌻', '🌷', '🌹', '🌼'] },
  { id: 'fruits', plural: 'фрукти', family: 'food', items: ['🍎', '🍌', '🍐', '🍇', '🍓', '🍊', '🍉'] },
  { id: 'veggies', plural: 'овочі', family: 'food', items: ['🥕', '🥒', '🌽', '🥔', '🧅', '🥦'] },
  { id: 'sweets', plural: 'солодощі', family: 'food', items: ['🍰', '🍭', '🍫', '🍬', '🍩', '🧁'] },
  { id: 'furniture', plural: 'меблі', family: 'things', items: ['🪑', '🛋️', '🛏️', '🚪', '🪟'] },
  { id: 'transport', plural: 'транспорт', family: 'things', items: ['🚗', '🚌', '🚲', '🚂', '⛵', '🚜'] },
  { id: 'clothes', plural: 'одяг', family: 'things', items: ['👕', '👖', '🧦', '🧢', '👗', '🧥'] },
  { id: 'toys', plural: 'іграшки', family: 'things', items: ['🧸', '🪀', '🪁', '🎈', '🪆'] },
  { id: 'dishes', plural: 'посуд', family: 'things', items: ['🍽️', '🥄', '🍴', '☕', '🫖', '🥣'] },
];

/** Ознаки (сходинка 3): у «так» — предмети з різних категорій, що мають ознаку; «ні» — схожі, але без неї. */
export interface Trait {
  id: string;
  plural: string;
  yes: string[];
  no: string[];
}
export const TRAITS: Trait[] = [
  { id: 'fly', plural: 'літають', yes: ['🐦', '✈️', '🦋', '🚁', '🦅', '🐝'], no: ['🚗', '🐢', '🐌', '🚂', '🐘'] },
  { id: 'swim', plural: 'плавають', yes: ['🦆', '🐬', '🛥️', '🦭', '🐧'], no: ['🐓', '🚕', '🦒', '🐿️'] },
  { id: 'pets', plural: 'домашні тварини', yes: ['🐄', '🐖', '🐓', '🐐', '🐕', '🐈'], no: ['🦁', '🐺', '🦊', '🦓', '🐊'] },
  { id: 'cold', plural: 'холодне', yes: ['🍦', '🧊', '⛄', '🍧'], no: ['🔥', '☀️', '🍵', '🌶️'] },
];

export interface OddTask {
  items: string[];
  odd: number;
  /** «Решта — …» і ключ аудіо пояснення. */
  plural: string;
  why: string;
}

export const ROUNDS = 6;

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

function place(three: string[], oddItem: string, rng: Rng): { items: string[]; odd: number } {
  const odd = Math.floor(rng() * 4);
  const items = [...three];
  items.splice(odd, 0, oddItem);
  return { items, odd };
}

export function makeTask(step: 1 | 2 | 3, rng: Rng = Math.random): OddTask {
  if (step === 3) {
    const t = pick(TRAITS, rng);
    const { items, odd } = place(shuffle(t.yes, rng).slice(0, 3), pick(t.no, rng), rng);
    return { items, odd, plural: t.plural, why: `odd_${t.id}` };
  }
  const c = pick(CATEGORIES, rng);
  // 1 — зайва з іншої «сімʼї» (далеко); 2 — з тієї ж сімʼї, але іншої категорії (близько)
  const others = CATEGORIES.filter((o) => o.id !== c.id && (step === 1 ? o.family !== c.family : o.family === c.family));
  const o = pick(others, rng);
  const { items, odd } = place(shuffle(c.items, rng).slice(0, 3), pick(o.items, rng), rng);
  return { items, odd, plural: c.plural, why: `odd_${c.id}` };
}

/** Сесія: сходинка гри задає переважну складність, з однією-двома легшими для впевненості. */
export function buildTasks(d: Difficulty, rng: Rng = Math.random): OddTask[] {
  const plan: (1 | 2 | 3)[] = d === 1 ? [1, 1, 1, 1, 2, 1] : d === 2 ? [1, 2, 2, 1, 2, 2] : [2, 3, 2, 3, 3, 3];
  return plan.map((s) => makeTask(s, rng));
}

export function explain(t: OddTask): { key: string; text: string } {
  return { key: t.why, text: `Молодець! Решта — ${t.plural}.` };
}
