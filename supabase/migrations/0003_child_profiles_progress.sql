-- US-015: child_profiles + progress tables with RLS
-- Bidirectional sync MMKV ↔ Supabase; LWW conflict resolution on updated_at (ms).

-- ──────────────────────────────────────────────────────────────
-- child_profiles
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS child_profiles (
  id           TEXT    PRIMARY KEY,
  user_id      UUID    REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name         TEXT    NOT NULL,
  age_group_id TEXT    NOT NULL,
  avatar_id    TEXT    NOT NULL,
  created_at   BIGINT  NOT NULL,   -- Unix ms (mirrors local)
  updated_at   BIGINT  NOT NULL,   -- Unix ms — LWW key
  deleted_at   BIGINT              -- soft-delete tombstone
);

CREATE INDEX IF NOT EXISTS idx_child_profiles_user
  ON child_profiles (user_id);

CREATE INDEX IF NOT EXISTS idx_child_profiles_updated
  ON child_profiles (user_id, updated_at DESC);

ALTER TABLE child_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own child profiles" ON child_profiles;
CREATE POLICY "Users manage own child profiles" ON child_profiles
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────
-- progress
-- One row per (user_id, profile_id); full state stored as JSONB.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS progress (
  user_id         UUID    REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id      TEXT    NOT NULL,
  xp              INTEGER NOT NULL DEFAULT 0,
  badges          JSONB   NOT NULL DEFAULT '[]'::jsonb,
  game_progress   JSONB   NOT NULL DEFAULT '{}'::jsonb,
  unlocked_levels JSONB   NOT NULL DEFAULT '{}'::jsonb,
  updated_at      BIGINT  NOT NULL,   -- Unix ms — LWW key
  PRIMARY KEY (user_id, profile_id)
);

ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own progress" ON progress;
CREATE POLICY "Users manage own progress" ON progress
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
