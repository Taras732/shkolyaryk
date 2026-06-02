import type { AgeGroupId } from './ageGroups';

/** Твердження для перевірки «правильно / неправильно». */
export interface QuickCheck {
  statement: string;
  correct: boolean;
}

/**
 * Навчальна тема — міні-хаб: коротка теорія + показові приклади + перевірка,
 * після якої дитина переходить у відповідну гру.
 */
export interface LearningTheme {
  id: string;
  islandId: string;
  availableFor: AgeGroupId[];
  title: string;
  icon: string;
  /** Навіщо це — одне-два речення для дитини. */
  intro: string;
  /** Абзаци теорії (показуються по черзі). */
  theory: string[];
  /** Показові приклади-рядки. */
  examples: string[];
  /** Інтерактивна перевірка «ок / не ок». */
  checks: QuickCheck[];
  /** Гра, в яку веде кнопка «Грати». */
  gameId: string;
  /** Підказка батькам (як пояснювати вдома). */
  parentTip: string;
}

// ── 1 клас ───────────────────────────────────────────────
const g1Count: LearningTheme = {
  id: 'g1-count',
  islandId: 'math',
  availableFor: ['grade1'],
  title: 'Рахуємо предмети',
  icon: '🍎',
  intro: 'Лічба — основа математики. Вчимося рахувати предмети і називати, скільки їх.',
  theory: [
    'Щоб дізнатися «скільки», ми рахуємо предмети по одному: один, два, три, чотири...',
    'Останнє число, яке назвали — це і є відповідь, скільки всього предметів.',
    'Числа завжди йдуть по порядку: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10.',
  ],
  examples: [
    '🍎🍎🍎 — це 3 яблука',
    '🐟🐟🐟🐟🐟 — це 5 рибок',
    'Рахуємо разом: 1, 2, 3, 4 — чотири!',
  ],
  checks: [
    { statement: '🍎🍎🍎 — це 3', correct: true },
    { statement: 'Після 4 йде 5', correct: true },
    { statement: '⭐⭐⭐⭐ — це 3', correct: false },
    { statement: 'Після 7 йде 9', correct: false },
    { statement: '🐟🐟 — це 2', correct: true },
  ],
  gameId: 'count-objects',
  parentTip: 'Рахуйте все навколо — сходинки, ложки, машинки. Лічба в реальному житті закріплюється найкраще.',
};

const g1AddSub: LearningTheme = {
  id: 'g1-add-sub',
  islandId: 'math',
  availableFor: ['grade1'],
  title: 'Додавання і віднімання',
  icon: '➕',
  intro: 'Додавання — коли стає більше, віднімання — коли менше. Рахуємо в межах 10–20.',
  theory: [
    'Додавання (+) — складаємо разом. Було 2 яблука, додали 3 — стало 5.',
    'Віднімання (−) — забираємо. Було 5 цукерок, з’їли 2 — лишилось 3.',
    'Знак «=» читається «дорівнює» і означає «стільки ж».',
  ],
  examples: [
    '2 + 3 = 5',
    '7 − 4 = 3',
    '6 + 4 = 10',
  ],
  checks: [
    { statement: '2 + 2 = 4', correct: true },
    { statement: '5 − 1 = 3', correct: false },
    { statement: '3 + 4 = 7', correct: true },
    { statement: '8 − 5 = 4', correct: false },
    { statement: '6 + 0 = 6', correct: true },
  ],
  gameId: 'math-expressions',
  parentTip: 'Показуйте на пальцях і предметах. Розповідайте історіями «було–стало»: «у тебе 3 цукерки, я дам ще 2».',
};

const g1Compare: LearningTheme = {
  id: 'g1-compare',
  islandId: 'math',
  availableFor: ['grade1'],
  title: 'Більше, менше чи порівну',
  icon: '⚖️',
  intro: 'Вчимося порівнювати числа: яке більше, яке менше, чи вони рівні.',
  theory: [
    'Знак > означає «більше»: 5 > 3 (п’ять більше за три).',
    'Знак < означає «менше»: 2 < 4 (два менше за чотири).',
    'Знак = означає «рівно»: 3 = 3.',
    'Хитрість: гострий «дзьобик» знака завжди дивиться на менше число, а відкрита частина — на більше.',
  ],
  examples: [
    '5 > 2',
    '1 < 4',
    '3 = 3',
  ],
  checks: [
    { statement: '5 > 3', correct: true },
    { statement: '2 > 6', correct: false },
    { statement: '4 < 7', correct: true },
    { statement: '8 < 5', correct: false },
    { statement: '6 = 6', correct: true },
  ],
  gameId: 'math-compare',
  parentTip: 'Порівнюйте кількості предметів: «у кого більше цукерок?». Знак — це «голодний рот», що завжди їсть більше число.',
};

