import { useState, useCallback, useEffect } from 'react';
import { prewarmTTS, speakWord, stopSpeech, isTTSAvailable } from './audioPlayer';
import type { LangCode } from './types';

export interface UseTTSResult {
  speak: (word: string, lang: LangCode) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  ttsAvailable: boolean | null;
  showFallback: boolean;
}

export function useTTS(prewarm = false): UseTTSResult {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsAvailable, setTtsAvailable] = useState<boolean | null>(isTTSAvailable);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (!prewarm) return;
    prewarmTTS().then(() => {
      setTtsAvailable(isTTSAvailable());
    });
    return () => {
      stopSpeech();
    };
  }, [prewarm]);

  const speak = useCallback(async (word: string, lang: LangCode) => {
    setShowFallback(false);
    setIsSpeaking(true);

    await speakWord(word, lang, {
      onStart: () => setIsSpeaking(true),
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
      onFallback: () => {
        setTtsAvailable(false);
        setShowFallback(true);
        setIsSpeaking(false);
      },
    });
  }, []);

  const stop = useCallback(() => {
    stopSpeech();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking, ttsAvailable, showFallback };
}
