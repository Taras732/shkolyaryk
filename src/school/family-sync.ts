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
      if (local[name] !== b.data) {
        writeBlock(pid, name, b.data);
        changed = true;
      }
      (meta[pid] ??= {})[name] = fp;
    }
  }
  set(META, JSON.stringify(meta));
  return changed;
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
      if (!res.ok) return false;
      return applyDoc(await res.json(), isGuest);
    } catch {
      return false;
    }
  })().finally(() => {
    running = null;
  });
  return running;
}
