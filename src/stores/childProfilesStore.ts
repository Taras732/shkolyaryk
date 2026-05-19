import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './middleware/mmkvPersist';
import { mmkvStorage as rawMmkvStorage } from '../utils/mmkv';
import { useAnalyticsStore } from './analyticsStore';
import type { AgeGroupId } from '../constants/ageGroups';

export interface ChildProfile {
  id: string;
  name: string;
  ageGroupId: AgeGroupId;
  gradeId: string | null;
  avatarId: string;
  createdAt: number;
}

interface ChildProfilesState {
  profiles: ChildProfile[];
  activeProfileId: string | null;
  addProfile: (
    profile: Omit<ChildProfile, 'id' | 'createdAt' | 'gradeId'> & { gradeId?: string | null },
  ) => string;
  updateProfile: (id: string, patch: Partial<Omit<ChildProfile, 'id' | 'createdAt'>>) => void;
  removeProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;
  getActiveProfile: () => ChildProfile | null;
  restoreFromBackup: (backupVersion: number) => boolean;
  listBackups: () => Array<{ version: number; createdAt: number; profileCount: number }>;
}

const CURRENT_VERSION = 3;
const STORE_NAME = 'child-profiles';
const BACKUP_KEY_PREFIX = `${STORE_NAME}-backup-v`;
const MAX_BACKUPS = 3;

interface BackupPayload {
  version: number;
  createdAt: number;
  state: string;
}

