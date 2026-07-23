/**
 * The shared challenge window (start date + length) set by the admin. Read on app open so the day
 * count, the Home start-date banner, and the calendar all use the same dates for everyone. Falls back
 * to the user's own enrollment date when the global setting isn't available.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase/client';

interface ChallengeState {
  startDate: string | null; // 'YYYY-MM-DD'
  lengthDays: number;
  hydrated: boolean;
  refresh: () => Promise<void>;
  _setHydrated: () => void;
}

export const useChallengeStore = create<ChallengeState>()(
  persist(
    (set) => ({
      startDate: null,
      lengthDays: 42,
      hydrated: false,
      refresh: async () => {
        if (!supabase) return;
        const { data, error } = await supabase
          .from('challenge_settings')
          .select('start_date, length_days')
          .eq('id', 1)
          .maybeSingle();
        if (error || !data) return;
        set({
          startDate: (data.start_date as string) ?? null,
          lengthDays: (data.length_days as number) ?? 42,
        });
      },
      _setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'c42.challenge',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ startDate: s.startDate, lengthDays: s.lengthDays }),
      onRehydrateStorage: () => (state) => state?._setHydrated(),
    },
  ),
);

const DAY = 24 * 60 * 60 * 1000;

export interface ChallengeWindow {
  startMs: number;
  endMs: number; // last day (inclusive) at midnight
  totalDays: number;
  dayNumber: number; // 1-based, clamped to [1, totalDays]
  startsInDays: number; // >0 before it begins, else 0
  hasStarted: boolean;
  hasEnded: boolean;
}

function midnight(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00`).getTime();
}

export function computeWindow(
  startDate: string,
  lengthDays: number,
  nowMs: number,
): ChallengeWindow {
  const startMs = midnight(startDate);
  const d = new Date(nowMs);
  const todayMs = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const endMs = startMs + (lengthDays - 1) * DAY;
  const rawDay = Math.floor((todayMs - startMs) / DAY) + 1;
  return {
    startMs,
    endMs,
    totalDays: lengthDays,
    dayNumber: Math.min(Math.max(rawDay, 1), lengthDays),
    startsInDays: todayMs < startMs ? Math.round((startMs - todayMs) / DAY) : 0,
    hasStarted: todayMs >= startMs,
    hasEnded: todayMs > endMs,
  };
}
