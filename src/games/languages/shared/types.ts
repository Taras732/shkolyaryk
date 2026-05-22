export type LangCode = 'en-US' | 'uk-UA';

export type VocabCategory = 'animals' | 'food' | 'colors' | 'body' | 'objects';

export interface VocabWord {
  id: string;
  word: string;
  lang: LangCode;
  emoji: string;
  category: VocabCategory;
  /** paired id in the other language — same concept */
  pairId: string;
}

export interface TTSResult {
  spoken: boolean;
  fallback: boolean;
}
