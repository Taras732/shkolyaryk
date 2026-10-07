/**
 * Озвучка слова голосом браузера (Web Speech API) — безкоштовно й офлайн там,
 * де голоси встановлені в системі. Голосу англійської може не бути (деякі
 * Android-збірки) — тоді кнопка 🔊 ховається, а гра працює без звуку.
 */
export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function englishVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang === 'en-GB') ?? voices.find((v) => v.lang === 'en-US') ?? voices.find((v) => v.lang.startsWith('en'));
}

export function speak(text: string): void {
  if (!canSpeak()) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-GB';
  u.rate = 0.8; // повільніше — дитина чує кожен звук
  const v = englishVoice();
  if (v) u.voice = v;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}
