import { HOMEWORK_API, loadFamilyCode } from './homework';

/**
 * Синхронізація прогресу дітей між пристроями сім'ї (через воркер і сімейний код).
 *
 * Ігри пишуть свій прогрес у localStorage як і раніше — синхронізація їх не чіпає.
 * Вона сама помічає, які блоки змінились з минулого разу (порівнює відбиток значення),
 * надсилає лише їх з поточним часом, а назад записує блоки, свіжіші на сервері.
 */

/** Блоки стану дитини: ключ у localStorage = префікс + id профілю. */
export const BLOCKS: Record<string, string> = {
  tables: 'shk.tt.v2.',
  words: 'shk.en.v1.',
  letters: 'shk.ukl.v1.',
  enReading: 'shk.enr.v1.',
  ukReading: 'shk.ukr.v1.',
  plan: 'shk.plan.v1.',
  rewards: 'shk.rewards.v1.',
  log: 'shk.log.v1.',
  activity: 'shk_activity_',
  check: 'shk.check.v1.',
  // 11.10: навчальне ядро без Supabase (db.ts) — результат тесту на рівень і план дня
  place: 'shk.place.v1.',
  day: 'shk.day.v1.',
  // 11.10: дошкілля й англійська — щоб друг, город і прогрес були однакові на всіх пристроях
  enTopics: 'shk.ent.v1.',
  enBuild: 'shk.enb.v1.',
  ukSyllables: 'shk.uks.v1.',
  syllableBuild: 'shk.sb.v1.',
  autoplan: 'shk.autoplan.v1.',
  pet: 'shk.pet.v1.',
  petChoice: 'shk.pet.choice.v1.',
  garden: 'shk.garden.v1.',
  wardrobe: 'shk.wardrobe.v1.',
  outfit: 'shk.outfit.v1.',
  album: 'shk.album.v1.',
  pysanky: 'shk.pysanky.v1.',
  hut: 'shk.hut.v1.',
  placementDone: 'shk_placement_done_',
};

const GUEST_PROFILES = 'shk_guest_profiles';
const GUEST_PROGRESS = 'shk_guest_progress';
const META = 'shk.sync.meta.v1';

interface Block {
  data: string;
  at: number;
}
type States = Record<string, Record<string, Block>>;
interface Profile {
  id: string;
  [k: string]: unknown;
}

const get = (k: string): string | null => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const set = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    // переповнене сховище — блок не оновиться, наступна синхронізація спробує знову
  }
};

/** Короткий відбиток рядка (djb2) — щоб помітити зміну, не зберігаючи копію даних. */
export function fingerprint(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `${s.length}:${h >>> 0}`;
}

type Meta = Record<string, Record<string, string>>;
const readMeta = (): Meta => {
  try {
    return JSON.parse(get(META) ?? '{}');
  } catch {
    return {};
  }
};

function guestProfiles(): Profile[] {
  try {
    return JSON.parse(get(GUEST_PROFILES) ?? '[]');
  } catch {
    return [];
  }
}

function guestProgress(): Record<string, unknown> {
  try {
    return JSON.parse(get(GUEST_PROGRESS) ?? '{}');
  } catch {
    return {};
  }
}

/** Поточні значення блоків дитини (рядки як є в localStorage). */
function readBlocks(pid: string, isGuest: boolean): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, prefix] of Object.entries(BLOCKS)) {
    const v = get(prefix + pid);
    if (v !== null) out[name] = v;
  }
  // рівні ігор і остання спроба (від цього залежить «Після школи»): у гостя — у спільному об'єкті
  if (isGuest) {
    const p = guestProgress()[pid];
    if (p) out.progress = JSON.stringify(p);
  }
  return out;
}

function writeBlock(pid: string, name: string, data: string) {
  if (name === 'progress') {
    const all = guestProgress();
    try {
      all[pid] = JSON.parse(data);
      set(GUEST_PROGRESS, JSON.stringify(all));
    } catch {
      // битий блок не пишемо
    }
    return;
  }
  const prefix = BLOCKS[name];
  if (prefix) set(prefix + pid, data);
}

/**
 * Підготувати відправку: змінені з минулої синхронізації блоки — з часом «зараз».
 * Пусті ключі не шлемо: новий пристрій з порожнім прогресом не затре сервер.
 */
