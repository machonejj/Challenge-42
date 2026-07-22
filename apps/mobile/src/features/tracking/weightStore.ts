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
        const entries = [...get().entries, entry];
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
      onRehydrateStorage: () => (state) => state?._setHydrated(),
    },
  ),
);
