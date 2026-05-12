import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { syncAll } from '../services/profileSync';

export function useProfileSync(): void {
  const userId = useAuthStore((s) => s.userId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const syncedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      syncedForRef.current = null;
      return;
    }

    // Avoid re-running sync for the same session after re-renders
    if (syncedForRef.current === userId) return;
    syncedForRef.current = userId;

    syncAll(userId).catch((err) => {
      console.warn('[profileSync] sync failed', err);
    });
  }, [isAuthenticated, userId]);
}
