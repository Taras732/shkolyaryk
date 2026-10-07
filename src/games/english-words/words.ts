/**
 * Стартовий словник англійської: 5 тем із vault (`05_Operations/Research/Vocab_List_EN_v1.0.md`,
 * без son/daughter — для них нема однозначної картинки) + теми, де діагностика показала
 * прогалини старших (house, water, happy) і слова, які молодша вже читає (sun, run).
 */
export interface Word {
  en: string;
  ua: string;
  emoji: string;
  topic: TopicId;
}

export type TopicId = 'home' | 'feelings' | 'nature' | 'animals' | 'food' | 'family' | 'colors' | 'numbers' | 'actions' | 'body' | 'mine';

export const TOPICS: { id: TopicId; title: string; emoji: string }[] = [
  { id: 'home', title: 'Дім і речі', emoji: '🏠' },
  { id: 'feelings', title: 'Почуття', emoji: '😊' },
  { id: 'nature', title: 'Природа', emoji: '🌳' },
  { id: 'animals', title: 'Тварини', emoji: '🐾' },
  { id: 'food', title: 'Їжа', emoji: '🍎' },
  { id: 'family', title: "Сім'я", emoji: '👨‍👩‍👧' },
  { id: 'colors', title: 'Кольори', emoji: '🎨' },
  { id: 'numbers', title: 'Числа', emoji: '🔢' },
  { id: 'actions', title: 'Дії', emoji: '🏃' },
  { id: 'body', title: 'Тіло', emoji: '✋' },
];

const w = (topic: TopicId, rows: [string, string, string][]): Word[] => rows.map(([en, ua, emoji]) => ({ en, ua, emoji, topic }));

export const WORDS: Word[] = [
  ...w('home', [
    ['house', 'будинок', '🏠'], ['book', 'книжка', '📖'], ['ball', "м'яч", '⚽'], ['bag', 'рюкзак', '🎒'],
    ['chair', 'стілець', '🪑'], ['door', 'двері', '🚪'], ['bed', 'ліжко', '🛏️'], ['car', 'машина', '🚗'],
    ['pen', 'ручка', '🖊️'], ['clock', 'годинник', '🕐'],
  ]),
  ...w('feelings', [
    ['happy', 'щасливий', '😊'], ['sad', 'сумний', '😢'], ['angry', 'сердитий', '😠'], ['tired', 'втомлений', '🥱'],
    ['hot', 'гаряче / жарко', '🥵'], ['cold', 'холодно', '🥶'], ['scared', 'наляканий', '😨'], ['hungry', 'голодний', '😋'],
  ]),
  ...w('nature', [
    ['sun', 'сонце', '☀️'], ['moon', 'місяць', '🌙'], ['star', 'зірка', '⭐'], ['tree', 'дерево', '🌳'],
    ['flower', 'квітка', '🌸'], ['rain', 'дощ', '🌧️'], ['snow', 'сніг', '❄️'], ['cloud', 'хмара', '☁️'],
    ['sea', 'море', '🌊'],
  ]),
  ...w('animals', [
    ['cat', 'кіт', '🐱'], ['dog', 'собака', '🐶'], ['fish', 'риба', '🐟'], ['bird', 'птах', '🐦'],
    ['rabbit', 'кролик', '🐰'], ['horse', 'кінь', '🐴'], ['cow', 'корова', '🐄'], ['frog', 'жаба', '🐸'],
    ['duck', 'качка', '🦆'], ['bear', 'ведмідь', '🐻'],
  ]),
  ...w('food', [
    ['apple', 'яблуко', '🍎'], ['banana', 'банан', '🍌'], ['milk', 'молоко', '🥛'], ['bread', 'хліб', '🍞'],
    ['egg', 'яйце', '🥚'], ['juice', 'сік', '🧃'], ['cake', 'торт', '🎂'], ['pizza', 'піца', '🍕'],
    ['soup', 'суп', '🍲'], ['water', 'вода', '💧'],
  ]),
  ...w('family', [
    ['mom', 'мама', '👩'], ['dad', 'тато', '👨'], ['sister', 'сестра', '👧'], ['brother', 'брат', '👦'],
    ['grandma', 'бабуся', '👵'], ['grandpa', 'дідусь', '👴'], ['baby', 'немовля', '👶'], ['family', "сім'я", '👨‍👩‍👧‍👦'],
  ]),
  ...w('colors', [
    ['red', 'червоний', '🔴'], ['blue', 'синій', '🔵'], ['yellow', 'жовтий', '🟡'], ['green', 'зелений', '🟢'],
    ['orange', 'помаранчевий', '🟠'], ['pink', 'рожевий', '🩷'], ['white', 'білий', '⬜'], ['black', 'чорний', '⬛'],
    ['purple', 'фіолетовий', '🟣'], ['brown', 'коричневий', '🟤'],
  ]),
  ...w('numbers', [
    ['one', 'один', '1️⃣'], ['two', 'два', '2️⃣'], ['three', 'три', '3️⃣'], ['four', 'чотири', '4️⃣'],
    ['five', "п'ять", '5️⃣'], ['six', 'шість', '6️⃣'], ['seven', 'сім', '7️⃣'], ['eight', 'вісім', '8️⃣'],
    ['nine', "дев'ять", '9️⃣'], ['ten', 'десять', '🔟'],
  ]),
  ...w('actions', [
    ['run', 'бігти', '🏃'], ['jump', 'стрибати', '🦘'], ['swim', 'плавати', '🏊'], ['sing', 'співати', '🎤'],
    ['dance', 'танцювати', '💃'], ['sleep', 'спати', '😴'], ['eat', 'їсти', '🍽️'], ['read', 'читати', '📚'],
  ]),
  ...w('body', [
    ['hand', 'рука', '✋'], ['eye', 'око', '👁️'], ['ear', 'вухо', '👂'], ['nose', 'ніс', '👃'],
    ['mouth', 'рот', '👄'], ['foot', 'стопа', '🦶'],
  ]),
];
