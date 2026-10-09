import type { Difficulty } from '../types';
import { ALL_LOOK_ALIKE, LOOK_ALIKE } from '../shared/look-alike';

/**
 * «Що тут зайве?» (переробка 09.10.2026). Чотири великі картки в сцені, одна зайва.
 * Після правильної відповіді зайчик ПОЯСНЮЄ, чому зайва («Решта — фрукти!») — це і є розвиток:
 * не вгадати, а назвати ознаку.
 *  сходинка 1 — три однакові + одна зовсім інша (уважність);
 *  сходинка 2 — три однакові + одна схожа (уважність до деталей: 🍎🍎🍅🍎);
 *  сходинка 3 — три з однієї групи + одна з іншої (класифікація: 🍎🍌🍐 + 🚗).
 */
export interface Category {
  id: string;
  /** «Решта — …» */
  plural: string;
  items: string[];
}

/** Чисті групи для класифікації (кожен емодзі — лише в одній групі). */
export const CATEGORIES: Category[] = [
  { id: 'animals', plural: 'тварини', items: ['🐶', '🐱', '🐰', '🐻', '🐼', '🦁', '🐯', '🐸'] },
  { id: 'fruits', plural: 'фрукти', items: ['🍎', '🍌', '🍐', '🍇', '🍓', '🍊', '🍉'] },
  { id: 'veggies', plural: 'овочі', items: ['🥕', '🥒', '🌽', '🥔', '🧅', '🥦'] },
  { id: 'transport', plural: 'транспорт', items: ['🚗', '🚌', '🚲', '✈️', '🚂', '🚀', '⛵'] },
  { id: 'clothes', plural: 'одяг', items: ['👕', '👖', '🧦', '🧢', '👗', '🧥'] },
  { id: 'flowers', plural: 'квіти', items: ['🌸', '🌻', '🌷', '🌹', '🌼'] },
  { id: 'sea', plural: 'морські мешканці', items: ['🐟', '🐠', '🐙', '🦀', '🐳'] },
];

export type Kind = 'different' | 'lookalike' | 'category';

export interface OddTask {
  items: string[];
  odd: number;
  kind: Kind;
  /** Для «category» — група решти (щоб пояснити «Решта — фрукти»). */
  category?: Category;
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

export function makeTask(kind: Kind, rng: Rng = Math.random): OddTask {
  let three: string[];
  let oddItem: string;
  let category: Category | undefined;
  if (kind === 'category') {
    const [c, other] = shuffle(CATEGORIES, rng);
    category = c;
    three = shuffle(c.items, rng).slice(0, 3);
    oddItem = pick(other.items, rng);
  } else {
    const g = pick(LOOK_ALIKE, rng);
    const main = pick(g, rng);
    three = [main, main, main];
    oddItem = kind === 'lookalike' ? pick(g.filter((e) => e !== main), rng) : pick(ALL_LOOK_ALIKE.filter((e) => !g.includes(e)), rng);
  }
  const odd = Math.floor(rng() * 4);
  const items = [...three];
  items.splice(odd, 0, oddItem);
  return { items, odd, kind, category };
}

/** Сесія: що вища сходинка, то більше складних видів; вид не повторюється тричі поспіль. */
export function buildTasks(d: Difficulty, rng: Rng = Math.random): OddTask[] {
  const plan: Kind[] =
    d === 1 ? ['different', 'different', 'different', 'lookalike', 'different', 'lookalike']
    : d === 2 ? ['lookalike', 'different', 'lookalike', 'category', 'lookalike', 'category']
    : ['category', 'lookalike', 'category', 'category', 'lookalike', 'category'];
  return plan.map((k) => makeTask(k, rng));
}

/** Пояснення після правильної відповіді (і ключ аудіо). */
export function explain(t: OddTask): { key: string; text: string } {
  if (t.kind === 'category' && t.category) return { key: `odd_${t.category.id}`, text: `Молодець! Решта — ${t.category.plural}.` };
  return { key: 'odd_same', text: 'Молодець! Решта — однакові.' };
}
