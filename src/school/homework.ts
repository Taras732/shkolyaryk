import type { Dict, Status } from '@/games/english-words/core';
import { allWords, statusOf } from '@/games/english-words/core';

/**
 * «Що в завданні?» — клієнтська частина. Фото стискається тут (менше трафіку
 * й дешевший запит), іде на воркер `worker/homework`, відповідь — пояснення
 * завдання, кроки без готової відповіді, англійські слова.
 */

export interface HomeworkWord {
  en: string;
  ua: string;
  emoji: string;
}

export interface HomeworkExplanation {
  readable: boolean;
  subject: 'english' | 'math' | 'ukrainian' | 'other';
  task: string;
  steps: string[];
  /** Навідні запитання (новий воркер; старі відповіді без них). */
  questions?: string[];
  /** Як перевірити себе. */
  selfCheck?: string;
  words: HomeworkWord[];
}

/** Адреса воркера. Не задана — сторінка каже, що сервіс ще не підключено. */
export const HOMEWORK_API: string | undefined = import.meta.env.VITE_HOMEWORK_API;

const CODE_KEY = 'shk.homework.code';

export function loadFamilyCode(): string {
  try {
    return localStorage.getItem(CODE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveFamilyCode(code: string): void {
  try {
    localStorage.setItem(CODE_KEY, code);
  } catch {
    // без пам'яті — код доведеться ввести ще раз
  }
}

/** Статус слова зі сторінки щодо словника дитини: нове / вчу / знаю. */
export function wordStatus(dict: Dict, en: string): Status {
  const key = en.trim().toLowerCase();
  const known = allWords(dict).find((w) => w.en === key);
  return known ? statusOf(dict.words[known.en]) : 'new';
}

export function inDictionary(dict: Dict, en: string): boolean {
  const key = en.trim().toLowerCase();
  return allWords(dict).some((w) => w.en === key);
}

/** Стиснути фото до maxSide px по довшій стороні, JPEG. Текст підручника лишається читабельним. */
export async function compressPhoto(file: File, maxSide = 1600, quality = 0.82): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality).replace(/^data:image\/jpeg;base64,/, '');
}

export type HomeworkError = 'code' | 'image' | 'busy' | 'no_answer' | 'network' | 'server';

export async function explainPhoto(image: string, code: string): Promise<HomeworkExplanation> {
  if (!HOMEWORK_API) throw 'server' as HomeworkError;
  let res: Response;
  try {
    res = await fetch(HOMEWORK_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Family-Code': code },
      body: JSON.stringify({ image }),
    });
  } catch {
    throw 'network' as HomeworkError;
  }
  if (res.ok) return (await res.json()) as HomeworkExplanation;
  if (res.status === 401) throw 'code' as HomeworkError;
  if (res.status === 413 || res.status === 400) throw 'image' as HomeworkError;
  if (res.status === 429) throw 'busy' as HomeworkError;
  if (res.status === 422) throw 'no_answer' as HomeworkError;
  throw 'server' as HomeworkError;
}

export const ERROR_TEXT: Record<HomeworkError, string> = {
  code: 'Сімейний код не підійшов. Попроси батьків ввести його ще раз.',
  image: 'Фото завелике або пошкоджене. Спробуй сфотографувати ще раз.',
  busy: 'Помічник зараз зайнятий. Спробуй за хвилинку.',
  no_answer: 'Не вдалося пояснити це фото. Сфотографуй лише завдання, ближче й рівніше.',
  network: 'Немає інтернету. Перевір з’єднання.',
  server: 'Помічник тимчасово не працює.',
};
