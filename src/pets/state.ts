import { useSyncExternalStore } from 'react';

/**
 * Друг дитини (концепція v2, 10.10.2026): обирає ДИТИНА на своїй головній — кошик під ковдрочкою,
 * а не батьки при створенні профілю (аватарка «хто грає» — окрема річ). Після вибору малюк спить
 * у кошику й прокидається від першої зіграної гри. Локально, по профілю.
 */
export interface PetChoice {
  petId: string | null;
  awake: boolean;
}

const key = (profileId: string) => `shk.pet.choice.v1.${profileId}`;
const EVT = 'shk-pet-choice';

function read(profileId: string): PetChoice {
  try {
    const v = JSON.parse(localStorage.getItem(key(profileId)) ?? 'null');
    if (v && typeof v.petId === 'string') return { petId: v.petId, awake: !!v.awake };
  } catch {
    // нема пам'яті — друг ще не обраний
  }
  return { petId: null, awake: false };
}

function write(profileId: string, c: PetChoice) {
  try {
    localStorage.setItem(key(profileId), JSON.stringify(c));
  } catch {
    // без пам'яті вибір живе до перезавантаження
  }
  cache.delete(profileId);
  window.dispatchEvent(new Event(EVT));
}

export const choosePet = (profileId: string, petId: string) => write(profileId, { petId, awake: false });
/** Перша гра після вибору — малюк прокидається. Повертає true, якщо саме зараз прокинувся. */
export function wakePet(profileId: string): boolean {
  const c = read(profileId);
  if (!c.petId || c.awake) return false;
  write(profileId, { ...c, awake: true });
  return true;
}
export const getPetChoice = read;

// стабільний знімок для useSyncExternalStore
const cache = new Map<string, PetChoice>();
const snapshot = (profileId: string) => {
  const cur = read(profileId);
  const prev = cache.get(profileId);
  if (prev && prev.petId === cur.petId && prev.awake === cur.awake) return prev;
  cache.set(profileId, cur);
  return cur;
};
const NONE: PetChoice = { petId: null, awake: false };

export function usePetChoice(profileId: string | undefined): PetChoice {
  return useSyncExternalStore(
    (cb) => { window.addEventListener(EVT, cb); window.addEventListener('storage', cb); return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', cb); }; },
    () => (profileId ? snapshot(profileId) : NONE),
  );
}
