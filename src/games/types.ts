import type { ComponentType } from 'react';

/** Предметна категорія гри (для групування в Hub). */
export type Subject =
  | 'math'
  | 'language'
  | 'english'
  | 'science'
  | 'logic'
  | 'puzzles'
  | 'memory'
  | 'world'
  | 'life'
  | 'attention';

/**
 * Рівень профілю дитини:
 *  - 'L0' — дошкільнята (under_4, 5-6): прості візуальні завдання
 *  - 'L3' — школярі (6-7, 7-8): таблиця множення, дії до 100/1000 тощо
 */
export type ProfileLevel = 'L0' | 'L3';

/** Складність усередині гри. 1=Easy, 2=Medium, 3=Hard. */
export type Difficulty = 1 | 2 | 3;

/**
 * Узгоджена шкала складності контенту в іграх (D5), 5 рівнів: L0 (найлегше) …
 * L4 (найскладніше). Ті самі літери й порядок, що і `GradeBand` навчального
 * ядра (`src/school/types.ts`) — навмисно НЕ імпортується звідти (games-шар
 * лишається незалежним від school), лише узгоджена семантика назв, щоб у
 * всьому продукті був один словник рівнів складності.
 *
 * Призначення: усередині `generate()` кожної гри — єдина точка переходу від
 * (ProfileLevel, Difficulty) до змістовного рівня складності, замість
 * розрізнених ad hoc таблиць по `difficulty`, які раніше не узгоджувались між
 * іграми (однакова Difficulty=2 в різних іграх означала зовсім різну реальну
 * складність).
 */
export type GradeBand = 'L0' | 'L1' | 'L2' | 'L3' | 'L4';

export const GRADE_BANDS: readonly GradeBand[] = ['L0', 'L1', 'L2', 'L3', 'L4'];

/**
 * (ProfileLevel профілю, Difficulty гри) → GradeBand змісту.
 * ProfileLevel 'L0' (дошкільнята) охоплює GradeBand L0-L2 (Easy→L0,
 * Medium→L1, Hard→L2); 'L3' (школярі) — L2-L4 (Easy→L2, Medium→L3,
 * Hard→L4). Стик на L2 — навмисний: найскладніший рівень дошкільного треку і
 * найлегший рівень шкільного треку описують сусідні точки одного континууму
 * майстерності, а не два незалежні рахунки.
 */
export function gradeBandFor(level: ProfileLevel, difficulty: Difficulty): GradeBand {
  const base = level === 'L0' ? 0 : 2;
  return GRADE_BANDS[base + (difficulty - 1)];
}

/**
 * Навчальний КЛАС дитини (G1) — справжня 5-рівнева вісь прогресії, на відміну від
 * бінарного ProfileLevel. Дзеркалить структуру НУШ (дошкілля + 1–4 клас).
 * ProfileLevel лишається як «трек» гри (дошкільний/шкільний) для зворотної
 * сумісності зі старими генераторами; ClassLevel — вісь адаптивності та контенту,
 * якою користуватимуться двовісні генератори (G2) і аналітика НУШ.
 */
export type ClassLevel = 'preschool' | 'grade1' | 'grade2' | 'grade3' | 'grade4';

export const CLASS_LEVELS: readonly ClassLevel[] = ['preschool', 'grade1', 'grade2', 'grade3', 'grade4'];

/** Цикл НУШ: 0 — дошкілля (БКДО), 1 — I цикл (1–2 кл), 2 — II цикл (3–4 кл). */
export type NushCycle = 0 | 1 | 2;

export interface ClassLevelMeta {
  id: ClassLevel;
  title: string;
  /** Короткий підпис для списків. */
  short: string;
  /** Цикл НУШ — вісь compliance (конкретні ОРН визначені на кінець циклу). */
  cycle: NushCycle;
  /** Масштаб UI: старшим — щільніше (G7). */
  uiScale: number;
}

