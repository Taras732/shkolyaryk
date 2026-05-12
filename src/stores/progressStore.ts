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

export type DifficultyLevel = 1 | 2 | 3;

interface ProgressState {
  xpByProfile: Record<string, number>;
  badgesByProfile: Record<string, string[]>;
  gameProgressByProfile: Record<string, Record<string, GameProgress>>;
  unlockedLevelByProfile: Record<string, Record<string, DifficultyLevel>>;
  updatedAtByProfile: Record<string, number>;
  addXp: (profileId: string, amount: number) => void;
  awardBadge: (profileId: string, badgeId: string) => void;
  recordGameSession: (profileId: string, gameId: string, score: number, difficulty: number) => void;
  getUnlockedLevel: (profileId: string, gameId: string) => DifficultyLevel;
  unlockNextLevel: (profileId: string, gameId: string, currentLevel: DifficultyLevel) => void;
  getXp: (profileId: string) => number;
  getLevel: (profileId: string) => number;
  mergeRemoteProgress: (
    profileId: string,
    remote: {
      xp: number;
      badges: string[];
      gameProgress: Record<string, GameProgress>;
      unlockedLevels: Record<string, DifficultyLevel>;
      updatedAt: number;
    },
  ) => void;
}

const XP_PER_LEVEL = 100;

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      xpByProfile: {},
      badgesByProfile: {},
      gameProgressByProfile: {},
      unlockedLevelByProfile: {},
      updatedAtByProfile: {},
      addXp: (profileId, amount) =>
        set((state) => ({
          xpByProfile: {
            ...state.xpByProfile,
            [profileId]: (state.xpByProfile[profileId] ?? 0) + amount,
          },
          updatedAtByProfile: { ...state.updatedAtByProfile, [profileId]: Date.now() },
        })),
      awardBadge: (profileId, badgeId) =>
        set((state) => {
          const current = state.badgesByProfile[profileId] ?? [];
          if (current.includes(badgeId)) return state;
          return {
            badgesByProfile: { ...state.badgesByProfile, [profileId]: [...current, badgeId] },
            updatedAtByProfile: { ...state.updatedAtByProfile, [profileId]: Date.now() },
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
            updatedAtByProfile: { ...state.updatedAtByProfile, [profileId]: Date.now() },
          };
        }),
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
            updatedAtByProfile: { ...state.updatedAtByProfile, [profileId]: Date.now() },
          };
        }),
      getXp: (profileId) => get().xpByProfile[profileId] ?? 0,
      getLevel: (profileId) => Math.floor((get().xpByProfile[profileId] ?? 0) / XP_PER_LEVEL) + 1,
      // Applies remote progress only if remote.updatedAt > local (LWW).
      mergeRemoteProgress: (profileId, remote) =>
        set((state) => {
          const localUpdatedAt = state.updatedAtByProfile[profileId] ?? 0;
          if (remote.updatedAt <= localUpdatedAt) return state;
          return {
            xpByProfile: { ...state.xpByProfile, [profileId]: remote.xp },
            badgesByProfile: { ...state.badgesByProfile, [profileId]: remote.badges },
            gameProgressByProfile: {
              ...state.gameProgressByProfile,
              [profileId]: remote.gameProgress,
            },
            unlockedLevelByProfile: {
              ...state.unlockedLevelByProfile,
              [profileId]: remote.unlockedLevels,
            },
            updatedAtByProfile: { ...state.updatedAtByProfile, [profileId]: remote.updatedAt },
          };
        }),
    }),
    {
      name: 'progress',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
