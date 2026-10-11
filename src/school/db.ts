// Навчальне ядро на локальних даних (11.10.2026). Supabase недоступний (стара версія —
// db-supabase.ts), тож ті самі функції працюють без бази:
//  - довідник навичок і передумов — з коду (skills-math.ts, skills-language.ts);
//  - офлайн-завдання — з src/content/activities.ts;
//  - спроби — з журналу ігор (shk.log.v1), засвоєння рахується з них (mastery-local-core.ts);
//  - результат тесту на рівень — блок shk.place.v1, план дня — блок shk.day.v1.
// Усе це блоки localStorage, які сімейна синхронізація (family-sync.ts) возить між пристроями.

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
import { MATH_SKILLS } from './skills-math';
import { LANGUAGE_SKILLS } from './skills-language';
import { DEFAULT_MASTERY_THRESHOLD } from './mastery-core';
import { masteryFromAttempts, type AttemptLite } from './mastery-local-core';
import { readLog } from './game-log';
import { ACTIVITIES, toOfflineTaskSeed } from '@/content/activities';
import { getGame } from '@/games/registry';

const read = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
};
const write = (key: string, v: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    // без пам'яті — не біда
  }
};

// ---------- Довідники ----------

const SEED = [...MATH_SKILLS, ...LANGUAGE_SKILLS];

const SKILLS: Skill[] = SEED.map((s, i) => ({
  id: s.id,
  subject: s.subject,
  strand: s.strand,
  topic: s.topic ?? null,
  title: s.title,
  grade_band: s.grade_band,
  mastery_threshold: s.mastery_threshold ?? DEFAULT_MASTERY_THRESHOLD,
  review_interval_days: s.review_interval_days ?? 3,
  sort: s.sort ?? i,
  created_at: '',
})).sort((a, b) => a.sort - b.sort);

const PREREQS: SkillPrerequisite[] = SEED.flatMap((s) => s.prerequisites.map((p) => ({ skill_id: s.id, prerequisite_id: p })));

export async function fetchSkills(): Promise<Skill[]> {
  return SKILLS;
}

export async function fetchSkillPrerequisites(): Promise<SkillPrerequisite[]> {
  return PREREQS;
}

export async function fetchOfflineTasks(): Promise<OfflineTask[]> {
  return ACTIVITIES.map((a) => ({ ...toOfflineTaskSeed(a), created_at: '' }));
}

// ---------- Спроби (з журналу ігор) ----------

/** Скільки раундів мала гра, коли журнал ще не писав `total` (записи до 11.10). */
const OLD_TOTAL = 5;

function attemptsOf(profileId: string): Attempt[] {
  const out: Attempt[] = [];
  for (const e of readLog(profileId)) {
    const total = e.total ?? OLD_TOTAL;
    const correct = Math.max(0, total - e.mistakes);
    const skills = getGame(e.gameId)?.skillIds?.[e.difficulty as 1 | 2 | 3] ?? [];
    const base = { profile_id: profileId, game_id: e.gameId, difficulty: String(e.difficulty), correct, total, duration_sec: null, created_at: new Date(e.at).toISOString() };
    if (skills.length === 0) out.push({ ...base, id: `${e.at}:${e.gameId}`, skill_id: null });
    else skills.forEach((skill_id, i) => out.push({ ...base, id: `${e.at}:${e.gameId}:${i}`, skill_id }));
  }
  return out;
}

/** Спроби пише журнал ігор (GameShell → logGame); окремого запису більше немає. */
export async function insertAttempt(attempt: AttemptInsert): Promise<Attempt> {
  return { ...attempt, id: attempt.id ?? `${Date.now()}`, created_at: new Date().toISOString() } as Attempt;
}

