import { localDay } from './game-log';

/**
 * Мотивація «Після школи»: за кожен день, коли всі кроки зроблені, — наліпка в
 * колекцію і +1 до цілі, яку ставлять батьки («5 днів — кіно в суботу»).
 *
 * Свідомо за ДНІ, а не за зірки: зірки дитина «добуває» одною грою, а звичка —
 * це прийти завтра. Серія показується, але ціль рахує дні без вимоги «поспіль»:
 * один пропущений день не обнуляє тиждень роботи (інакше дитина кидає після першого пропуску).
 */

export const STICKERS = [
  '🦄', '🐉', '🦊', '🐼', '🦁', '🐯', '🐸', '🐙', '🦋', '🐝', '🐞', '🦖', '🐳', '🦩', '🦜', '🐢',
  '🌈', '⭐', '🌙', '☀️', '🌸', '🌻', '🍀', '🍄', '🍓', '🍉', '🍩', '🧁', '🍭', '🎈', '🎨', '🎸',
  '🚀', '🛸', '🚂', '⛵', '🏰', '🎠', '🧩', '🪁', '👑', '💎', '🔮', '🪄', '🏆', '🎁', '🧸', '🪅',
];

export interface Goal {
  text: string;
  days: number;
  /** Від цієї дати рахуємо дні до нагороди. */
  since: string;
}

export interface Rewards {
  /** Дні (YYYY-MM-DD), коли «Після школи» зроблено повністю. */
  days: string[];
  /** Наліпка за кожен такий день, у порядку отримання. */
  stickers: string[];
  goal: Goal | null;
  /** Скільки нагород уже видано батьками — для історії. */
  claimed: number;
}

export const emptyRewards = (): Rewards => ({ days: [], stickers: [], goal: null, claimed: 0 });

const keyFor = (profileId: string) => `shk.rewards.v1.${profileId}`;

export function loadRewards(profileId: string): Rewards {
  try {
    const raw = localStorage.getItem(keyFor(profileId));
    return raw ? { ...emptyRewards(), ...(JSON.parse(raw) as Rewards) } : emptyRewards();
  } catch {
    return emptyRewards();
  }
}

export function saveRewards(profileId: string, r: Rewards): void {
  try {
    localStorage.setItem(keyFor(profileId), JSON.stringify(r));
  } catch {
    // без пам'яті — наліпка не збережеться, гра не страждає
  }
}

/**
 * Зарахувати сьогоднішній день. Ідемпотентно: повторний виклик того ж дня нічого
 * не змінює. Наліпка — випадкова з тих, яких ще немає (поки колекція не повна).
 */
export function completeDay(r: Rewards, now: number, rng: () => number = Math.random): { rewards: Rewards; sticker: string | null } {
  const day = localDay(now);
  if (r.days.includes(day)) return { rewards: r, sticker: null };
  const missing = STICKERS.filter((s) => !r.stickers.includes(s));
  const pool = missing.length > 0 ? missing : STICKERS;
  const sticker = pool[Math.floor(rng() * pool.length)];
  return { rewards: { ...r, days: [...r.days, day], stickers: [...r.stickers, sticker] }, sticker };
}

/** Серія днів поспіль, що закінчується сьогодні або вчора (сьогодні ще може бути попереду). */
export function streak(r: Rewards, now: number): number {
  const set = new Set(r.days);
  const d = new Date(now);
  if (!set.has(localDay(d.getTime()))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (set.has(localDay(d.getTime()))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** Прогрес до нагороди: днів зроблено з дати постановки цілі. */
export function goalProgress(r: Rewards): { done: number; need: number; reached: boolean } | null {
  if (!r.goal) return null;
  const done = r.days.filter((d) => d >= r.goal!.since).length;
  return { done: Math.min(done, r.goal.days), need: r.goal.days, reached: done >= r.goal.days };
}

/** Батьки видали нагороду — ціль починається знову з завтрашнього обліку (той самий текст і кількість). */
export function claimGoal(r: Rewards, now: number): Rewards {
  if (!r.goal) return r;
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  return { ...r, claimed: r.claimed + 1, goal: { ...r.goal, since: localDay(next.getTime()) } };
}

export function setGoal(r: Rewards, text: string, days: number, now: number): Rewards {
  return { ...r, goal: text.trim() ? { text: text.trim(), days: Math.max(1, Math.min(30, days)), since: localDay(now) } : null };
}
