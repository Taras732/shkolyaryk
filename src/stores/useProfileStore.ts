import { create } from 'zustand';
import { supabase } from '@/utils/supabase';
import { storage } from '@/utils/storage';

export interface ChildProfile {
  id: string;
  parent_id?: string;
  nickname: string;
  age_group: 'under_4' | '5-6' | '6-7' | '7-8';
  avatar_id: string;
  total_stars: number;
  created_at: string;
}

export interface GameProgress {
  game_id: string;
  level: number;
  stars: number;
  history: Record<string, any>;
  updated_at: string;
}

interface ProfileState {
  profiles: ChildProfile[];
  activeProfile: ChildProfile | null;
  progress: Record<string, Record<string, GameProgress>>; // profileId -> game_id -> progress
  loading: boolean;
  syncing: boolean;
  error: string | null;
  
  // Actions
  loadProfiles: (parentUserId?: string) => Promise<void>;
  createProfile: (nickname: string, ageGroup: ChildProfile['age_group'], avatarId: string, parentUserId?: string) => Promise<void>;
  deleteProfile: (profileId: string, parentUserId?: string) => Promise<void>;
  selectProfile: (profileId: string) => void;
  updateProgress: (profileId: string, gameId: string, level: number, starsEarned: number, history: any, parentUserId?: string) => Promise<void>;
  syncPendingData: (parentUserId: string) => Promise<void>;
}

// Local storage key helper
const getGuestProfilesKey = () => 'shk_guest_profiles';
const getGuestActiveProfileKey = () => 'shk_guest_active_profile_id';
const getGuestProgressKey = () => 'shk_guest_progress';

const getUserProfilesKey = (userId: string) => `shk_user_${userId}_profiles`;
const getUserActiveProfileKey = (userId: string) => `shk_user_${userId}_active_profile_id`;
const getUserProgressKey = (userId: string) => `shk_user_${userId}_progress`;
const getSyncQueueKey = (userId: string) => `shk_sync_queue_${userId}`;

interface SyncQueueItem {
  id: string;
  type: 'create_profile' | 'update_progress';
  profileId: string;
  payload: any;
  timestamp: number;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profiles: [],
  activeProfile: null,
  progress: {},
  loading: false,
  syncing: false,
  error: null,