const generateId = (): string =>
  `child_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

function snapshotBeforeMigration(rawSerializedState: string, fromVersion: number): void {
  try {
    const payload: BackupPayload = {
      version: fromVersion,
      createdAt: Date.now(),
      state: rawSerializedState,
    };
    const key = `${BACKUP_KEY_PREFIX}${fromVersion}-${payload.createdAt}`;
    rawMmkvStorage.set(key, JSON.stringify(payload));
    const allKeys = rawMmkvStorage.getAllKeys().filter((k) => k.startsWith(BACKUP_KEY_PREFIX));
    if (allKeys.length > MAX_BACKUPS) {
      const sorted = [...allKeys].sort();
      sorted.slice(0, sorted.length - MAX_BACKUPS).forEach((k) => rawMmkvStorage.delete(k));
    }
  } catch (e) {
    console.warn('[childProfilesStore] snapshot failed', e);
  }
}

let pendingMigrationFromVersion: number | null = null;

interface PersistedShape {
  profiles?: ChildProfile[];
  activeProfileId?: string | null;
}

function migrateChildProfiles(
  persistedState: unknown,
  version: number,
): PersistedShape {
  try {
    snapshotBeforeMigration(JSON.stringify(persistedState ?? {}), version);
  } catch (e) {
    console.warn('[childProfilesStore] pre-migrate snapshot error', e);
  }

  const state = (persistedState as PersistedShape) ?? {};
  const incomingProfiles = Array.isArray(state.profiles) ? state.profiles : [];

  switch (version) {
    case 1:
      console.log('[childProfilesStore] migrate v1→current (no-op for profile shape)');
      pendingMigrationFromVersion = 1;
      return {
        profiles: incomingProfiles,
        activeProfileId: state.activeProfileId ?? null,
      };
    case 2: {
      console.log(
        `[childProfilesStore] migrate v2→v3 (${incomingProfiles.length} profile(s); adding gradeId)`,
      );
      pendingMigrationFromVersion = 2;
      return {
        profiles: incomingProfiles.map((p) => ({
          ...p,
          gradeId: (p as ChildProfile).gradeId ?? null,
        })),
        activeProfileId: state.activeProfileId ?? null,
      };
    }
    default: {
      console.warn(
        `[childProfilesStore] migrate from unknown v${version} — best-effort preserve, no wipe`,
      );
      pendingMigrationFromVersion = version;
      return {
        profiles: incomingProfiles,
        activeProfileId: state.activeProfileId ?? null,
      };
    }
  }
}

export const useChildProfilesStore = create<ChildProfilesState>()(
  persist(
    (set, get) => ({
      profiles: [],
      activeProfileId: null,
      addProfile: (input) => {
        const id = generateId();
        const profile: ChildProfile = {
          name: input.name,
          ageGroupId: input.ageGroupId,
          avatarId: input.avatarId,
          gradeId: input.gradeId ?? null,
          id,
          createdAt: Date.now(),
        };
        set((state) => ({
          profiles: [...state.profiles, profile],
          activeProfileId: state.activeProfileId ?? id,
        }));
        return id;
      },
      updateProfile: (id, patch) =>
        set((state) => ({
          profiles: state.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      removeProfile: (id) =>
        set((state) => {
          const remaining = state.profiles.filter((p) => p.id !== id);
          let nextActive = state.activeProfileId;
          if (state.activeProfileId === id) {
            nextActive = remaining[0]?.id ?? null;
          }
          return { profiles: remaining, activeProfileId: nextActive };
        }),
      setActiveProfile: (id) => set({ activeProfileId: id }),
      getActiveProfile: () => {
        const { profiles, activeProfileId } = get();
        return profiles.find((p) => p.id === activeProfileId) ?? null;
      },
      restoreFromBackup: (backupVersion) => {
        try {
          const candidates = rawMmkvStorage
            .getAllKeys()
            .filter((k) => k.startsWith(`${BACKUP_KEY_PREFIX}${backupVersion}-`))
            .sort()
            .reverse();
          const latestKey = candidates[0];
          if (!latestKey) return false;
          const raw = rawMmkvStorage.getString(latestKey);
          if (!raw) return false;
          const payload = JSON.parse(raw) as BackupPayload;
          const parsedState = JSON.parse(payload.state) as PersistedShape;
          set({
            profiles: parsedState.profiles ?? [],
            activeProfileId: parsedState.activeProfileId ?? null,
          });
          useAnalyticsStore.getState().track('store_backup_restored', {
            store: STORE_NAME,
            fromBackupVersion: backupVersion,
            profileCount: (parsedState.profiles ?? []).length,
          });
          return true;
        } catch (e) {
          console.warn('[childProfilesStore] restoreFromBackup failed', e);
          return false;
        }
      },
      listBackups: () => {
        try {
          const keys = rawMmkvStorage
            .getAllKeys()
            .filter((k) => k.startsWith(BACKUP_KEY_PREFIX));
          return keys
            .map((k) => {
              const raw = rawMmkvStorage.getString(k);
              if (!raw) return null;
              try {
                const payload = JSON.parse(raw) as BackupPayload;
                const inner = JSON.parse(payload.state) as PersistedShape;
                return {
                  version: payload.version,
                  createdAt: payload.createdAt,
                  profileCount: (inner.profiles ?? []).length,
                };
              } catch {
                return null;
              }
            })
            .filter(
              (x): x is { version: number; createdAt: number; profileCount: number } => x !== null,
            )
            .sort((a, b) => b.createdAt - a.createdAt);
        } catch {
          return [];
        }
      },
    }),
    {
      name: STORE_NAME,
      storage: createJSONStorage(() => mmkvStorage),
      version: CURRENT_VERSION,
      migrate: (persistedState, version) =>
        migrateChildProfiles(persistedState, version) as unknown as ChildProfilesState,
      onRehydrateStorage: () => () => {
        if (pendingMigrationFromVersion !== null) {
          const fromVersion = pendingMigrationFromVersion;
          pendingMigrationFromVersion = null;
          setTimeout(() => {
            try {
              useAnalyticsStore.getState().track('store_migrated', {
                store: STORE_NAME,
                fromVersion,
                toVersion: CURRENT_VERSION,
              });
            } catch (e) {
              console.warn('[childProfilesStore] analytics track failed', e);
            }
          }, 0);
        }
      },
    },
  ),
);
