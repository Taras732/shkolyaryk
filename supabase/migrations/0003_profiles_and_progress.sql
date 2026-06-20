-- Migration: 0003_profiles_and_progress.sql
-- Creates the profiles (child accounts) and progress tables with RLS and cascade deletes.

-- 1. Profiles Table (Child Accounts)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nickname TEXT NOT NULL,
  age_group TEXT NOT NULL CHECK (age_group IN ('under_4', '5-6', '6-7', '7-8')),
  avatar_id TEXT NOT NULL,
  total_stars INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can manage their own children's profiles" ON public.profiles;
CREATE POLICY "Users can manage their own children's profiles"
  ON public.profiles FOR ALL
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

-- Index for parent lookup
CREATE INDEX IF NOT EXISTS idx_profiles_parent_id ON public.profiles(parent_id);


-- 2. Progress Table (Child Game Progress)
CREATE TABLE IF NOT EXISTS public.progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id TEXT NOT NULL,
  level INTEGER DEFAULT 1 NOT NULL,
  stars INTEGER DEFAULT 0 NOT NULL,
  history JSONB DEFAULT '{}'::jsonb NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(profile_id, game_id)
);

-- Enable RLS
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

-- Progress Policies
DROP POLICY IF EXISTS "Users can manage their children's progress" ON public.progress;
CREATE POLICY "Users can manage their children's progress"
  ON public.progress FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = progress.profile_id 
      AND profiles.parent_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = progress.profile_id 
      AND profiles.parent_id = auth.uid()
    )
  );

-- Index for profile lookup
CREATE INDEX IF NOT EXISTS idx_progress_profile_id ON public.progress(profile_id);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_set_progress_updated_at
  BEFORE UPDATE ON public.progress
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();
