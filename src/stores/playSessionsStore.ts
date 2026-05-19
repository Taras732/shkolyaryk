import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './middleware/mmkvPersist';

export interface PlaySession {
  id: string;
  profileId: string;
  gameId: string;
  startedAt: number;
  endedAt: number;
  durationMs: number;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function localDateStr(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface PlaySessionsState {
  sessions: PlaySession[];
  addSession: (s: Omit<PlaySession, 'id'>) => void;
  todayMinutes: (profileId: string) => number;
  weekMinutes: (profileId: string) => number;
  // [Mon=0 .. Sun=6] minutes for current ISO week
  weekDayMinutes: (profileId: string) => number[];
  streakDays: (profileId: string) => number;
}

export const usePlaySessionsStore = create<PlaySessionsState>()(
  persist(
    (set, get) => ({
      sessions: [],

      addSession: (s) =>
        set((state) => {
          const cutoff = Date.now() - THIRTY_DAYS_MS;
          const pruned = state.sessions.filter((x) => x.startedAt >= cutoff);
          const id = `ps_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          return { sessions: [...pruned, { ...s, id }] };
        }),

      todayMinutes: (profileId) => {
        const today = localDateStr(Date.now());
        return (
          get()
            .sessions.filter(
              (s) => s.profileId === profileId && localDateStr(s.startedAt) === today,
            )
            .reduce((sum, s) => sum + s.durationMs, 0) / 60_000
        );
      },

      weekMinutes: (profileId) =>
        get()
          .weekDayMinutes(profileId)
          .reduce((a, b) => a + b, 0),

      weekDayMinutes: (profileId) => {
        const now = new Date();
        const dow = now.getDay(); // 0=Sun
        const mondayOffset = dow === 0 ? -6 : 1 - dow;
        const monday = new Date(now);
        monday.setDate(now.getDate() + mondayOffset);
        monday.setHours(0, 0, 0, 0);
        const mondayMs = monday.getTime();

        const result: number[] = Array(7).fill(0);
        for (const s of get().sessions) {
          if (s.profileId !== profileId) continue;
          const d = new Date(s.startedAt);
          d.setHours(0, 0, 0, 0);
          const idx = Math.round((d.getTime() - mondayMs) / 86_400_000);
          if (idx >= 0 && idx < 7) {
            result[idx] += s.durationMs / 60_000;
          }
        }
        return result;
      },

      streakDays: (profileId) => {
        const sessions = get().sessions.filter((s) => s.profileId === profileId);
        if (sessions.length === 0) return 0;
        const daySet = new Set(sessions.map((s) => localDateStr(s.startedAt)));
        let streak = 0;
        const cursor = new Date();
        cursor.setHours(0, 0, 0, 0);
        while (daySet.has(localDateStr(cursor.getTime()))) {
          streak++;
          cursor.setDate(cursor.getDate() - 1);
        }
        return streak;
      },
    }),
    {
      name: 'play-sessions',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