export function collectChanges(profileIds: string[], isGuest: boolean, now: number): States {
  const meta = readMeta();
  const states: States = {};
  for (const pid of profileIds) {
    for (const [name, data] of Object.entries(readBlocks(pid, isGuest))) {
      if (meta[pid]?.[name] === fingerprint(data)) continue;
      (states[pid] ??= {})[name] = { data, at: now };
    }
  }
  return states;
}

/** Застосувати документ сім'ї: свіжіші на сервері блоки записати локально. Повертає, чи щось змінилось. */
export function applyDoc(doc: { profiles: Profile[]; states: States }, isGuest: boolean): boolean {
  const meta = readMeta();
  let changed = false;
  if (isGuest && doc.profiles.length > 0) {
    const local = guestProfiles();
    const ids = new Set(local.map((p) => p.id));
    const merged = [...local, ...doc.profiles.filter((p) => !ids.has(p.id))];
    if (merged.length !== local.length) {
      set(GUEST_PROFILES, JSON.stringify(merged));
      changed = true;
    }
  }
  for (const [pid, blocks] of Object.entries(doc.states)) {
    const local = readBlocks(pid, isGuest);
    for (const [name, b] of Object.entries(blocks)) {
      const fp = fingerprint(b.data);
      // журнал ігор — джерело засвоєння: записи з двох пристроїв обʼєднуємо, а не затираємо.
      // Обʼєднане відрізняється від серверного → наступна синхронізація віддасть його назад.
      const data = name === 'log' && local.log ? mergeLogs(local.log, b.data) : b.data;
      if (local[name] !== data) {
        writeBlock(pid, name, data);
        changed = true;
      }
      (meta[pid] ??= {})[name] = fp;
    }
  }
  set(META, JSON.stringify(meta));
  return changed;
}

const LOG_MAX = 1000;

/** Обʼєднати два журнали ігор: без дублів (час + гра), за часом, не довше LOG_MAX. */
export function mergeLogs(a: string, b: string): string {
  try {
    const all = [...(JSON.parse(a) as { at: number; gameId: string }[]), ...(JSON.parse(b) as { at: number; gameId: string }[])];
    const seen = new Set<string>();
    const out = all
      .sort((x, y) => x.at - y.at)
      .filter((e) => {
        const k = `${e.at}|${e.gameId}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    return JSON.stringify(out.slice(-LOG_MAX));
  } catch {
    return b;
  }
}

const STATUS = 'shk.sync.status.v1';

/** Остання спроба синхронізації — щоб збій не був мовчазним (сторінка «Сімʼя»). */
export interface SyncStatus {
  at: number;
  ok: boolean;
  error?: string;
}

function saveStatus(st: SyncStatus) {
  set(STATUS, JSON.stringify(st));
}

export function readSyncStatus(): SyncStatus | null {
  try {
    return JSON.parse(get(STATUS) ?? 'null') as SyncStatus | null;
  } catch {
    return null;
  }
}

let running: Promise<boolean> | null = null;

/**
 * Синхронізувати зараз. `profileIds` — діти, яких знає застосунок (у гостя додаються
 * ще й локальні гостьові профілі). true — локальні дані оновились із сервера (треба перечитати стор).
 */
export function syncFamily(isGuest: boolean, profileIds: string[] = []): Promise<boolean> {
  if (running) return running;
  running = (async () => {
    const code = loadFamilyCode();
    if (!HOMEWORK_API || !code) return false;
    const profiles = guestProfiles();
    const ids = new Set([...profileIds, ...(isGuest ? profiles.map((p) => p.id) : [])]);
    try {
      const body = { profiles: isGuest ? profiles : undefined, states: collectChanges([...ids], isGuest, Date.now()) };
      const res = await fetch(`${HOMEWORK_API.replace(/\/$/, '')}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Family-Code': code },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        saveStatus({ at: Date.now(), ok: false, error: res.status === 401 ? 'код не прийнято' : `сервер відповів ${res.status}` });
        return false;
      }
      const changed = applyDoc(await res.json(), isGuest);
      saveStatus({ at: Date.now(), ok: true });
      return changed;
    } catch {
      saveStatus({ at: Date.now(), ok: false, error: 'немає звʼязку' });
      return false;
    }
  })().finally(() => {
    running = null;
  });
  return running;
}