export const CLASS_META: Record<ClassLevel, ClassLevelMeta> = {
  preschool: { id: 'preschool', title: 'Дошкільнята', short: 'Дошкілля', cycle: 0, uiScale: 1.25 },
  grade1: { id: 'grade1', title: '1 клас', short: '1 клас', cycle: 1, uiScale: 1.12 },
  grade2: { id: 'grade2', title: '2 клас', short: '2 клас', cycle: 1, uiScale: 1.0 },
  grade3: { id: 'grade3', title: '3 клас', short: '3 клас', cycle: 2, uiScale: 0.95 },
  grade4: { id: 'grade4', title: '4 клас', short: '4 клас', cycle: 2, uiScale: 0.9 },
};

const CLASS_BAND_BASE: Record<ClassLevel, number> = {
  preschool: 0,
  grade1: 1,
  grade2: 2,
  grade3: 3,
  grade4: 4,
};

/**
 * Клас → «трек» гри (ProfileLevel) для зворотної сумісності: дошкілля лишається
 * на дошкільному треку, 1–4 клас — на шкільному. Старі генератори, що беруть
 * ProfileLevel, продовжують працювати без змін; двовісні (G2) беруть ClassLevel.
 */
export function classToProfileLevel(cl: ClassLevel): ProfileLevel {
  return cl === 'preschool' ? 'L0' : 'L3';
}

/**
 * Клас × складність → GradeBand змісту (стартова модель G1). Клас задає базовий
 * рівень, difficulty зсуває вгору в межах шкали. Точні межі уточнять двовісні
 * генератори G2 (paramsFor per клас); тут — узгоджений семантичний рівень для
 * аналітики й підбору.
 */
export function classBand(cl: ClassLevel, difficulty: Difficulty): GradeBand {
  const idx = Math.min(GRADE_BANDS.length - 1, CLASS_BAND_BASE[cl] + (difficulty - 1));
  return GRADE_BANDS[idx];
}

/** Один раунд гри: довільний payload + правильна відповідь. */
export interface Round<TPayload = unknown, TAnswer = unknown> {
  id: string;
  payload: TPayload;
  /** Еталонна відповідь (для isCorrect за замовчуванням). */
  answer: TAnswer;
}

/** Набір раундів на одну спробу гри (одна складність). */
export interface LevelData<TPayload = unknown, TAnswer = unknown> {
  difficulty: Difficulty;
  rounds: Round<TPayload, TAnswer>[];
}

/** Стан фідбеку поточного раунду (для стилізації в компоненті гри). */
export type AnswerState = 'idle' | 'correct' | 'incorrect';

/**
 * Пропси, які GameShell передає у Component конкретної гри.
 *
 * Дві моделі взаємодії:
 *  1. Раунд-based (лічба, приклади, послідовності): компонент показує 1 раунд,
 *     викликає onAnswer(answer); GameShell перевіряє через isCorrect, рахує зірки,
 *     веде до наступного раунду.
 *  2. Board-based (пам'ять): весь ігровий стан — усередині компонента; на кожній
 *     помилці кличе onMistake(); коли поле пройдено — кличе onAnswer(DONE), і
 *     GameShell завершує гру.
 */
export interface GameComponentProps<TPayload = unknown, TAnswer = unknown> {
  round: Round<TPayload, TAnswer>;
  /** Порядковий номер раунду (0-based) і всього раундів. */
  roundIndex: number;
  totalRounds: number;
  /** Заблоковано під час показу фідбеку. */
  disabled: boolean;
  answerState: AnswerState;
  /** Відповідь дитини на поточний раунд (для раунд-based ігор). */
  onAnswer: (answer: TAnswer) => void;
  /** Зареєструвати помилку без переходу раунду (для board-based ігор). */
  onMistake: () => void;
}

/**
 * EP1 — пояснення «чому», а не лише «правильна відповідь: X».
 *
 * Навіщо: показ правильної відповіді (PD0) — це фідбек типу KCR, d≈0.32. Додати
 * «чому саме так» → elaborated feedback, d≈0.49. Це топ-фікс #1 з аудиту: одна
 * зміна в ядрі підіймає всі ігри, які його реалізують.
 *
 * Форма свідомо перевернута (фідбек Тараса): головне — ЗЕЛЕНЕ «як правильно»,
 * а причина помилки — дрібним і нейтрально. Червоний покроковий докір дитина
 * запам'ятовує замість самого уроку.
 */
