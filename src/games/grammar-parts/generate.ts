import type { ClassLevel, Difficulty, GradeBand, LevelData, ProfileLevel, Round } from '../types';
import { gradeBandFor } from '../types';
import { shuffle } from '../shared/ui';

/** Частина мови (D6: іменник/дієслово/прикметник — базовий набір для 2-4 класу). */
export type Pos = 'Іменник' | 'Дієслово' | 'Прикметник';

export interface Payload {
  sentence: string;
  /** Виділене слово (точний підрядок sentence), для якого визначаємо частину мови. */
  target: string;
  /** Завжди всі 3 категорії, у перемішаному порядку. */
  options: Pos[];
  /** 1 клас (11.10, програма Савченко): без термінів — питання хто? що? / який? / що робить? */
  asQuestions?: boolean;
}

const ROUNDS_PER_LEVEL = 5;
const POS_OPTIONS: Pos[] = ['Іменник', 'Дієслово', 'Прикметник'];

export interface Entry {
  sentence: string;
  target: string;
  pos: Pos;
}

// Band L2 (~2 клас): короткі прості речення, очевидне слово.
const L2_SENTENCES: Entry[] = [
  { sentence: 'Кіт спить на килимку.', target: 'Кіт', pos: 'Іменник' },
  { sentence: 'Собака біжить швидко.', target: 'біжить', pos: 'Дієслово' },
  { sentence: "Великий м'яч лежить у кутку.", target: 'Великий', pos: 'Прикметник' },
  { sentence: 'Мама готує вечерю.', target: 'Мама', pos: 'Іменник' },
  { sentence: 'Пташка співає в лісі.', target: 'співає', pos: 'Дієслово' },
  { sentence: 'Червоне яблуко впало з дерева.', target: 'Червоне', pos: 'Прикметник' },
  { sentence: 'Хлопчик малює будинок.', target: 'Хлопчик', pos: 'Іменник' },
  { sentence: 'Діти граються у дворі.', target: 'граються', pos: 'Дієслово' },
  { sentence: 'Пухнастий кролик стрибає по траві.', target: 'Пухнастий', pos: 'Прикметник' },
  { sentence: 'Вчителька пише на дошці.', target: 'Вчителька', pos: 'Іменник' },
  { sentence: 'Метелик літає над квіткою.', target: 'Метелик', pos: 'Іменник' },
  { sentence: 'Дівчинка читає книжку.', target: 'Дівчинка', pos: 'Іменник' },
  { sentence: 'Рибка пливе в акваріумі.', target: 'пливе', pos: 'Дієслово' },
  { sentence: 'Жабка стрибає в ставок.', target: 'стрибає', pos: 'Дієслово' },
  { sentence: 'Пес голосно гавкає.', target: 'гавкає', pos: 'Дієслово' },
  { sentence: 'Жовте сонечко світить яскраво.', target: 'Жовте', pos: 'Прикметник' },
  { sentence: 'Маленька мишка ховається в норі.', target: 'Маленька', pos: 'Прикметник' },
  { sentence: 'Швидкий поїзд їде до міста.', target: 'Швидкий', pos: 'Прикметник' },
];

