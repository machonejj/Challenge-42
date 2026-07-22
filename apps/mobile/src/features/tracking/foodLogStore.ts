import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MealSlot } from '@challenge42/types';
import { newId } from '@/lib/id';

export interface FoodEntry {
  id: string;
  slot: MealSlot;
  label: string;
  calories: number;
  proteinG: number;
  atMs: number;
}

interface FoodLogState {
  entries: FoodEntry[];
  hydrated: boolean;
  addEntry: (input: Omit<FoodEntry, 'id' | 'atMs'>) => void;
  removeEntry: (id: string) => void;
  reset: () => void;
  _setHydrated: () => void;
}

export const useFoodLogStore = create<FoodLogState>()(
  persist(
    (set, get) => ({
      entries: [],
      hydrated: false,
      addEntry: (input) =>
        set({ entries: [...get().entries, { id: newId(), atMs: Date.now(), ...input }] }),
      removeEntry: (id) => set({ entries: get().entries.filter((e) => e.id !== id) }),
      reset: () => set({ entries: [] }),
      _setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'c42.foodlog',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ entries: s.entries }),
      onRehydrateStorage: () => (state) => state?._setHydrated(),
    },
  ),
);

export interface DayFoodTotals {
  calories: number;
  proteinG: number;
  bySlot: Record<MealSlot, { calories: number; items: FoodEntry[] }>;
}

function startOfDayMs(nowMs: number): number {
  const d = new Date(nowMs);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Totals + per-slot breakdown for today. */
export function todayFoodTotals(entries: readonly FoodEntry[], nowMs: number): DayFoodTotals {
  const start = startOfDayMs(nowMs);
  const bySlot: DayFoodTotals['bySlot'] = {
    breakfast: { calories: 0, items: [] },
    lunch: { calories: 0, items: [] },
    dinner: { calories: 0, items: [] },
    snack: { calories: 0, items: [] },
  };
  let calories = 0;
  let proteinG = 0;
  for (const e of entries) {
    if (e.atMs < start) continue;
    calories += e.calories;
    proteinG += e.proteinG;
    bySlot[e.slot].calories += e.calories;
    bySlot[e.slot].items.push(e);
  }
  return { calories, proteinG: Math.round(proteinG), bySlot };
}