export interface GameExplain {
  /** Головне: як правильно — покроково. Кожен крок = один рядок. */
  steps: string[];
  /** Дрібним, нейтрально: типова причина цієї помилки. Не обов'язково. */
  why?: string;
}

/** Контракт гри-плагіна. Додати гру = папка src/games/<id>/ + рядок у registry. */
export interface GameDefinition<TPayload = any, TAnswer = any> {
  id: string;
  title: string;
  subject: Subject;
  /** Для яких рівнів профілю гра доступна. */
  levels: ProfileLevel[];
  /** Emoji-іконка картки (fallback, якщо нема image). */
  icon: string;
  /** Ілюстрація картки (шлях у /public). Пріоритетніша за emoji. */
  image?: string;
  /** Короткий опис під назвою в Hub. */
  description: string;
  /** Пастельний фон іконки в Hub (canon). */
  accent?: string;
  /**
   * Skill-graph ID (з `src/school/skills-*.ts`), які ця гра тренує на кожній
   * складності (BRIEF SHK-A3). Порожньо/відсутнє для предметів без seed skill-graph.
   */
  skillIds?: Partial<Record<Difficulty, string[]>>;
  /**
   * Згенерувати набір раундів для складності + рівня профілю.
   * `classLevel` (G2) — навчальний клас дитини для двовісної складності
   * (клас × difficulty). Опційний: старі одновісні ігри його ігнорують,
   * двовісні math-ігри масштабують «математичний обрій» під клас.
   */
  generate: (difficulty: Difficulty, level: ProfileLevel, classLevel?: ClassLevel) => LevelData<TPayload, TAnswer>;
  /** Перевірити відповідь. Якщо не задано — порівняння з round.answer. */
  isCorrect?: (round: Round<TPayload, TAnswer>, answer: TAnswer) => boolean;
  /**
   * EP1: чому саме так. Викликається при помилці; отримує відповідь дитини, тож
   * може розпізнати КОНКРЕТНУ хибну стратегію. Повертає null — пояснення нема
   * (тоді фідбек лишається як був: показ правильної відповіді).
   *
   * Опційне: гра без нього працює точно як раніше — жодна з наявних не зачеплена.
   */
  explain?: (round: Round<TPayload, TAnswer>, answer: TAnswer) => GameExplain | null;
  Component: ComponentType<GameComponentProps<TPayload, TAnswer>>;
}

/** Сентінел-відповідь, яку board-based ігри шлють у onAnswer при завершенні поля. */
export const BOARD_DONE = '__board_done__' as const;

/**
 * Зірки за точність (0–3).
 * 3⭐ — без помилок; 2⭐ — до ~третини раундів з помилкою; інакше 1⭐.
 */
export function computeStars(mistakes: number, rounds: number): 0 | 1 | 2 | 3 {
  if (mistakes <= 0) return 3;
  if (mistakes <= Math.max(1, Math.ceil(rounds * 0.34))) return 2;
  return 1;
}

/**
 * Level gate: скільки складностей відкрито після спроби.
 * Easy(1)→Medium(2) відкривається за 2⭐; Medium(2)→Hard(3) — за 3⭐.
 * Повертає нову максимальну відкриту складність (не регресує).
 */
export function unlockedAfter(
  difficulty: Difficulty,
  stars: 0 | 1 | 2 | 3,
  prevUnlocked: Difficulty,
): Difficulty {
  let unlocked: Difficulty = difficulty;
  if (difficulty === 1 && stars >= 2) unlocked = 2;
  if (difficulty === 2 && stars >= 3) unlocked = 3;
  return Math.max(prevUnlocked, unlocked) as Difficulty;
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  1: 'Легко',
  2: 'Середньо',
  3: 'Складно',
};