// Band L3 (~3 клас): довші речення, більше контексту навколо цільового слова.
const L3_SENTENCES: Entry[] = [
  { sentence: 'Маленький хлопчик швидко біг до школи.', target: 'хлопчик', pos: 'Іменник' },
  { sentence: 'Діти весело співали пісню на святі.', target: 'співали', pos: 'Дієслово' },
  { sentence: 'Смачний пиріг стояв на столі.', target: 'Смачний', pos: 'Прикметник' },
  { sentence: 'Учитель пояснював новий урок дітям.', target: 'Учитель', pos: 'Іменник' },
  { sentence: 'Собака голосно гавкав на кота.', target: 'гавкав', pos: 'Дієслово' },
  { sentence: 'Веселий клоун розсмішив усіх глядачів.', target: 'Веселий', pos: 'Прикметник' },
  { sentence: 'Річка тихо текла через ліс.', target: 'Річка', pos: 'Іменник' },
  { sentence: 'Зайчик швидко втік у кущі.', target: 'втік', pos: 'Дієслово' },
  { sentence: 'Синій метелик сів на квітку.', target: 'Синій', pos: 'Прикметник' },
  { sentence: 'Бабуся зварила смачний борщ.', target: 'Бабуся', pos: 'Іменник' },
  { sentence: 'Пожежник хоробро загасив велику пожежу.', target: 'Пожежник', pos: 'Іменник' },
  { sentence: 'Промінь сонця освітив темну кімнату.', target: 'Промінь', pos: 'Іменник' },
  { sentence: 'Дівчинка акуратно склала іграшки в кошик.', target: 'склала', pos: 'Дієслово' },
  { sentence: 'Хмари швидко затягнули ясне небо.', target: 'затягнули', pos: 'Дієслово' },
  { sentence: 'Малий песик радісно завиляв хвостом.', target: 'завиляв', pos: 'Дієслово' },
  { sentence: 'Барвистий метелик покружляв над садом.', target: 'Барвистий', pos: 'Прикметник' },
  { sentence: 'Пухнаста хмаринка пливла по небу.', target: 'Пухнаста', pos: 'Прикметник' },
  { sentence: 'Гострий олівець лежав на парті.', target: 'Гострий', pos: 'Прикметник' },
];

// Band L4 (~4 клас): менш очевидна лексика, довші речення.
const L4_SENTENCES: Entry[] = [
  { sentence: 'Досвідчений капітан впевнено керував великим кораблем.', target: 'капітан', pos: 'Іменник' },
  { sentence: 'Спортсмени наполегливо тренувалися перед важливими змаганнями.', target: 'тренувалися', pos: 'Дієслово' },
  { sentence: 'Стародавній замок височів на крутому пагорбі.', target: 'Стародавній', pos: 'Прикметник' },
  { sentence: 'Науковець уважно досліджував рідкісну рослину.', target: 'Науковець', pos: 'Іменник' },
  { sentence: 'Мандрівники подолали складний гірський перевал.', target: 'подолали', pos: 'Дієслово' },
  { sentence: "Загадковий острів з'явився серед океану.", target: 'Загадковий', pos: 'Прикметник' },
  { sentence: 'Архітектор спроєктував незвичайну будівлю музею.', target: 'Архітектор', pos: 'Іменник' },
  { sentence: 'Вправна майстриня вишила барвистий рушник.', target: 'вишила', pos: 'Дієслово' },
  { sentence: "Кмітливий учень швидко розв'язав важку задачу.", target: 'Кмітливий', pos: 'Прикметник' },
  { sentence: 'Досвідчений хірург успішно провів складну операцію.', target: 'хірург', pos: 'Іменник' },
  { sentence: 'Мудрий філософ роздумував над сенсом буття.', target: 'філософ', pos: 'Іменник' },
  { sentence: 'Обдарований піаніст блискуче виконав складну сонату.', target: 'піаніст', pos: 'Іменник' },
  { sentence: 'Дослідники ретельно проаналізували отримані результати.', target: 'проаналізували', pos: 'Дієслово' },
  { sentence: "Майстер вправно вирізьбив дерев'яну скульптуру.", target: 'вирізьбив', pos: 'Дієслово' },
  { sentence: 'Пілот упевнено посадив літак у складну погоду.', target: 'посадив', pos: 'Дієслово' },
  { sentence: 'Незвичайний експонат зацікавив усіх відвідувачів музею.', target: 'Незвичайний', pos: 'Прикметник' },
  { sentence: 'Таємничий сигнал надійшов з глибокого космосу.', target: 'Таємничий', pos: 'Прикметник' },
  { sentence: 'Витончений візерунок прикрашав старовинну вазу.', target: 'Витончений', pos: 'Прикметник' },
];

export const POOL_BY_BAND: Record<GradeBand, Entry[]> = {
  L0: L2_SENTENCES,
  L1: L2_SENTENCES,
  L2: L2_SENTENCES,
  L3: L3_SENTENCES,
  L4: L4_SENTENCES,
};

