import { z } from 'zod';

/**
 * Синхронізація прогресу між пристроями сім'ї (рішення 07.10: варіант B — через
 * воркер і сімейний код, без входу в акаунт; перед продажем — Supabase).
 *
 * Один документ на сім'ю: профілі дітей + стан кожної дитини по блоках
 * (таблиця множення, словник, нагороди…). Конфлікт — перемагає свіжіший блок:
 * дитина грає з одного пристрою за раз, тож для сім'ї цього досить.
 */

export interface SyncEnv {
  REPORTS: KVNamespace;
}

const KEY = 'sync:v1';
/** Ліміт на блок — щоб випадковий великий запис не роздув документ сім'ї. */
const MAX_BLOCK = 300_000;

const Block = z.object({ data: z.string().max(MAX_BLOCK), at: z.number() });
const Profile = z.object({ id: z.string().max(64) }).passthrough();

export const SyncBody = z.object({
  profiles: z.array(Profile).max(20).optional(),
  states: z.record(z.string().max(64), z.record(z.string().max(40), Block)),
});

export interface SyncDoc {
  profiles: z.infer<typeof Profile>[];
  states: Record<string, Record<string, { data: string; at: number }>>;
}

export async function readDoc(env: SyncEnv): Promise<SyncDoc> {
  return ((await env.REPORTS.get(KEY, 'json')) as SyncDoc | null) ?? { profiles: [], states: {} };
}

export function mergeDoc(doc: SyncDoc, body: z.infer<typeof SyncBody>): SyncDoc {
  const profiles = [...doc.profiles];
  for (const p of body.profiles ?? []) {
    const i = profiles.findIndex((x) => x.id === p.id);
    if (i === -1) profiles.push(p);
    else profiles[i] = { ...profiles[i], ...p };
  }
  const states: SyncDoc['states'] = { ...doc.states };
  for (const [pid, blocks] of Object.entries(body.states)) {
    const cur = { ...(states[pid] ?? {}) };
    for (const [k, b] of Object.entries(blocks)) if (!cur[k] || b.at > cur[k].at) cur[k] = b;
    states[pid] = cur;
  }
  return { profiles: profiles.slice(0, 20), states };
}

export async function sync(env: SyncEnv, body: z.infer<typeof SyncBody>): Promise<SyncDoc> {
  const merged = mergeDoc(await readDoc(env), body);
  await env.REPORTS.put(KEY, JSON.stringify(merged));
  return merged;
}
