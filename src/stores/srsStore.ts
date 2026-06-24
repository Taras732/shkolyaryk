/**
 * SRS (Spaced Repetition System) store — vocabulary mastery engine.
 *
 * ## MMKV Schema
 * Persisted under key `"srs"` via Zustand + MMKV.
 * Root shape:
 *   wordStateByProfile: Record<profileId, Record<wordKey, WordSrsState>>
 *
 * wordKey format: `"${categoryId}:${wordId}"`
 *
 * WordSrsState:
 *   streak        — consecutive correct answers (resets to 0 on wrong)
 *   totalAnswers  — total times this word has been answered
 *   lastAnsweredAt — Unix ms of most recent answer
 *
 * Bucket derivation (not stored, always computed):
 *   "new"      — totalAnswers === 0
 *   "learning" — totalAnswers > 0 && streak < KNOWN_THRESHOLD
 *   "known"    — streak >= KNOWN_THRESHOLD  (default: 3)
 *
 * Mastery % for a category = (knownWords / totalWords) * 100
 * 100% mastery = every word in the category is in the "known" bucket.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './middleware/mmkvPersist';

export const KNOWN_THRESHOLD = 3;

export type SrsBucket = 'new' | 'learning' | 'known';

export interface WordSrsState {
  streak: number;
  totalAnswers: number;
  lastAnsweredAt: number;
}

function getBucket(state: WordSrsState | undefined): SrsBucket {
  if (!state || state.totalAnswers === 0) return 'new';
  if (state.streak >= KNOWN_THRESHOLD) return 'known';
  return 'learning';
}

function wordKey(categoryId: string, wordId: string): string {
  return `${categoryId}:${wordId}`;
}

interface SrsStoreState {
  wordStateByProfile: Record<string, Record<string, WordSrsState>>;

  recordAnswer: (profileId: string, categoryId: string, wordId: string, correct: boolean) => void;
  getWordState: (profileId: string, categoryId: string, wordId: string) => WordSrsState | undefined;
  getWordBucket: (profileId: string, categoryId: string, wordId: string) => SrsBucket;

  /**
   * Returns mastery percentage 0–100 for the given category.
   * wordIds = all word IDs in the category (e.g. the 10 vocab words).
   */
  getCategoryMastery: (profileId: string, categoryId: string, wordIds: string[]) => number;

  /**
   * Builds a weighted word list for a new session.
   *
   * Rules:
   * - "new" and "learning" words have weight 3; "known" words have weight 1.
   * - If there are ≥2 "learning" words, at least 2 are guaranteed in the result.
   * - Returns exactly `count` word IDs (with possible repeats if pool is small).
   *
   * @param wordIds All word IDs in the category.
   * @param count   How many words to include in the session (typically 10).
   */
  buildSession: (profileId: string, categoryId: string, wordIds: string[], count: number) => string[];

  resetCategory: (profileId: string, categoryId: string, wordIds: string[]) => void;
}

export const useSrsStore = create<SrsStoreState>()(
  persist(
    (set, get) => ({
      wordStateByProfile: {},

      recordAnswer: (profileId, categoryId, wordId, correct) =>
        set((state) => {
          const key = wordKey(categoryId, wordId);
          const profileWords = state.wordStateByProfile[profileId] ?? {};
          const existing = profileWords[key];
          const prev: WordSrsState = existing ?? { streak: 0, totalAnswers: 0, lastAnsweredAt: 0 };
          const next: WordSrsState = {
            streak: correct ? prev.streak + 1 : 0,
            totalAnswers: prev.totalAnswers + 1,
            lastAnsweredAt: Date.now(),
          };
          return {
            wordStateByProfile: {
              ...state.wordStateByProfile,
              [profileId]: { ...profileWords, [key]: next },
            },
          };
        }),

      getWordState: (profileId, categoryId, wordId) =>
        get().wordStateByProfile[profileId]?.[wordKey(categoryId, wordId)],

      getWordBucket: (profileId, categoryId, wordId) =>
        getBucket(get().wordStateByProfile[profileId]?.[wordKey(categoryId, wordId)]),

      getCategoryMastery: (profileId, categoryId, wordIds) => {
        if (wordIds.length === 0) return 0;
        const profileWords = get().wordStateByProfile[profileId] ?? {};
        const knownCount = wordIds.filter(
          (wid) => getBucket(profileWords[wordKey(categoryId, wid)]) === 'known',
        ).length;
        return Math.round((knownCount / wordIds.length) * 100);
      },

      buildSession: (profileId, categoryId, wordIds, count) => {
        if (wordIds.length === 0) return [];
        const profileWords = get().wordStateByProfile[profileId] ?? {};

        const byBucket: Record<SrsBucket, string[]> = { new: [], learning: [], known: [] };
        for (const wid of wordIds) {
          byBucket[getBucket(profileWords[wordKey(categoryId, wid)])].push(wid);
        }

        const session: string[] = [];

        // Guarantee ≥2 learning words if available
        const learningGuaranteed = byBucket.learning.slice(0, Math.min(2, count));
        for (const wid of learningGuaranteed) {
          session.push(wid);
        }

        // Build weighted pool: new+learning × 3, known × 1
        const pool: string[] = [];
        for (const wid of byBucket.new) pool.push(wid, wid, wid);
        for (const wid of byBucket.learning) pool.push(wid, wid, wid);
        for (const wid of byBucket.known) pool.push(wid);

        // Fill remaining slots from the weighted pool, excluding already-guaranteed words
        const remaining = count - session.length;
        const guaranteed = new Set(learningGuaranteed);
        const availablePool = pool.filter((wid) => !guaranteed.has(wid));

        const shuffled = weightedShuffle(availablePool);
        for (let i = 0; i < remaining; i++) {
          if (shuffled.length === 0) {
            // Pool exhausted — repeat from full pool
            const fallback = wordIds[i % wordIds.length];
            session.push(fallback);
          } else {
            session.push(shuffled[i % shuffled.length]);
          }
        }

        return shuffle(session);
      },

      resetCategory: (profileId, categoryId, wordIds) =>
        set((state) => {
          const profileWords = { ...(state.wordStateByProfile[profileId] ?? {}) };
          for (const wid of wordIds) {
            delete profileWords[wordKey(categoryId, wid)];
          }
          return {
            wordStateByProfile: {
              ...state.wordStateByProfile,
              [profileId]: profileWords,
            },
          };
        }),
    }),
    {
      name: 'srs',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Deduplicate weighted pool entries, then shuffle. */
function weightedShuffle(pool: string[]): string[] {
  return shuffle(pool);
}