function entryKey(e: Entry): string {
  // Роздільник — звичайний ASCII-символ, якого не буває в реченнях банку. Пробіл не
  // годиться (він є в тексті: «А Б»+«В» і «А»+«Б В» дали б однаковий ключ).
  // Тут раніше стояв СИРИЙ NUL-байт: ключі працювали, tsc і тести були зелені, але
  // файл через нього переставав бути текстовим — grep бачив його як бінарний.
  return `${e.sentence}|${e.target}`;
}

/** Прибрати випадкові дублікати банку (той самий sentence+target) — захист від помилки авторства. */
function dedupeEntries(pool: Entry[]): Entry[] {
  const seen = new Set<string>();
  const out: Entry[] = [];
  for (const e of pool) {
    const k = entryKey(e);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(e);
  }
  return out;
}

/**
 * Черги "мішок без повторів" (shuffle-bag), по одній на band, живуть на весь
 * час сесії (модульний стан, скидається лише перезавантаженням сторінки).
 */
const bandQueues: Partial<Record<GradeBand, Entry[]>> = {};

/** Тест-хук: скинути стан мішків між незалежними тестовими сценаріями. */
export function __resetDecksForTests(): void {
  for (const k of Object.keys(bandQueues) as GradeBand[]) delete bandQueues[k];
}

/**
 * Видати `count` унікальних записів з `pool` без повторів, доки не
 * вичерпається весь (дедуплікований) банк — тоді тасує банк наново.
 *
 * Корінь бага (QA 16.07): попередня версія робила `shuffle(pool).slice(0, 5)`
 * НЕЗАЛЕЖНО щоразу під час нового виклику generate() (кнопки «Далі
 * складніше» / «Зіграти ще раз»). Раунди в межах ОДНІЄЇ спроби справді ніколи
 * не повторювались (shuffle — це коректна перестановка), але банк на band
 * був лише 9-10 речень при 5 раундах — тож наступна спроба в тій самій сесії
 * з великою ймовірністю перетасовувала майже той самий набір і відчувалась як
 * «повтори». Мішок-без-повторів видає весь банк по колу, тож повтор одного й
 * того ж речення можливий лише після того, як пройдено решту банку.
 *
 * Коли поточна черга (залишок попереднього мішка) коротша за `need`, її
 * добираємо свіжо перетасованим повним банком — АЛЕ з нього виключено записи,
 * вже видані в ЦЬОМУ виклику (залишок), інакше вони могли б випасти вдруге в
 * тому самому наборі з 5 (саме так виглядав перший варіант цього фіксу).
 */
function draw(band: GradeBand, pool: Entry[], count: number): Entry[] {
  const deduped = dedupeEntries(pool);
  const need = Math.min(count, deduped.length);
  let queue = bandQueues[band] ?? [];

  const drawn: Entry[] = [];
  const drawnKeys = new Set<string>();
  while (drawn.length < need) {
    if (queue.length === 0) {
      queue = shuffle(deduped).filter((e) => !drawnKeys.has(entryKey(e)));
    }
    const entry = queue.shift()!;
    const k = entryKey(entry);
    if (drawnKeys.has(k)) continue; // захисна сітка, теоретично не має траплятись
    drawn.push(entry);
    drawnKeys.add(k);
  }

  bandQueues[band] = queue;
  return drawn;
}

export function generate(difficulty: Difficulty, level: ProfileLevel = 'L3', classLevel?: ClassLevel): LevelData<Payload, Pos> {
  const asQuestions = classLevel === 'grade1';
  // 1 клас — найпростіші речення на будь-якій складності
  const band = asQuestions ? 'L1' : gradeBandFor(level, difficulty);
  const pool = POOL_BY_BAND[band];
  const chosen = draw(band, pool, ROUNDS_PER_LEVEL);
  const rounds: Round<Payload, Pos>[] = chosen.map((entry, i) => ({
    id: `r${i}`,
    payload: { sentence: entry.sentence, target: entry.target, options: shuffle(POS_OPTIONS), asQuestions },
    answer: entry.pos,
  }));
  return { difficulty, rounds };
}
