import type { VocabWord, VocabCategory } from './types';

interface ConceptEntry {
  id: string;
  emoji: string;
  category: VocabCategory;
  en: string;
  uk: string;
}

const CONCEPTS: ConceptEntry[] = [
  // Animals (10)
  { id: 'cat',        emoji: '🐱', category: 'animals', en: 'cat',         uk: 'кіт' },
  { id: 'dog',        emoji: '🐶', category: 'animals', en: 'dog',         uk: 'собака' },
  { id: 'cow',        emoji: '🐄', category: 'animals', en: 'cow',         uk: 'корова' },
  { id: 'horse',      emoji: '🐴', category: 'animals', en: 'horse',       uk: 'кінь' },
  { id: 'pig',        emoji: '🐷', category: 'animals', en: 'pig',         uk: 'свиня' },
  { id: 'rabbit',     emoji: '🐰', category: 'animals', en: 'rabbit',      uk: 'кролик' },
  { id: 'duck',       emoji: '🦆', category: 'animals', en: 'duck',        uk: 'качка' },
  { id: 'fish',       emoji: '🐟', category: 'animals', en: 'fish',        uk: 'риба' },
  { id: 'bird',       emoji: '🐦', category: 'animals', en: 'bird',        uk: 'птах' },
  { id: 'mouse',      emoji: '🐭', category: 'animals', en: 'mouse',       uk: 'миша' },

  // Food (10)
  { id: 'apple',      emoji: '🍎', category: 'food',    en: 'apple',       uk: 'яблуко' },
  { id: 'banana',     emoji: '🍌', category: 'food',    en: 'banana',      uk: 'банан' },
  { id: 'bread',      emoji: '🍞', category: 'food',    en: 'bread',       uk: 'хліб' },
  { id: 'milk',       emoji: '🥛', category: 'food',    en: 'milk',        uk: 'молоко' },
  { id: 'egg',        emoji: '🥚', category: 'food',    en: 'egg',         uk: 'яйце' },
  { id: 'carrot',     emoji: '🥕', category: 'food',    en: 'carrot',      uk: 'морква' },
  { id: 'orange',     emoji: '🍊', category: 'food',    en: 'orange',      uk: 'апельсин' },
  { id: 'tomato',     emoji: '🍅', category: 'food',    en: 'tomato',      uk: 'помідор' },
  { id: 'strawberry', emoji: '🍓', category: 'food',    en: 'strawberry',  uk: 'полуниця' },
  { id: 'grapes',     emoji: '🍇', category: 'food',    en: 'grapes',      uk: 'виноград' },

  // Colors (10)
  { id: 'red',        emoji: '🔴', category: 'colors',  en: 'red',         uk: 'червоний' },
  { id: 'blue',       emoji: '🔵', category: 'colors',  en: 'blue',        uk: 'синій' },
  { id: 'green',      emoji: '🟢', category: 'colors',  en: 'green',       uk: 'зелений' },
  { id: 'yellow',     emoji: '🟡', category: 'colors',  en: 'yellow',      uk: 'жовтий' },
  { id: 'violet',     emoji: '🟣', category: 'colors',  en: 'purple',      uk: 'фіолетовий' },
  { id: 'pink',       emoji: '🩷', category: 'colors',  en: 'pink',        uk: 'рожевий' },
  { id: 'white',      emoji: '⬜', category: 'colors',  en: 'white',       uk: 'білий' },
  { id: 'black',      emoji: '⬛', category: 'colors',  en: 'black',       uk: 'чорний' },
  { id: 'brown',      emoji: '🟫', category: 'colors',  en: 'brown',       uk: 'коричневий' },
  { id: 'gray',       emoji: '🩶', category: 'colors',  en: 'gray',        uk: 'сірий' },

  // Body (10)
  { id: 'eye',        emoji: '👁️', category: 'body',    en: 'eye',         uk: 'око' },
  { id: 'nose',       emoji: '👃', category: 'body',    en: 'nose',        uk: 'ніс' },
  { id: 'ear',        emoji: '👂', category: 'body',    en: 'ear',         uk: 'вухо' },
  { id: 'hand',       emoji: '🖐️', category: 'body',    en: 'hand',        uk: 'рука' },
  { id: 'foot',       emoji: '🦶', category: 'body',    en: 'foot',        uk: 'нога' },
  { id: 'head',       emoji: '🙂', category: 'body',    en: 'head',        uk: 'голова' },
  { id: 'mouth',      emoji: '👄', category: 'body',    en: 'mouth',       uk: 'рот' },
  { id: 'tooth',      emoji: '🦷', category: 'body',    en: 'tooth',       uk: 'зуб' },
  { id: 'finger',     emoji: '☝️', category: 'body',    en: 'finger',      uk: 'палець' },
  { id: 'hair',       emoji: '💇', category: 'body',    en: 'hair',        uk: 'волосся' },

  // Objects (10)
  { id: 'house',      emoji: '🏠', category: 'objects', en: 'house',       uk: 'будинок' },
  { id: 'car',        emoji: '🚗', category: 'objects', en: 'car',         uk: 'машина' },
  { id: 'book',       emoji: '📚', category: 'objects', en: 'book',        uk: 'книга' },
  { id: 'sun',        emoji: '☀️', category: 'objects', en: 'sun',         uk: 'сонце' },
  { id: 'moon',       emoji: '🌙', category: 'objects', en: 'moon',        uk: 'місяць' },
  { id: 'tree',       emoji: '🌳', category: 'objects', en: 'tree',        uk: 'дерево' },
  { id: 'flower',     emoji: '🌸', category: 'objects', en: 'flower',      uk: 'квітка' },
  { id: 'star',       emoji: '⭐', category: 'objects', en: 'star',        uk: 'зірка' },
  { id: 'rain',       emoji: '🌧️', category: 'objects', en: 'rain',        uk: 'дощ' },
  { id: 'cloud',      emoji: '☁️', category: 'objects', en: 'cloud',       uk: 'хмара' },
];

function buildVocab(): VocabWord[] {
  const words: VocabWord[] = [];
  for (const c of CONCEPTS) {
    words.push({
      id: `${c.id}-en`,
      word: c.en,
      lang: 'en-US',
      emoji: c.emoji,
      category: c.category,
      pairId: `${c.id}-uk`,
    });
    words.push({
      id: `${c.id}-uk`,
      word: c.uk,
      lang: 'uk-UA',
      emoji: c.emoji,
      category: c.category,
      pairId: `${c.id}-en`,
    });
  }
  return words;
}

export const VOCABULARY: VocabWord[] = buildVocab();

export const VOCAB_EN = VOCABULARY.filter((w) => w.lang === 'en-US');
export const VOCAB_UK = VOCABULARY.filter((w) => w.lang === 'uk-UA');

export function getByCategory(category: VocabWord['category']): VocabWord[] {
  return VOCABULARY.filter((w) => w.category === category);
}

export function getPair(word: VocabWord): VocabWord | undefined {
  return VOCABULARY.find((w) => w.id === word.pairId);
}
