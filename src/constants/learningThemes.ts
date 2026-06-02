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
  parentTip: 'Спершу покажіть суть на предметах (тарілки × яблука), і лише потім вчіть напам\'ять. По 5–10 хвилин щодня. Помилки складайте в окрему "пачку для повторення".',
};

export const LEARNING_THEMES: LearningTheme[] = [multiplication];

export const listThemesByIsland = (
  islandId: string,
  ageGroupId: AgeGroupId,
): LearningTheme[] =>
  LEARNING_THEMES.filter(
    (th) => th.islandId === islandId && th.availableFor.includes(ageGroupId),
  );

export const getThemeById = (id: string): LearningTheme | undefined =>
  LEARNING_THEMES.find((th) => th.id === id);
