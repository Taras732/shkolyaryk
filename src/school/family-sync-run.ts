import { useAuthStore } from '@/stores/useAuthStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { syncFamily } from './family-sync';

/**
 * Запустити синхронізацію з поточним станом застосунку і, якщо з сервера прийшло
 * нове (інший пристрій сім'ї), перечитати профілі й прогрес у стор.
 */
export async function runFamilySync(): Promise<void> {
  const user = useAuthStore.getState().user;
  const { profiles, loadProfiles } = useProfileStore.getState();
  const changed = await syncFamily(!user, profiles.map((p) => p.id));
  if (changed) await loadProfiles(user?.id);
}

let timer: number | undefined;

/** Після гри — з невеликою паузою, щоб кілька записів (прогрес, журнал, нагороди) пішли одним запитом. */
export function scheduleFamilySync(delayMs = 2000): void {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => void runFamilySync(), delayMs);
}
