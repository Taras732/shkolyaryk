import { localDay } from '@/school/game-log';

/**
 * «Город друга» (модель «результат живе», рішення Тараса 10.10.2026): три горщики, ріст — за днями догляду,
 * а не за тапами. Раз на день: полити (вода — 1 щодня + по одній за крок «На сьогодні») і дати сонця →
 * рослина підростає на сходинку. На сходинці 2 — урожай у комору друга (ласощі для кошика).
 * Нічого не в'яне й не гине: не прийшла — рослина просто чекає.
 */
export const SEEDS = [
  { id: 'sunflower', name: 'соняшник', unlockDays: 0, harvest: 'sym_sunflower', stages: ['pot_sunflower_1', 'pot_sunflower_2', 'pot_sunflower_3'] },
  { id: 'tomato', name: 'помідор', unlockDays: 2, harvest: 'food_tomato', stages: ['pot_sunflower_1', 'pot_tomato_2', 'pot_tomato_3'] },
  { id: 'apple', name: 'яблунька', unlockDays: 4, harvest: 'apple', stages: ['pot_sunflower_1', 'pot_apple_2', 'pot_apple_3'] },
] as const;
export type SeedId = (typeof SEEDS)[number]['id'];
export const POTS = 3;
export const RIPE = 2;

export interface Pot {
  seed: SeedId | null;
  /** Скільки днів доглянуто — це і є сходинка росту (0 — насінинка). */
  grown: number;
  /** День останнього повного догляду; того ж дня вдруге не росте. */
  caredDay?: string;
  watered?: string;
  sunned?: string;
}
export interface Garden {
  pots: Pot[];
  waterUsedDay?: string;
  waterUsed: number;
  /** Зібраний урожай чекає в коморі: картинки public/count. */
  pantry: string[];
}

export const emptyGarden = (): Garden => ({ pots: Array.from({ length: POTS }, () => ({ seed: null, grown: 0 })), waterUsed: 0, pantry: [] });

export const unlockedSeeds = (daysTogether: number) => SEEDS.filter((s) => daysTogether >= s.unlockDays);

/** Скільки разів сьогодні ще можна полити: 1 щодня + по одній за крок «На сьогодні». */
export function waterLeft(g: Garden, planDone: number, now = Date.now()): number {
  const used = g.waterUsedDay === localDay(now) ? g.waterUsed : 0;
  return Math.max(0, 1 + planDone - used);
}

export function plant(g: Garden, i: number, seed: SeedId): Garden {
  if (g.pots[i].seed) return g;
  const pots = g.pots.map((p, k) => (k === i ? { seed, grown: 0 } : p));
  return { ...g, pots };
}

/** Догляд (вода чи сонце). Коли сьогодні є і те, і те — рослина підростає (раз на день). */
export function care(g: Garden, i: number, kind: 'water' | 'sun', planDone: number, now = Date.now()): { garden: Garden; grew: boolean; ok: boolean } {
  const day = localDay(now);
  const p = g.pots[i];
  if (!p.seed || p.grown >= RIPE || p.caredDay === day) return { garden: g, grew: false, ok: false };
  if (kind === 'water' && (p.watered === day || waterLeft(g, planDone, now) === 0)) return { garden: g, grew: false, ok: false };
  if (kind === 'sun' && p.sunned === day) return { garden: g, grew: false, ok: false };
  const np: Pot = { ...p, [kind === 'water' ? 'watered' : 'sunned']: day };
  const grew = np.watered === day && np.sunned === day;
  if (grew) { np.grown = p.grown + 1; np.caredDay = day; }
  const used = g.waterUsedDay === day ? g.waterUsed : 0;
  return {
    garden: { ...g, pots: g.pots.map((x, k) => (k === i ? np : x)), ...(kind === 'water' ? { waterUsedDay: day, waterUsed: used + 1 } : {}) },
    grew,
    ok: true,
  };
}

export function harvest(g: Garden, i: number): Garden {
  const p = g.pots[i];
  if (!p.seed || p.grown < RIPE) return g;
  const s = SEEDS.find((x) => x.id === p.seed)!;
  return { ...g, pots: g.pots.map((x, k) => (k === i ? { seed: null, grown: 0 } : x)), pantry: [...g.pantry, s.harvest] };
}

const key = (profileId: string) => `shk.garden.v1.${profileId}`;
export function loadGarden(profileId: string): Garden {
  try {
    const v = JSON.parse(localStorage.getItem(key(profileId)) ?? 'null');
    if (v && Array.isArray(v.pots)) return { ...emptyGarden(), ...v };
  } catch {
    // нема пам'яті — порожній город
  }
  return emptyGarden();
}
export function saveGarden(profileId: string, g: Garden) {
  try {
    localStorage.setItem(key(profileId), JSON.stringify(g));
  } catch {
    // без пам'яті город живе до перезавантаження
  }
}
/** Взяти один плід з комори (годування в кошику друга). */
export function takeFromPantry(profileId: string): string | null {
  const g = loadGarden(profileId);
  const item = g.pantry[0] ?? null;
  if (item) saveGarden(profileId, { ...g, pantry: g.pantry.slice(1) });
  return item;
}
