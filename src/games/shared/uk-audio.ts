import { UK_AUDIO_FILES } from './uk-audio-manifest';

/**
 * Українська озвучка для молодших (буквар, склади).
 *
 * Порядок джерел:
 *  1. готовий файл `/audio/uk/<key>.mp3` (перелік у uk-audio-manifest.ts) — звучить
 *     однаково на всіх пристроях і офлайн;
 *  2. український голос пристрою (iPhone «Леся», Android Google TTS);
 *  3. нічого — гра працює візуально, кнопки 🔊 сховані.
 *
 * Чому не просто голос браузера: на десктопному Chrome під Windows українського
 * голосу немає взагалі (перевірено 07.10: 27 голосів, uk — 0), а на телефоні він
 * залежить від налаштувань. Для дитини, що вчить звуки, звук — головне.
 */

let ukVoice: SpeechSynthesisVoice | null | undefined;

function findUkVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  if (ukVoice === undefined || ukVoice === null) {
    ukVoice = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('uk')) ?? null;
  }
  return ukVoice;
}

// голоси підвантажуються асинхронно — перевіряємо ще раз, коли браузер їх віддасть
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    ukVoice = undefined;
    findUkVoice();
  });
}

export function hasUkAudio(key?: string): boolean {
  return (key !== undefined && UK_AUDIO_FILES.has(key)) || findUkVoice() !== null;
}

let current: HTMLAudioElement | null = null;

/** Озвучити: `key` — ім'я файлу, `text` — що казати голосом пристрою, якщо файлу немає. */
export function sayUk(key: string, text: string): void {
  current?.pause();
  if (UK_AUDIO_FILES.has(key)) {
    current = new Audio(`/audio/uk/${key}.mp3`);
    current.play().catch(() => speakUk(text));
    return;
  }
  speakUk(text);
}

function speakUk(text: string): void {
  const voice = findUkVoice();
  if (!voice) return;
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = 0.75; // повільно — малюк має розчути кожен звук
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

let seqToken = 0;

/**
 * Кілька фраз підряд з паузою між ними: «Знайди букву» … «Бе».
 * Назва букви окремим файлом звучить чітко, а не хвостиком речення (рішення 09.10).
 */
export function sayUkSeq(parts: { key: string; text: string }[], gapMs = 450): void {
  const token = ++seqToken;
  current?.pause();
  const playAt = (i: number) => {
    if (token !== seqToken || i >= parts.length) return;
    const { key, text } = parts[i];
    if (!UK_AUDIO_FILES.has(key)) {
      speakUk(text);
      window.setTimeout(() => playAt(i + 1), 900 + gapMs);
      return;
    }
    const a = new Audio(`/audio/uk/${key}.mp3`);
    current = a;
    a.onended = () => window.setTimeout(() => playAt(i + 1), gapMs);
    a.play().catch(() => {
      speakUk(text);
      window.setTimeout(() => playAt(i + 1), 900 + gapMs);
    });
  };
  playAt(0);
}
