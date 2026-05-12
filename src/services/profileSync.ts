import { supabase, isSupabaseConfigured } from '../utils/supabase';
import { useChildProfilesStore, type ChildProfile } from '../stores/childProfilesStore';
import { useProgressStore, type GameProgress, type DifficultyLevel } from '../stores/progressStore';

// ── DB row shapes ──────────────────────────────────────────────────────────────

interface DbChildProfile {
  id: string;
  user_id: string;
  name: string;
  age_group_id: string;
  avatar_id: string;
  created_at: number;
  updated_at: number;
}

interface DbProgress {
  user_id: string;
  profile_id: string;
  xp: number;
  badges: string[];
  game_progress: Record<string, GameProgress>;
  unlocked_levels: Record<string, DifficultyLevel>;
  updated_at: number;
}

// ── Converters ─────────────────────────────────────────────────────────────────

function profileToDb(userId: string, p: ChildProfile): DbChildProfile {
  return {
    id: p.id,
    user_id: userId,
    name: p.name,
    age_group_id: p.ageGroupId,
    avatar_id: p.avatarId,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

function dbToProfile(row: DbChildProfile): ChildProfile {
  return {
    id: row.id,
    // AgeGroupId is a branded string — cast is safe because we wrote the value
    ageGroupId: row.age_group_id as ChildProfile['ageGroupId'],
    name: row.name,
    avatarId: row.avatar_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Profiles sync ──────────────────────────────────────────────────────────────

async function syncProfiles(userId: string): Promise<void> {
  const { data: remoteRows, error } = await supabase
    .from('child_profiles')
    .select('id,user_id,name,age_group_id,avatar_id,created_at,updated_at')
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (error) throw error;

  const remote = (remoteRows ?? []) as DbChildProfile[];
  const localProfiles = useChildProfilesStore.getState().profiles;

  const remoteMap = new Map(remote.map((r) => [r.id, r]));
  const localMap = new Map(localProfiles.map((p) => [p.id, p]));

  const toUpsert: DbChildProfile[] = [];
  const remoteWins: ChildProfile[] = [];

  // Local records — push to remote if local is newer or remote doesn't have it
  for (const local of localProfiles) {
    const rem = remoteMap.get(local.id);
    if (!rem || local.updatedAt > rem.updated_at) {
      toUpsert.push(profileToDb(userId, local));
    }
  }

  // Remote records — apply to local if remote is newer or local doesn't have it
  for (const rem of remote) {
    const local = localMap.get(rem.id);
    if (!local || rem.updated_at > local.updatedAt) {
      remoteWins.push(dbToProfile(rem));
    }
  }

  if (toUpsert.length > 0) {
    const { error: upsertErr } = await supabase
      .from('child_profiles')
      .upsert(toUpsert, { onConflict: 'id' });
    if (upsertErr) throw upsertErr;
  }

  if (remoteWins.length > 0) {
    useChildProfilesStore.getState().mergeRemoteProfiles(remoteWins);
  }
}

// ── Progress sync ──────────────────────────────────────────────────────────────

async function syncProgress(userId: string): Promise<void> {
  const { data: remoteRows, error } = await supabase
    .from('progress')
    .select('user_id,profile_id,xp,badges,game_progress,unlocked_levels,updated_at')
    .eq('user_id', userId);

  if (error) throw error;

  const remote = (remoteRows ?? []) as DbProgress[];
  const progressState = useProgressStore.getState();

  // Collect all profile IDs known locally
  const localProfileIds = new Set([
    ...Object.keys(progressState.xpByProfile),
    ...Object.keys(progressState.badgesByProfile),
    ...Object.keys(progressState.gameProgressByProfile),
    ...Object.keys(progressState.updatedAtByProfile),
  ]);

  const remoteMap = new Map(remote.map((r) => [r.profile_id, r]));

  const toUpsert: DbProgress[] = [];

  // Local wins — push to remote
  for (const profileId of localProfileIds) {
    const localUpdatedAt = progressState.updatedAtByProfile[profileId] ?? 0;
    const rem = remoteMap.get(profileId);
    if (localUpdatedAt > 0 && (!rem || localUpdatedAt > rem.updated_at)) {
      toUpsert.push({
        user_id: userId,
        profile_id: profileId,
        xp: progressState.xpByProfile[profileId] ?? 0,
        badges: progressState.badgesByProfile[profileId] ?? [],
        game_progress: progressState.gameProgressByProfile[profileId] ?? {},
        unlocked_levels: progressState.unlockedLevelByProfile[profileId] ?? {},
        updated_at: localUpdatedAt,
      });
    }
  }

  // Remote wins — apply to local
  for (const rem of remote) {
    const localUpdatedAt = progressState.updatedAtByProfile[rem.profile_id] ?? 0;
    if (rem.updated_at > localUpdatedAt) {
      progressState.mergeRemoteProgress(rem.profile_id, {
        xp: rem.xp,
        badges: rem.badges,
        gameProgress: rem.game_progress,
        unlockedLevels: rem.unlocked_levels,
        updatedAt: rem.updated_at,
      });
    }
  }

  if (toUpsert.length > 0) {
    const { error: upsertErr } = await supabase
      .from('progress')
      .upsert(toUpsert, { onConflict: 'user_id,profile_id' });
    if (upsertErr) throw upsertErr;
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function syncAll(userId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await syncProfiles(userId);
  await syncProgress(userId);
}