// ── 2 клас ───────────────────────────────────────────────
const g2AddSub100: LearningTheme = {
  id: 'g2-add-sub-100',
  islandId: 'math',
  availableFor: ['grade2'],
  title: 'Додавання і віднімання до 100',
  icon: '🔢',
  intro: 'Тепер рахуємо з більшими числами — десятками й одиницями, у межах 100.',
  theory: [
    'Числа до 100 складаються з десятків і одиниць: 34 — це 3 десятки і 4 одиниці.',
    'Додаємо окремо десятки й окремо одиниці: 23 + 14 = (20 + 10) + (3 + 4) = 37.',
    'Так само віднімаємо: 45 − 12 = (40 − 10) + (5 − 2) = 33.',
  ],
  examples: [
    '23 + 14 = 37',
    '45 − 12 = 33',
    '50 + 30 = 80',
  ],
  checks: [
    { statement: '20 + 30 = 50', correct: true },
    { statement: '45 − 5 = 30', correct: false },
    { statement: '12 + 6 = 18', correct: true },
    { statement: '60 − 20 = 30', correct: false },
    { statement: '33 + 0 = 33', correct: true },
  ],
  gameId: 'math-expressions',
  parentTip: 'Розкладайте числа на десятки й одиниці вголос. Рахунок грошей (10 + 10 + 5) добре тренує цю навичку.',
};

const g2Column: LearningTheme = {
  id: 'g2-column',
  islandId: 'math',
  availableFor: ['grade2'],
  title: 'Додавання у стовпчик',
  icon: '🧮',
  intro: 'Коли числа великі, зручно записувати їх одне під одним — у стовпчик.',
  theory: [
    'Записуємо числа одне під одним: одиниці під одиницями, десятки під десятками.',
    'Додаємо справа наліво: спочатку одиниці, потім десятки.',
    'Якщо одиниць вийшло більше 9 — один десяток «переходить» далі (маленька 1 над наступною колонкою).',
  ],
  examples: [
    '23 + 14:  3+4=7,  2+1=3  →  37',
    '28 + 5:  8+5=13, пишемо 3, 1 у десятки  →  33',
    '46 + 12 = 58',
  ],
  checks: [
    { statement: 'Одиниці пишемо під одиницями', correct: true },
    { statement: 'Додаємо зліва направо', correct: false },
    { statement: '23 + 14 = 37', correct: true },
    { statement: 'Якщо вийшло 13 одиниць — пишемо 3, а 1 переходить у десятки', correct: true },
    { statement: '28 + 5 = 30', correct: false },
  ],
  gameId: 'column-arithmetic',
  parentTip: 'Спочатку приклади без переходу через десяток (23 + 14), потім з переходом (28 + 5). Пишіть олівцем у клітинку.',
};

// ── 3 клас ───────────────────────────────────────────────
const multiplication: LearningTheme = {
  id: 'multiplication',
  islandId: 'math',
  availableFor: ['grade2', 'grade3', 'grade4'],
  title: 'Таблиця множення',
  icon: '✖️',
  intro: 'Множення — це швидкий спосіб додати багато однакових груп. Замість довгого "3 + 3 + 3" кажемо коротко "3 помножити на 3".',
  theory: [
    'Уяви 3 тарілки, і на кожній по 2 яблука. Скільки яблук разом? Можна порахувати: 2 + 2 + 2 = 6.',
    'Математики ліняться писати довго, тому кажуть коротко: 3 × 2. Це означає "по 2 взяти 3 рази". Відповідь та сама — 6.',
    'Маленька хитрість: від перестановки відповідь не змінюється. 3 × 2 = 2 × 3. Вивчив один приклад — знаєш одразу два!',
    'Найлегше починати з множення на 2, на 5 і на 10. А найважче — на 6, 7, 8. Їх вчимо в останню чергу й повторюємо найчастіше.',
  ],
  examples: [
    '2 × 3 = 2 + 2 + 2 = 6',
    '5 × 4 = 5 + 5 + 5 + 5 = 20',
    '4 × 2 = 2 × 4 = 8',
    '3 × 6 = 18   (по 3 взяти 6 разів)',
  ],
  checks: [
    { statement: '2 × 3 = 6', correct: true },
    { statement: '5 × 2 = 7', correct: false },
    { statement: '4 × 1 = 4', correct: true },
    { statement: '3 × 3 = 6', correct: false },
    { statement: '2 × 5 = 10', correct: true },
  ],
  gameId: 'times-tables',
  parentTip: 'Спершу покажіть суть на предметах (тарілки × яблука), і лише потім вчіть напам’ять. По 5–10 хвилин щодня. Помилки складайте в окрему "пачку для повторення".',
};

export const LEARNING_THEMES: LearningTheme[] = [
  g1Count,
  g1AddSub,
  g1Compare,
  g2AddSub100,
  g2Column,
  multiplication,
];

export const listThemesByIsland = (
  islandId: string,
  ageGroupId: AgeGroupId,
): LearningTheme[] =>
  LEARNING_THEMES.filter(
    (th) => th.islandId === islandId && th.availableFor.includes(ageGroupId),
  );

export const getThemeById = (id: string): LearningTheme | undefined =>
  LEARNING_THEMES.find((th) => th.id === id);
