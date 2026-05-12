import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './middleware/mmkvPersist';
import type { AgeGroupId } from '../constants/ageGroups';

export interface ChildProfile {
  id: string;
  name: string;
  ageGroupId: AgeGroupId;
  avatarId: string;
  createdAt: number;
  updatedAt: number;
}

interface ChildProfilesState {
  profiles: ChildProfile[];
  activeProfileId: string | null;
  addProfile: (profile: Omit<ChildProfile, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateProfile: (id: string, patch: Partial<Omit<ChildProfile, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  removeProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;
  getActiveProfile: () => ChildProfile | null;
  mergeRemoteProfiles: (remoteProfiles: ChildProfile[]) => void;
}

const generateId = (): string =>
  `child_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const useChildProfilesStore = create<ChildProfilesState>()(
  persist(
    (set, get) => ({
      profiles: [],
      activeProfileId: null,
      addProfile: (input) => {
        const now = Date.now();
        const id = generateId();
        const profile: ChildProfile = { ...input, id, createdAt: now, updatedAt: now };
        set((state) => ({
          profiles: [...state.profiles, profile],
          activeProfileId: state.activeProfileId ?? id,
        }));
        return id;
      },
      updateProfile: (id, patch) =>
        set((state) => ({
          profiles: state.profiles.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p,
          ),
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
      // Applies remote profiles that won LWW resolution (remote.updatedAt > local.updatedAt).
      mergeRemoteProfiles: (remoteProfiles) =>
        set((state) => {
          const localMap = new Map(state.profiles.map((p) => [p.id, p]));
          for (const remote of remoteProfiles) {
            localMap.set(remote.id, remote);
          }
          const profiles = Array.from(localMap.values());
          const activeStillExists = profiles.some((p) => p.id === state.activeProfileId);
          return {
            profiles,
            activeProfileId: activeStillExists
              ? state.activeProfileId
              : (profiles[0]?.id ?? null),
          };
        }),
    }),
    {
      name: 'child-profiles',
      storage: createJSONStorage(() => mmkvStorage),
      version: 3,
      migrate: (persisted, version) => {
        // v2 → v3: backfill updatedAt from createdAt for existing profiles
        if (version < 3) {
          const state = persisted as {
            profiles?: Array<Record<string, unknown>>;
            activeProfileId?: string | null;
          };
          return {
            profiles: (state.profiles ?? []).map((p) => ({
              ...p,
              updatedAt: (p['updatedAt'] as number | undefined) ?? (p['createdAt'] as number | undefined) ?? Date.now(),
            })),
            activeProfileId: state.activeProfileId ?? null,
          };
        }
        return persisted as { profiles: ChildProfile[]; activeProfileId: string | null };
      },
    },
  ),
);
