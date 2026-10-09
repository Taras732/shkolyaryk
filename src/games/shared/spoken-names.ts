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

/** Ключі аудіофайлів: фраза і назва — окремо, грають підряд з паузою (sayUkSeq). */
export const findLetterKey = (ch: string) => `n_${ch}`;
export const findLetterText = (ch: string) => `Знайди букву ${UK_LETTER_NAMES[ch] ?? ch}.`;
export const findDigitKey = (d: number) => `d_${d}`;
export const findDigitText = (d: number) => `Знайди цифру ${UK_DIGIT_NAMES[d]}.`;

/** Повне завдання: «Знайди букву» … «Бе». again — лише назва (кнопка 🔊 «ще раз»). */
export function letterParts(ch: string, again = false) {
  const name = { key: `n_${ch}`, text: UK_LETTER_NAMES[ch] ?? ch };
  return again ? [name] : [{ key: 'p_find_letter', text: 'Знайди букву' }, name];
}
export function digitParts(d: number, again = false) {
  const name = { key: `d_${d}`, text: UK_DIGIT_NAMES[d] };
  return again ? [name] : [{ key: 'p_find_digit', text: 'Знайди цифру' }, name];
}
export const findEnLetterText = (ch: string) => `Find the letter ${EN_LETTER_NAMES[ch] ?? ch}.`;
