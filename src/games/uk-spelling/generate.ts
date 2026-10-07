import type { ClassLevel, Difficulty, GameExplain, LevelData, Round } from '../types';
import { shuffle } from '../shared/ui';
import { ITEMS, TOPICS, type Item, type TopicId } from './data';

/**
 * «Правопис»: обери правильне написання слова. Після відповіді — правило і
 * перевірка, щоб дитина запам'ятовувала спосіб, а не окреме слово.
 *
 * Теми за класом × складність: 2 клас починає з ЧА-ЩА і м'якого знака, 3 клас —
 * з апострофа й подовжених; «Складно» — мікс усіх доступних тем класу.
 */

export interface Payload {
  item: Item;
  options: string[];
}

const ROUNDS = 6;

export const TOPICS_BY: Record<'grade2' | 'grade3', Record<Difficulty, TopicId[]>> = {
  grade2: { 1: ['cha-shcha', 'soft-sign'], 2: ['capital', 'voiced-end', 'soft-sign'], 3: ['cha-shcha', 'soft-sign', 'capital', 'voiced-end'] },
  grade3: {
    1: ['apostrophe', 'doubled'],
    2: ['unstressed', 'prefix', 'voiced-end'],
    3: ['apostrophe', 'doubled', 'unstressed', 'prefix', 'voiced-end', 'soft-sign'],
  },
};

export function topicsFor(cl: ClassLevel, d: Difficulty): TopicId[] {
  return cl === 'grade2' || cl === 'grade1' || cl === 'preschool' ? TOPICS_BY.grade2[d] : TOPICS_BY.grade3[d];
}

export function generate(difficulty: Difficulty, _level?: unknown, classLevel: ClassLevel = 'grade2'): LevelData<Payload, string> {
  const topics = topicsFor(classLevel, difficulty);
  const pool = shuffle(ITEMS.filter((i) => topics.includes(i.topic)));
  const chosen: Item[] = [];
  // по черзі з кожної теми, щоб рівень не складався з однієї
  for (let t = 0; chosen.length < ROUNDS && t < 50; t++) {
    const topic = topics[t % topics.length];
    const next = pool.find((i) => i.topic === topic && !chosen.includes(i));
    if (next) chosen.push(next);
    else if (pool.every((i) => chosen.includes(i))) break;
  }
  const rounds: Round<Payload, string>[] = chosen.map((item, i) => ({
    id: `r${i}`,
    payload: { item, options: shuffle([item.right, ...item.wrong]) },
    answer: item.right,
  }));
  return { difficulty, rounds };
}

/** Перевірне слово з наголосом великою літерою: «сЕла» → «се́ла». */
function stressMark(word: string): string {
  return word.replace(/([А-ЯІЇЄҐ])/u, (m) => `${m.toLowerCase()}́`);
}

export function explainSpelling(round: Round<Payload, string>): GameExplain {
  const { item } = round.payload;
  const topic = TOPICS[item.topic];
  const steps = [`Правильно: ${item.right}`, topic.rule];
  if (item.check) {
    const isWord = item.topic === 'voiced-end' || item.topic === 'unstressed';
    steps.push(isWord ? `Перевірка: ${item.right} — бо ${item.topic === 'unstressed' ? stressMark(item.check) : item.check}` : `Тут: ${item.check}`);
  }
  return { steps };
}
