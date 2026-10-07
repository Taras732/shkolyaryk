/**
 * Phonics для англійського читання (vault: Methodology — «phonics SATPIN»).
 * Порядок літер — як у Jolly Phonics: спершу s a t p i n, з яких уже
 * складаються перші слова (sat, pin, tap), далі решта.
 */

export interface KeyWord {
  letter: string;
  word: string;
  emoji: string;
}

/** Літера + опорне слово, що починається з її ЗВУКУ (не назви: c — cat, а не «сі»).
 * Без x: англійські слова з неї майже не починаються, вона живе в кінці (box, fox). */
export const LETTERS: KeyWord[] = [
  { letter: 's', word: 'sun', emoji: '☀️' }, { letter: 'a', word: 'apple', emoji: '🍎' },
  { letter: 't', word: 'tree', emoji: '🌳' }, { letter: 'p', word: 'pig', emoji: '🐷' },
  { letter: 'i', word: 'insect', emoji: '🐛' }, { letter: 'n', word: 'nest', emoji: '🪺' },
  { letter: 'c', word: 'cat', emoji: '🐱' }, { letter: 'e', word: 'egg', emoji: '🥚' },
  { letter: 'h', word: 'hat', emoji: '🎩' }, { letter: 'r', word: 'rabbit', emoji: '🐰' },
  { letter: 'm', word: 'moon', emoji: '🌙' }, { letter: 'd', word: 'dog', emoji: '🐶' },
  { letter: 'g', word: 'goat', emoji: '🐐' }, { letter: 'o', word: 'octopus', emoji: '🐙' },
  { letter: 'u', word: 'umbrella', emoji: '☂️' }, { letter: 'l', word: 'lion', emoji: '🦁' },
  { letter: 'f', word: 'fish', emoji: '🐟' }, { letter: 'b', word: 'ball', emoji: '⚽' },
  { letter: 'j', word: 'jellyfish', emoji: '🪼' }, { letter: 'z', word: 'zebra', emoji: '🦓' },
  { letter: 'w', word: 'web', emoji: '🕸️' }, { letter: 'v', word: 'van', emoji: '🚐' },
  { letter: 'y', word: 'yo-yo', emoji: '🪀' }, { letter: 'k', word: 'kite', emoji: '🪁' },
  { letter: 'q', word: 'queen', emoji: '👸' },
];

/** Слова «приголосний-голосний-приголосний» з однозначною картинкою — для читання. */
export const CVC: { word: string; emoji: string }[] = [
  { word: 'cat', emoji: '🐱' }, { word: 'dog', emoji: '🐶' }, { word: 'pig', emoji: '🐷' }, { word: 'hat', emoji: '🎩' },
  { word: 'bat', emoji: '🦇' }, { word: 'sun', emoji: '☀️' }, { word: 'bus', emoji: '🚌' }, { word: 'bed', emoji: '🛏️' },
  { word: 'box', emoji: '📦' }, { word: 'fox', emoji: '🦊' }, { word: 'cup', emoji: '☕' }, { word: 'pen', emoji: '🖊️' },
  { word: 'map', emoji: '🗺️' }, { word: 'van', emoji: '🚐' }, { word: 'web', emoji: '🕸️' }, { word: 'net', emoji: '🥅' },
  { word: 'leg', emoji: '🦵' }, { word: 'log', emoji: '🪵' }, { word: 'bug', emoji: '🐛' }, { word: 'hen', emoji: '🐔' },
  { word: 'rat', emoji: '🐀' }, { word: 'cap', emoji: '🧢' }, { word: 'bag', emoji: '👜' }, { word: 'pin', emoji: '📌' },
  { word: 'nut', emoji: '🥜' }, { word: 'jet', emoji: '✈️' }, { word: 'six', emoji: '6️⃣' }, { word: 'ten', emoji: '🔟' },
  { word: 'red', emoji: '🔴' }, { word: 'hut', emoji: '🛖' },
];

/**
 * Ширший запас CVC-слів (не всі мають картинку) — відволікачі «на слух»:
 * дитина чує cat і обирає серед cat / cot / cut — одна літера різниці.
 */
export const CVC_EXTRA = [
  'cot', 'cut', 'hot', 'pot', 'pet', 'pit', 'pan', 'tin', 'tan', 'man', 'men', 'mop', 'top', 'tip', 'tap', 'tub', 'cub',
  'cab', 'can', 'cop', 'bad', 'bud', 'bid', 'big', 'beg', 'bog', 'dug', 'dig', 'lag', 'fat', 'fit', 'fin', 'fun', 'fan',
  'him', 'hum', 'hug', 'hog', 'jog', 'not', 'rot', 'rib', 'rub', 'sat', 'set', 'sit', 'vet', 'wet', 'win', 'yes', 'zip',
  'rag', 'peg', 'gum', 'mud', 'kid', 'lid', 'lip', 'hop', 'dot',
];

/** Фрази для «Складно»: число + колір + предмет — картинка однозначна. */
export const NUMBERS = [
  { word: 'one', n: 1 },
  { word: 'two', n: 2 },
  { word: 'three', n: 3 },
];

export const THINGS = [
  { color: 'red', noun: 'apple', emoji: '🍎' },
  { color: 'green', noun: 'apple', emoji: '🍏' },
  { color: 'red', noun: 'heart', emoji: '❤️' },
  { color: 'blue', noun: 'heart', emoji: '💙' },
  { color: 'green', noun: 'heart', emoji: '💚' },
  { color: 'yellow', noun: 'heart', emoji: '💛' },
];