  loadProfiles: async (parentUserId) => {
    set({ loading: true, error: null });

    if (!parentUserId) {
      // 1. Guest Mode: Load from localStorage
      const cachedProfiles = storage.getJSON<ChildProfile[]>(getGuestProfilesKey()) || [];
      const cachedActiveId = storage.get(getGuestActiveProfileKey());
      const cachedProgress = storage.getJSON<Record<string, Record<string, GameProgress>>>(getGuestProgressKey()) || {};

      const activeProfile = cachedProfiles.find(p => p.id === cachedActiveId) || cachedProfiles[0] || null;

      set({
        profiles: cachedProfiles,
        activeProfile,
        progress: cachedProgress,
        loading: false
      });
    } else {
      // 2. Logged In Mode: Try syncing local queue first, then fetch from Supabase
      const localProfilesKey = getUserProfilesKey(parentUserId);
      const localActiveKey = getUserActiveProfileKey(parentUserId);
      const localProgressKey = getUserProgressKey(parentUserId);

      // Load cached local copy immediately for instant UI render
      const cachedProfiles = storage.getJSON<ChildProfile[]>(localProfilesKey) || [];
      const cachedActiveId = storage.get(localActiveKey);
      const cachedProgress = storage.getJSON<Record<string, Record<string, GameProgress>>>(localProgressKey) || {};
      const activeProfile = cachedProfiles.find(p => p.id === cachedActiveId) || cachedProfiles[0] || null;

      set({
        profiles: cachedProfiles,
        activeProfile,
        progress: cachedProgress,
        loading: false
      });

      // Fetch fresh data from Supabase in the background
      try {
        await get().syncPendingData(parentUserId);

        const { data: dbProfiles, error: pError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: true });

        if (pError) throw pError;

        // Fetch progress for these profiles
        const profileIds = dbProfiles.map(p => p.id);
        let dbProgressMap: Record<string, Record<string, GameProgress>> = {};

        if (profileIds.length > 0) {
          const { data: dbProgress, error: prError } = await supabase
            .from('progress')
            .select('*')
            .in('profile_id', profileIds);

          if (prError) throw prError;

          dbProgress.forEach(row => {
            if (!dbProgressMap[row.profile_id]) {
              dbProgressMap[row.profile_id] = {};
            }
            dbProgressMap[row.profile_id][row.game_id] = {
              game_id: row.game_id,
              level: row.level,
              stars: row.stars,
              history: row.history,
              updated_at: row.updated_at
            };
          });
        }

        // Cache fresh data locally
        storage.setJSON(localProfilesKey, dbProfiles);
        storage.setJSON(localProgressKey, dbProgressMap);

        const freshActiveProfile = dbProfiles.find(p => p.id === cachedActiveId) || dbProfiles[0] || null;
        if (freshActiveProfile) {
          storage.set(localActiveKey, freshActiveProfile.id);
        }

        set({
          profiles: dbProfiles,
          activeProfile: freshActiveProfile,
          progress: dbProgressMap
        });
      } catch (err: any) {
        console.warn('Sync failed, using local offline data:', err);
        set({ error: err.message });
      }
    }
  },

  createProfile: async (nickname, ageGroup, avatarId, parentUserId) => {
    const newProfile: ChildProfile = {
      id: crypto.randomUUID(),
      nickname,
      age_group: ageGroup,
      avatar_id: avatarId,
      total_stars: 0,
      created_at: new Date().toISOString()
    };

    if (!parentUserId) {
      // Guest Mode: Write locally
      const updatedProfiles = [...get().profiles, newProfile];
      storage.setJSON(getGuestProfilesKey(), updatedProfiles);
      set({ 
        profiles: updatedProfiles,
        activeProfile: get().activeProfile ? get().activeProfile : newProfile
      });
      if (!get().activeProfile) {
        storage.set(getGuestActiveProfileKey(), newProfile.id);
      }
    } else {
      // User Mode: Write locally & queue for sync
      const localProfilesKey = getUserProfilesKey(parentUserId);
      const queueKey = getSyncQueueKey(parentUserId);

      const updatedProfiles = [...get().profiles, newProfile];
      storage.setJSON(localProfilesKey, updatedProfiles);
      set({ 
        profiles: updatedProfiles,
        activeProfile: get().activeProfile ? get().activeProfile : newProfile
      });
      if (!get().activeProfile) {
        storage.set(getUserActiveProfileKey(parentUserId), newProfile.id);
      }

      // Add to sync queue
      const queue = storage.getJSON<SyncQueueItem[]>(queueKey) || [];
      queue.push({
        id: crypto.randomUUID(),
        type: 'create_profile',
        profileId: newProfile.id,
        payload: { nickname, age_group: ageGroup, avatar_id: avatarId },
        timestamp: Date.now()
      });
      storage.setJSON(queueKey, queue);

      // Attempt background sync
      get().syncPendingData(parentUserId).catch(console.error);
    }
  },

  deleteProfile: async (profileId, parentUserId) => {
    if (!parentUserId) {
      // Guest Mode
      const updatedProfiles = get().profiles.filter(p => p.id !== profileId);
      storage.setJSON(getGuestProfilesKey(), updatedProfiles);
      
      const newActive = get().activeProfile?.id === profileId ? updatedProfiles[0] || null : get().activeProfile;
      if (newActive) storage.set(getGuestActiveProfileKey(), newActive.id);
      else storage.remove(getGuestActiveProfileKey());

      set({ profiles: updatedProfiles, activeProfile: newActive });
    } else {
      // Logged in Mode: Attempt immediate delete, update local immediately
      const localProfilesKey = getUserProfilesKey(parentUserId);
      const updatedProfiles = get().profiles.filter(p => p.id !== profileId);
      storage.setJSON(localProfilesKey, updatedProfiles);

      const newActive = get().activeProfile?.id === profileId ? updatedProfiles[0] || null : get().activeProfile;
      if (newActive) storage.set(getUserActiveProfileKey(parentUserId), newActive.id);
      else storage.remove(getUserActiveProfileKey(parentUserId));

      set({ profiles: updatedProfiles, activeProfile: newActive });

      try {
        await supabase.from('profiles').delete().eq('id', profileId);
      } catch (err) {
        console.warn('Could not delete from cloud immediately (will delete on next full sync):', err);
      }
    }
  },

  selectProfile: (profileId) => {
    const profile = get().profiles.find(p => p.id === profileId) || null;
    if (profile) {
      const activeUser = supabase.auth.getUser(); // Sync key check
      activeUser.then(({ data: { user } }) => {
        if (user) {
          storage.set(getUserActiveProfileKey(user.id), profileId);
        } else {
          storage.set(getGuestActiveProfileKey(), profileId);
        }
      });
      set({ activeProfile: profile });
    }
  },

  updateProgress: async (profileId, gameId, level, starsEarned, history, parentUserId) => {
    const currentProgressMap = { ...get().progress };
    if (!currentProgressMap[profileId]) {
      currentProgressMap[profileId] = {};
    }

    const previousProgress = currentProgressMap[profileId][gameId];
    const newStars = Math.max(previousProgress?.stars || 0, starsEarned);
    const addedStars = Math.max(0, newStars - (previousProgress?.stars || 0));

    const newProgress: GameProgress = {
      game_id: gameId,
      level: Math.max(previousProgress?.level || 1, level),
      stars: newStars,
      history: { ...(previousProgress?.history || {}), ...history },
      updated_at: new Date().toISOString()
    };

    currentProgressMap[profileId][gameId] = newProgress;

    // Update profile stars too
    const updatedProfiles = get().profiles.map(p => {
      if (p.id === profileId) {
        return { ...p, total_stars: p.total_stars + addedStars };
      }
      return p;
    });

    const activeProfile = get().activeProfile?.id === profileId 
      ? updatedProfiles.find(p => p.id === profileId) || null 
      : get().activeProfile;

    if (!parentUserId) {
      // Guest Mode: save locally
      storage.setJSON(getGuestProgressKey(), currentProgressMap);
      storage.setJSON(getGuestProfilesKey(), updatedProfiles);
      set({ progress: currentProgressMap, profiles: updatedProfiles, activeProfile });
    } else {
      // User Mode: save locally & queue
      const localProfilesKey = getUserProfilesKey(parentUserId);
      const localProgressKey = getUserProgressKey(parentUserId);
      const queueKey = getSyncQueueKey(parentUserId);

      storage.setJSON(localProfilesKey, updatedProfiles);
      storage.setJSON(localProgressKey, currentProgressMap);
      set({ progress: currentProgressMap, profiles: updatedProfiles, activeProfile });

      // Add progress update to queue
      const queue = storage.getJSON<SyncQueueItem[]>(queueKey) || [];
      queue.push({
        id: crypto.randomUUID(),
        type: 'update_progress',
        profileId,
        payload: { game_id: gameId, level, stars: newStars, history },
        timestamp: Date.now()
      });
      storage.setJSON(queueKey, queue);

      // Attempt background sync
      get().syncPendingData(parentUserId).catch(console.error);
    }
  },

  syncPendingData: async (parentUserId) => {
    const queueKey = getSyncQueueKey(parentUserId);
    const queue = storage.getJSON<SyncQueueItem[]>(queueKey) || [];
    if (queue.length === 0) return;

    set({ syncing: true });
    const failedItems: SyncQueueItem[] = [];

    // Temporary map to translate local temporary profile IDs to DB created profile IDs
    const idMap: Record<string, string> = {};

    for (const item of queue) {
      try {
        const targetProfileId = idMap[item.profileId] || item.profileId;

        if (item.type === 'create_profile') {
          // 1. Check if profile already exists in DB (maybe from previous run)
          const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('nickname', item.payload.nickname)
            .limit(1);

          if (existing && existing.length > 0) {
            idMap[item.profileId] = existing[0].id;
            continue;
          }

          // Insert into Supabase
          const { data, error } = await supabase
            .from('profiles')
            .insert({
              parent_id: parentUserId,
              nickname: item.payload.nickname,
              age_group: item.payload.age_group,
              avatar_id: item.payload.avatar_id
            })
            .select('id')
            .single();

          if (error) throw error;
          if (data) {
            idMap[item.profileId] = data.id;
          }
        } else if (item.type === 'update_progress') {
          // Update progress
          const { error } = await supabase
            .from('progress')
            .upsert({
              profile_id: targetProfileId,
              game_id: item.payload.game_id,
              level: item.payload.level,
              stars: item.payload.stars,
              history: item.payload.history,
              updated_at: new Date().toISOString()
            }, { onConflict: 'profile_id,game_id' });

          if (error) throw error;

          // Also increment stars in DB profiles
          const { data: currentProfile } = await supabase
            .from('profiles')
            .select('total_stars')
            .eq('id', targetProfileId)
            .single();

          if (currentProfile) {
            await supabase
              .from('profiles')
              .update({ total_stars: item.payload.stars }) // Simplify: sync stars directly
              .eq('id', targetProfileId);
          }
        }
      } catch (err) {
        console.error('Error syncing item:', item, err);
        failedItems.push(item);
      }
    }

    // Save remaining failed items back to queue
    storage.setJSON(queueKey, failedItems);
    set({ syncing: false });
  }
}));
