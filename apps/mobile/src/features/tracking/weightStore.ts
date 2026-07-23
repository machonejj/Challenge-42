import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { latestTrendKg } from '@challenge42/domain';
import { newId } from '@/lib/id';
import { useProfileStore } from '@/features/profile/profileStore';

export interface WeightEntryLite {
  id: string;
  weightKg: number;
  measuredAtMs: number;
  note?: string | null;
}

interface WeightState {
  entries: WeightEntryLite[];
  hydrated: boolean;
  addWeighIn: (weightKg: number, note?: string | null) => void;
  removeEntry: (id: string) => void;
  reset: () => void;
  _setHydrated: () => void;
}

/** Keep Home's "current weight" as the smoothed trend, never a raw daily spike. */
function syncTrendToProfile(entries: WeightEntryLite[]) {
  const trend = latestTrendKg(entries);
  if (trend != null) useProfileStore.getState().setLatestWeightKg(trend);
}

function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** At most one weigh-in per calendar day — the latest reading wins. Also cleans historical dupes. */
function onerPerDay(entries: WeightEntryLite[]): WeightEntryLite[] {
  const byDay = new Map<string, WeightEntryLite>();
  for (const e of [...entries].sort((a, b) => a.measuredAtMs - b.measuredAtMs)) {
    byDay.set(dayKey(e.measuredAtMs), e); // later reading overwrites earlier same-day one
  }
  return [...byDay.values()].sort((a, b) => a.measuredAtMs - b.measuredAtMs);
}

export const useWeightStore = create<WeightState>()(
  persist(
    (set, get) => ({
      entries: [],
      hydrated: false,

      addWeighIn: (weightKg, note) => {
        const entry: WeightEntryLite = {
          id: newId(),
          weightKg,
          measuredAtMs: Date.now(),
          note: note ?? null,
        };
        // One weigh-in per day: today's new reading replaces any earlier one from today.
        const entries = onerPerDay([...get().entries, entry]);
        set({ entries });
        syncTrendToProfile(entries);
      },

      removeEntry: (id) => {
        const entries = get().entries.filter((e) => e.id !== id);
        set({ entries });
        syncTrendToProfile(entries);
      },

      reset: () => set({ entries: [] }),
      _setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'c42.weight',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ entries: s.entries }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.entries = onerPerDay(state.entries); // clean any historical same-day duplicates
          state._setHydrated();
        }
      },
    },
  ),
);