export async function fetchAttempts(profileId: string, skillId?: string): Promise<Attempt[]> {
  return attemptsOf(profileId)
    .filter((a) => !skillId || a.skill_id === skillId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

// ---------- Засвоєння ----------

const placeKey = (pid: string) => `shk.place.v1.${pid}`;

export async function fetchMastery(profileId: string): Promise<SkillMastery[]> {
  const attempts: AttemptLite[] = attemptsOf(profileId)
    .filter((a) => a.skill_id)
    .map((a) => ({ skillId: a.skill_id!, correct: a.correct, total: a.total, at: Date.parse(a.created_at) }));
  return masteryFromAttempts(
    profileId,
    attempts,
    read<Record<string, number>>(placeKey(profileId), {}),
    SKILLS.map((s) => ({ id: s.id, mastery_threshold: s.mastery_threshold })),
    PREREQS,
  );
}

/**
 * Засвоєння тепер похідне від журналу, тож запис зберігає лише стартову точку — результат
 * тесту на рівень (placement пише floor-рядки). Решта викликів нічого не змінює.
 */
export async function upsertMasteryMany(rows: Array<Partial<SkillMastery> & { profile_id: string; skill_id: string }>): Promise<void> {
  const byProfile = new Map<string, Record<string, number>>();
  for (const r of rows) {
    if (r.mastery === undefined) continue;
    const floor = byProfile.get(r.profile_id) ?? read<Record<string, number>>(placeKey(r.profile_id), {});
    floor[r.skill_id] = r.mastery;
    byProfile.set(r.profile_id, floor);
  }
  for (const [pid, floor] of byProfile) write(placeKey(pid), floor);
}

export async function upsertMastery(row: Partial<SkillMastery> & { profile_id: string; skill_id: string }): Promise<SkillMastery> {
  await upsertMasteryMany([row]);
  return (await fetchMastery(row.profile_id)).find((m) => m.skill_id === row.skill_id) ?? ({ ...row } as SkillMastery);
}

// ---------- План дня ----------

interface StoredDay {
  plan: DailyPlan;
  items: DailyPlanItem[];
}
const dayKey = (pid: string) => `shk.day.v1.${pid}`;
/** Скільки днів планів тримати (старі обрізаємо, щоб блок синхронізації не ріс). */
const KEEP_DAYS = 14;

// id плану = `${profileId}|${date}`, id кроку = `${planId}|${i}` — з них знаходимо, куди писати
const splitPlanId = (planId: string) => {
  const [pid, date] = planId.split('|');
  return { pid, date };
};

export async function fetchDailyPlan(profileId: string, date: string): Promise<StoredDay | null> {
  return read<Record<string, StoredDay>>(dayKey(profileId), {})[date] ?? null;
}

export async function createDailyPlan(profileId: string, date: string, items: DailyPlanItemInsert[]): Promise<StoredDay> {
  const id = `${profileId}|${date}`;
  const day: StoredDay = {
    plan: { id, profile_id: profileId, date, status: 'active', created_at: new Date().toISOString() },
    items: items.map((it, i) => ({ ...it, id: `${id}|${i}`, plan_id: id })),
  };
  const all = read<Record<string, StoredDay>>(dayKey(profileId), {});
  all[date] = day;
  const keep = Object.keys(all).sort().slice(-KEEP_DAYS);
  write(dayKey(profileId), Object.fromEntries(keep.map((d) => [d, all[d]])));
  return day;
}

function patchDay(planId: string, fn: (d: StoredDay) => void) {
  const { pid, date } = splitPlanId(planId);
  const all = read<Record<string, StoredDay>>(dayKey(pid), {});
  if (!all[date]) return;
  fn(all[date]);
  write(dayKey(pid), all);
}

export async function updateDailyPlanStatus(planId: string, status: DailyPlan['status']): Promise<void> {
  patchDay(planId, (d) => {
    d.plan.status = status;
  });
}

export async function updatePlanItemStatus(itemId: string, status: DailyPlanItem['status'], result?: Record<string, unknown>): Promise<void> {
  const planId = itemId.split('|').slice(0, 2).join('|');
  patchDay(planId, (d) => {
    const it = d.items.find((x) => x.id === itemId);
    if (!it) return;
    it.status = status;
    if (result !== undefined) it.result = result;
  });
}
