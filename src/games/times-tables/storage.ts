import type { FactStats } from './core';

/**
 * Статистика фактів таблиці множення — локально на пристрої, окремо на кожен профіль.
 * Свідомо не в Supabase: це дрібна поштучна статистика, і гра має працювати
 * для гостя й офлайн. Сховище може бути недоступне (приватне вікно) — тоді
 * гра працює без пам'яті, а не падає.
 */
const keyFor = (profileId: string) => `shk.tt.v2.${profileId}`;

export function loadStats(profileId: string): FactStats {
  try {
    const raw = localStorage.getItem(keyFor(profileId));
    return raw ? (JSON.parse(raw) as FactStats) : {};
  } catch {
    return {};
  }
}

export function saveStats(profileId: string, stats: FactStats): void {
  try {
    localStorage.setItem(keyFor(profileId), JSON.stringify(stats));
  } catch {
    // без пам'яті — не біда, гра йде далі
  }
}
