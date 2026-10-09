/**
 * Що звучить, коли гра просить знайти букву чи цифру.
 * Ціль не пишеться на екрані (інакше відповідь видно в завданні) — її лише чути.
 * Для української — назва букви («бе»), не звук: синтезатор вимовляє назви надійно.
 */

export const UK_LETTER_NAMES: Record<string, string> = {
  А: 'а', Б: 'бе', В: 'ве', Г: 'ге', Ґ: 'ґе', Д: 'де', Е: 'е', Є: 'є', Ж: 'же', З: 'зе',
  И: 'и', І: 'і', Ї: 'ї', Й: 'йот', К: 'ка', Л: 'ел', М: 'ем', Н: 'ен', О: 'о', П: 'пе',
  Р: 'ер', С: 'ес', Т: 'те', У: 'у', Ф: 'еф', Х: 'ха', Ц: 'це', Ч: 'че', Ш: 'ша', Щ: 'ща',
  Ь: 'мʼякий знак', Ю: 'ю', Я: 'я',
};

export const UK_DIGIT_NAMES = ['нуль', 'один', 'два', 'три', 'чотири', 'пʼять', 'шість', 'сім', 'вісім', 'девʼять'];

/** Англійські назви букв (en-GB): голос читає «A» як артикль, тому пишемо вимову. */
export const EN_LETTER_NAMES: Record<string, string> = {
  A: 'ay', B: 'bee', C: 'see', D: 'dee', E: 'ee', F: 'ef', G: 'jee', H: 'aitch', I: 'eye',
  J: 'jay', K: 'kay', L: 'el', M: 'em', N: 'en', O: 'oh', P: 'pee', Q: 'cue', R: 'ar',
  S: 'ess', T: 'tee', U: 'you', V: 'vee', W: 'double you', X: 'ex', Y: 'why', Z: 'zed',
};

/** Ключ аудіофайлу і текст для голосу пристрою (якщо файлу немає). */
export const findLetterKey = (ch: string) => `find_${ch}`;
export const findLetterText = (ch: string) => `Знайди букву ${UK_LETTER_NAMES[ch] ?? ch}.`;
export const findDigitKey = (d: number) => `find_d${d}`;
export const findDigitText = (d: number) => `Знайди цифру ${UK_DIGIT_NAMES[d]}.`;
export const findEnLetterText = (ch: string) => `Find the letter ${EN_LETTER_NAMES[ch] ?? ch}.`;
