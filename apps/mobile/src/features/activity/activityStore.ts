import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ActivityTypeKey } from '@challenge42/types';
import { newId } from '@/lib/id';
import { celebratePoints } from '@/features/points/pointsFx';
import { activityPoints } from '@/features/points/pointsConfig';

export interface ActivitySessionLite {
  id: string;
  type: ActivityTypeKey;
  title: string | null;
  durationMin: number;
  completedAtMs: number;
  source: 'live' | 'logged'; // done in-app with the timer vs. logged after the fact
}

interface ActivityState {
  sessions: ActivitySessionLite[];
  hydrated: boolean;
  addSession: (input: Omit<ActivitySessionLite, 'id'>) => void;
  reset: () => void;
  _setHydrated: () => void;
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      sessions: [],
      hydrated: false,
      addSession: (input) => {
        set({ sessions: [...get().sessions, { id: newId(), ...input }] });
        celebratePoints(activityPoints(input.durationMin), input.title ?? 'Activity');
      },
      reset: () => set({ sessions: [] }),
      _setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'c42.activity',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ sessions: s.sessions }),
      onRehydrateStorage: () => (state) => state?._setHydrated(),
    },
  ),
);

/** How many sessions were completed today (drives the future "workouts today" pulse). */
export function countToday(sessions: readonly ActivitySessionLite[], nowMs: number): number {
  const d = new Date(nowMs);
  d.setHours(0, 0, 0, 0);
  const start = d.getTime();
  return sessions.filter((s) => s.completedAtMs >= start).length;
}
