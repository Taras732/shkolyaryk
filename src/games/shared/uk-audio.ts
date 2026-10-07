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
