import { emptyDict, type Dict } from './core';

/**
 * Словник дитини — локально на пристрої, окремо на кожен профіль (як статистика
 * таблиці множення). Сховище недоступне — гра працює без пам'яті, не падає.
 */
const keyFor = (profileId: string) => `shk.en.v1.${profileId}`;

export function loadDict(profileId: string): Dict {
  try {
    const raw = localStorage.getItem(keyFor(profileId));
    return raw ? { ...emptyDict(), ...(JSON.parse(raw) as Dict) } : emptyDict();
  } catch {
    return emptyDict();
  }
}

export function saveDict(profileId: string, dict: Dict): void {
  try {
    localStorage.setItem(keyFor(profileId), JSON.stringify(dict));
  } catch {
    // без пам'яті — не біда
  }
}
