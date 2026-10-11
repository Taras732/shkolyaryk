// Тонкі typed-обгортки CRUD над навчальним ядром. Без бізнес-логіки (вона в A4).
// Клієнт supabase не має згенерованого Database-типу, тож результати явно кастуються
// до типів зі ./types (які тримаються рівно під схему 0004_school_core.sql).

import { supabase } from '@/utils/supabase';
import type {
  Skill,
  SkillPrerequisite,
  Attempt,
  AttemptInsert,
  SkillMastery,
  DailyPlan,
  DailyPlanItem,
  DailyPlanItemInsert,
  OfflineTask,
} from './types';

// ---------- Довідники (публічне читання) ----------

export async function fetchSkills(): Promise<Skill[]> {
  const { data, error } = await supabase.from('skills').select('*').order('sort', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Skill[];
}

export async function fetchSkillPrerequisites(): Promise<SkillPrerequisite[]> {
  const { data, error } = await supabase.from('skill_prerequisites').select('*');
  if (error) throw error;
  return (data ?? []) as SkillPrerequisite[];
}

export async function fetchOfflineTasks(): Promise<OfflineTask[]> {
  const { data, error } = await supabase.from('offline_tasks').select('*');
  if (error) throw error;
  return (data ?? []) as OfflineTask[];
}

// ---------- Attempts ----------

export async function insertAttempt(attempt: AttemptInsert): Promise<Attempt> {
  const { data, error } = await supabase.from('attempts').insert(attempt).select('*').single();
  if (error) throw error;
  return data as Attempt;
}

export async function fetchAttempts(profileId: string, skillId?: string): Promise<Attempt[]> {
  let query = supabase
    .from('attempts')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });
  if (skillId) query = query.eq('skill_id', skillId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Attempt[];
}

// ---------- Skill mastery ----------

export async function fetchMastery(profileId: string): Promise<SkillMastery[]> {
  const { data, error } = await supabase.from('skill_mastery').select('*').eq('profile_id', profileId);
  if (error) throw error;
  return (data ?? []) as SkillMastery[];
}

export async function upsertMastery(
  row: Partial<SkillMastery> & { profile_id: string; skill_id: string },
): Promise<SkillMastery> {
  const { data, error } = await supabase
    .from('skill_mastery')
    .upsert(row, { onConflict: 'profile_id,skill_id' })
    .select('*')
    .single();
  if (error) throw error;
  return data as SkillMastery;
}

export async function upsertMasteryMany(
  rows: Array<Partial<SkillMastery> & { profile_id: string; skill_id: string }>,
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase.from('skill_mastery').upsert(rows, { onConflict: 'profile_id,skill_id' });
  if (error) throw error;
}

// ---------- Daily plans ----------

export async function fetchDailyPlan(
  profileId: string,
  date: string,
): Promise<{ plan: DailyPlan; items: DailyPlanItem[] } | null> {
  const { data: plan, error } = await supabase
    .from('daily_plans')
    .select('*')
    .eq('profile_id', profileId)
    .eq('date', date)
    .maybeSingle();
  if (error) throw error;
  if (!plan) return null;

  const planRow = plan as DailyPlan;
  const { data: items, error: itemsError } = await supabase
    .from('daily_plan_items')
    .select('*')
    .eq('plan_id', planRow.id)
    .order('sort', { ascending: true });
  if (itemsError) throw itemsError;

  return { plan: planRow, items: (items ?? []) as DailyPlanItem[] };
}

export async function createDailyPlan(
  profileId: string,
  date: string,
  items: DailyPlanItemInsert[],
): Promise<{ plan: DailyPlan; items: DailyPlanItem[] }> {
  const { data: plan, error } = await supabase
    .from('daily_plans')
    .insert({ profile_id: profileId, date })
    .select('*')
    .single();
  if (error) throw error;

  const planRow = plan as DailyPlan;
  if (items.length === 0) return { plan: planRow, items: [] };

  const rows = items.map((item) => ({ ...item, plan_id: planRow.id }));
  const { data: inserted, error: itemsError } = await supabase
    .from('daily_plan_items')
    .insert(rows)
    .select('*');
  if (itemsError) throw itemsError;

  return { plan: planRow, items: (inserted ?? []) as DailyPlanItem[] };
}

export async function updateDailyPlanStatus(planId: string, status: DailyPlan['status']): Promise<void> {
  const { error } = await supabase.from('daily_plans').update({ status }).eq('id', planId);
  if (error) throw error;
}

export async function updatePlanItemStatus(
  itemId: string,
  status: DailyPlanItem['status'],
  result?: Record<string, unknown>,
): Promise<void> {
  const patch: Record<string, unknown> = { status };
  if (result !== undefined) patch.result = result;
  const { error } = await supabase.from('daily_plan_items').update(patch).eq('id', itemId);
  if (error) throw error;
}
