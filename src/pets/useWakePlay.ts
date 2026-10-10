import { useNavigate } from 'react-router-dom';
import { sayUk } from '@/games/shared/uk-audio';
import { useProfileStore } from '@/stores/useProfileStore';
import { resolvePlan } from '@/school/plan-resolve';

/**
 * «Друг спить — пограй, і він прокинеться»: прохання одразу веде в дію (Тарас, 10.10.2026).
 * Голос, і за мить — перша гра з «На сьогодні» (або головна, якщо плану немає).
 */
export function useWakePlay() {
  const navigate = useNavigate();
  const profile = useProfileStore((s) => s.activeProfile);
  return (voice: { key: string; text: string } = { key: 'pet.sleeping', text: 'Шшш, друг спить. Пограй, і він прокинеться!' }, delayMs = 2600) => {
    sayUk(voice.key, voice.text);
    const game = profile ? resolvePlan(profile)[0]?.gameId : undefined;
    window.setTimeout(() => navigate(game ? `/game/${game}` : '/hub'), delayMs);
  };
}
