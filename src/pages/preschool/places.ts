/**
 * Місця дошкілля (рішення 08.10.2026, `Школярик/01_Discovery/Scope_Development_by_Age.md`).
 * Назви — робочий варіант «Місця на карті»; фінал обирають з сім'єю.
 * Ігри — наявні, розкладені по місцях; стежки зі станціями прийдуть наступним кроком.
 */
export interface Place {
  id: string;
  title: string;
  /** Ілюстрація місця (public/places) або емодзі, поки малюнка немає. */
  image?: string;
  emoji: string;
  bg: string;
  games: string[];
  /** Англійська стежка місця (рішення 09.10: на Острові Слів мови не змішуємо — перемикач «Українська / English»). */
  en?: string[];
  /** Що каже звірятко, коли заходимо. */
  hello: string;
}

export const PLACES: Place[] = [
  { id: 'island', title: 'Острів Слів', image: '/places/letters.webp', emoji: '🔤', bg: '#FFE9D6', hello: 'Шукаймо загублені слова!', games: ['uk-letters', 'letters-find', 'uk-syllables', 'syllable-words', 'syllable-build'], en: ['english-words', 'letters-find-en', 'english-word-picture'] },
  { id: 'mountain', title: 'Лічильна Гора', image: '/places/numbers.webp', emoji: '🔢', bg: '#EDE7FF', hello: 'Рахуймо, хто вище!', games: ['counting', 'recognize-digit', 'compare', 'pz-share', 'addition'] },
  { id: 'forest', title: 'Ліс Загадок', image: '/places/pictures.webp', emoji: '🧩', bg: '#FFF1C9', hello: 'Тут живуть загадки!', games: ['pic-puzzle', 'colors-find', 'shapes', 'sorting-game', 'pz-sort', 'logic-sequences', 'memory-associations', 'pz-maze', 'pz-heavier', 'command-machine'] },
  { id: 'cave', title: 'Печера Скарбів', image: '/places/memory.webp', emoji: '💎', bg: '#FFE3F2', hello: 'Знайдемо скарби?', games: ['odd-one-out', 'find-shadow', 'memory-pairs', 'whats-changed', 'tap-the-dot'] },
  { id: 'garden', title: 'Чарівний Сад', image: '/places/world.webp', emoji: '🌳', bg: '#DFF7E6', hello: 'Подивимось, що росте!', games: ['animals-habitat', 'plant-grow', 'seasons-weather', 'water-states', 'sink-float', 'gears', 'ua-symbols'] },
  { id: 'meadow', title: 'Музична Поляна', emoji: '🎵', bg: '#E0F2FE', hello: 'Тут скоро буде музика!', games: [] },
  { id: 'cottage', title: 'Хатинка друга', image: '/places/calm.webp', emoji: '🏡', bg: '#E2F6F3', hello: 'Як ти сьогодні?', games: ['emotions-recognize', 'breathing', 'life-scenarios'] },
  { id: 'workshop', title: 'Майстерня', emoji: '🎨', bg: '#FCE7F3', hello: 'Тут скоро будемо майструвати!', games: [] },
];

export const getPlace = (id: string) => PLACES.find((p) => p.id === id);
