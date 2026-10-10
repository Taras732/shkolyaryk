import type { LogEntry } from '@/school/game-log';
import { VISIBLE_PLACES as PLACES } from '@/pages/preschool/places';

/** Що вміє друг по місцях: частка ігор місця, які дитина вже пройшла → 0–3 зірочки (концепція v2). */
export function placeStars(log: LogEntry[]) {
  const played = new Set(log.map((e) => e.gameId));
  return PLACES.filter((p) => p.games.length).map((p) => {
    const share = p.games.filter((g) => played.has(g)).length / p.games.length;
    return { id: p.id, title: p.title, image: p.image, emoji: p.emoji, stars: share === 0 ? 0 : share < 0.5 ? 1 : share < 1 ? 2 : 3 };
  });
}

/** Куди кличе друг: «ходімо в …» — з правильним прийменником і відмінком. */
export const GO_TO: Record<string, string> = {
  island: 'на Острів Слів',
  mountain: 'на Лічильну Гору',
  forest: 'у Ліс Загадок',
  cave: 'у Печеру Скарбів',
  garden: 'у Чарівний Сад',
  cottage: 'у Хатинку друга',
};
export const recLine = (place: string) => `Ходімо ${GO_TO[place]}! Я там ще мало вмію.`;

/** Рекомендація: місце, де друг уміє найменше; за рівних — улюблене місце друга, далі — за порядком на карті. */
export function recommendPlace(log: LogEntry[], favorite?: string): string {
  const list = placeStars(log).filter((p) => GO_TO[p.id]);
  const min = Math.min(...list.map((p) => p.stars));
  const weakest = list.filter((p) => p.stars === min);
  return (weakest.find((p) => p.id === favorite) ?? weakest[0]).id;
}
