import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import type { LangCode, TTSResult } from './types';

let ttsAvailable: boolean | null = null;

/**
 * Call on island load to initialize the TTS engine before first word plays.
 * Avoids the ~300ms cold-start delay on first speak().
 */
export async function prewarmTTS(): Promise<void> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    ttsAvailable = voices.length > 0;
  } catch {
    ttsAvailable = false;
  }
}

export async function speakWord(
  word: string,
  lang: LangCode,
  callbacks?: {
    onStart?: () => void;
    onDone?: () => void;
    onError?: () => void;
    onFallback?: () => void;
  }
): Promise<TTSResult> {
  if (ttsAvailable === null) {
    await prewarmTTS();
  }

  if (!ttsAvailable) {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    callbacks?.onFallback?.();
    return { spoken: false, fallback: true };
  }

  Speech.stop();
  Speech.speak(word, {
    language: lang,
    rate: 0.8,
    pitch: 1.0,
    onStart: callbacks?.onStart,
    onDone: callbacks?.onDone,
    onError: () => {
      callbacks?.onError?.();
    },
    onStopped: callbacks?.onDone,
  });

  return { spoken: true, fallback: false };
}

export function stopSpeech(): void {
  Speech.stop();
}

export function isTTSAvailable(): boolean | null {
  return ttsAvailable;
}
