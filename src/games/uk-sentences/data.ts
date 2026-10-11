/**
 * Речення для гри «Речення» (11.10.2026), 1 клас. Прості, щоб першокласниця прочитала сама.
 * `id` — ключ озвучки `sen_<id>` (scripts/gen-uk-audio.py читає id і text звідси).
 */

export interface CountItem {
  id: string;
  text: string;
  emoji: string;
}

/** Скільки слів: 2–4 слова; «у», «в», «до» — теж слова (програма: службові слова). */
export const COUNT: CountItem[] = [
  { id: 'c1', text: 'Сонце світить.', emoji: '☀️' },
  { id: 'c2', text: 'Кіт спить.', emoji: '🐱' },
  { id: 'c3', text: 'Мама варить суп.', emoji: '🍲' },
  { id: 'c4', text: 'Діти грають у мʼяч.', emoji: '⚽' },
  { id: 'c5', text: 'Іде дощ.', emoji: '🌧️' },
  { id: 'c6', text: 'Тато читає книжку.', emoji: '📖' },
  { id: 'c7', text: 'Пташка співає.', emoji: '🐦' },
  { id: 'c8', text: 'Бабуся пече пиріг.', emoji: '🥧' },
  { id: 'c9', text: 'Ми йдемо в парк.', emoji: '🌳' },
  { id: 'c10', text: 'Зайчик їсть моркву.', emoji: '🐰' },
  { id: 'c11', text: 'Падає сніг.', emoji: '❄️' },
  { id: 'c12', text: 'Собака біжить до будки.', emoji: '🐶' },
];

export interface FillItem {
  id: string;
  /** Речення з пропуском `___`. */
  text: string;
  answer: string;
  wrong: [string, string];
  emoji: string;
}

export const FILL: FillItem[] = [
  { id: 'f1', text: 'Корова дає ___.', answer: 'молоко', wrong: ['сніг', 'книжку'], emoji: '🐮' },
  { id: 'f2', text: 'Взимку падає ___.', answer: 'сніг', wrong: ['сонце', 'мʼяч'], emoji: '❄️' },
  { id: 'f3', text: 'Кіт ловить ___.', answer: 'мишку', wrong: ['хмару', 'ложку'], emoji: '🐱' },
  { id: 'f4', text: 'Бджола збирає ___.', answer: 'мед', wrong: ['сир', 'дощ'], emoji: '🐝' },
  { id: 'f5', text: 'Учні йдуть до ___.', answer: 'школи', wrong: ['хмари', 'ложки'], emoji: '🏫' },
  { id: 'f6', text: 'Риба плаває у ___.', answer: 'воді', wrong: ['піску', 'хмарі'], emoji: '🐟' },
  { id: 'f7', text: 'Пташка має два ___.', answer: 'крила', wrong: ['хвости', 'носи'], emoji: '🐦' },
  { id: 'f8', text: 'Ми їмо суп ___.', answer: 'ложкою', wrong: ['олівцем', 'шапкою'], emoji: '🥄' },
];

export type Mark = '.' | '?' | '!';

export interface MarkItem {
  id: string;
  /** Речення без знака в кінці. */
  text: string;
  mark: Mark;
}

export const MARKS: MarkItem[] = [
  { id: 'm1', text: 'Котра година', mark: '?' },
  { id: 'm2', text: 'Ура, канікули', mark: '!' },
  { id: 'm3', text: 'Сьогодні тепло', mark: '.' },
  { id: 'm4', text: 'Ти любиш яблука', mark: '?' },
  { id: 'm5', text: 'Обережно, слизько', mark: '!' },
  { id: 'm6', text: 'Кіт спить на дивані', mark: '.' },
  { id: 'm7', text: 'Де мій мʼяч', mark: '?' },
  { id: 'm8', text: 'Як гарно', mark: '!' },
  { id: 'm9', text: 'Мама купила хліб', mark: '.' },
  { id: 'm10', text: 'Хто там', mark: '?' },
];

/** Повний текст для озвучки (інтонація береться зі знака). */
export const fullText = {
  fill: (f: FillItem) => f.text.replace('___', f.answer),
  mark: (m: MarkItem) => m.text + m.mark,
};

export const wordCount = (text: string) => text.replace(/[.,!?]/g, '').trim().split(/\s+/).length;
