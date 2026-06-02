import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './middleware/mmkvPersist';

export interface GameProgress {
  gameId: string;
  playCount: number;
  bestScore: number;
  lastDifficulty: number;
  lastPlayedAt: number;
}

/** Один завершений ігровий сеанс — основа аналітики та звітів батькам. */
export interface SessionLog {
  gameId: string;
  islandId: string;
  difficulty: number;
  stars: number;
  xpEarned: number;
  mistakes: number;
  totalTasks: number;
  durationMs: number;
  finishedAt: number;
}

export type DifficultyLevel = 1 | 2 | 3;

const MAX_SESSIONS_PER_PROFILE = 300;

interface ProgressState {
  xpByProfile: Record<string, number>;
  badgesByProfile: Record<string, string[]>;
  gameProgressByProfile: Record<string, Record<string, GameProgress>>;
  unlockedLevelByProfile: Record<string, Record<string, DifficultyLevel>>;
  sessionsByProfile: Record<string, SessionLog[]>;
  /** Освоєні множники таблиці множення (1..10) per profile. */
  multiplyMasteryByProfile: Record<string, number[]>;
  addXp: (profileId: string, amount: number) => void;
  awardBadge: (profileId: string, badgeId: string) => void;
  recordGameSession: (profileId: string, gameId: string, score: number, difficulty: number) => void;
  logSession: (profileId: string, log: SessionLog) => void;
  getSessions: (profileId: string) => SessionLog[];
  markMultiplyMastered: (profileId: string, multiplier: number) => void;
  getMultiplyMastery: (profileId: string) => number[];
  getUnlockedLevel: (profileId: string, gameId: string) => DifficultyLevel;
  unlockNextLevel: (profileId: string, gameId: string, currentLevel: DifficultyLevel) => void;
  getXp: (profileId: string) => number;
  getLevel: (profileId: string) => number;
}

const XP_PER_LEVEL = 100;

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      xpByProfile: {},
      badgesByProfile: {},
      gameProgressByProfile: {},
      unlockedLevelByProfile: {},
      sessionsByProfile: {},
      multiplyMasteryByProfile: {},
      addXp: (profileId, amount) =>
        set((state) => ({
          xpByProfile: {
            ...state.xpByProfile,
            [profileId]: (state.xpByProfile[profileId] ?? 0) + amount,
          },
        })),
      awardBadge: (profileId, badgeId) =>
        set((state) => {
          const current = state.badgesByProfile[profileId] ?? [];
          if (current.includes(badgeId)) return state;
          return {
            badgesByProfile: { ...state.badgesByProfile, [profileId]: [...current, badgeId] },
          };
        }),
      recordGameSession: (profileId, gameId, score, difficulty) =>
        set((state) => {
          const profileGames = state.gameProgressByProfile[profileId] ?? {};
          const existing = profileGames[gameId];
          const updated: GameProgress = {
            gameId,
            playCount: (existing?.playCount ?? 0) + 1,
            bestScore: Math.max(existing?.bestScore ?? 0, score),
            lastDifficulty: difficulty,
            lastPlayedAt: Date.now(),
          };
          return {
            gameProgressByProfile: {
              ...state.gameProgressByProfile,
              [profileId]: { ...profileGames, [gameId]: updated },
            },
          };
        }),
      logSession: (profileId, log) =>
        set((state) => {
          const existing = state.sessionsByProfile[profileId] ?? [];
          const next = [...existing, log].slice(-MAX_SESSIONS_PER_PROFILE);
          return {
            sessionsByProfile: { ...state.sessionsByProfile, [profileId]: next },
          };
        }),
      getSessions: (profileId) => get().sessionsByProfile[profileId] ?? [],
      markMultiplyMastered: (profileId, multiplier) =>
        set((state) => {
          const current = state.multiplyMasteryByProfile[profileId] ?? [];
          if (current.includes(multiplier)) return state;
          return {
            multiplyMasteryByProfile: {
              ...state.multiplyMasteryByProfile,
              [profileId]: [...current, multiplier].sort((a, b) => a - b),
            },
          };
        }),
      getMultiplyMastery: (profileId) => get().multiplyMasteryByProfile[profileId] ?? [],
      getUnlockedLevel: (profileId, gameId) =>
        (get().unlockedLevelByProfile[profileId]?.[gameId] ?? 1) as DifficultyLevel,
      unlockNextLevel: (profileId, gameId, currentLevel) =>
        set((state) => {
          if (currentLevel >= 3) return state;
          const next = (currentLevel + 1) as DifficultyLevel;
          const profileLevels = state.unlockedLevelByProfile[profileId] ?? {};
          const existing = profileLevels[gameId] ?? 1;
          if (existing >= next) return state;
          return {
            unlockedLevelByProfile: {
              ...state.unlockedLevelByProfile,
              [profileId]: { ...profileLevels, [gameId]: next },
            },
          };
        }),
      getXp: (profileId) => get().xpByProfile[profileId] ?? 0,
      getLevel: (profileId) => Math.floor((get().xpByProfile[profileId] ?? 0) / XP_PER_LEVEL) + 1,
    }),
    {
      name: 'progress',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
