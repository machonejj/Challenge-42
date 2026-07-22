import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { newId } from '@/lib/id';

export interface StepEntry {
  id: string;
  steps: number;
  atMs: number;
}

interface StepsState {
  entries: StepEntry[];
  hydrated: boolean;
  addSteps: (steps: number) => void;
  reset: () => void;
  _setHydrated: () => void;
}

export const useStepsStore = create<StepsState>()(
  persist(
    (set, get) => ({
      entries: [],
      hydrated: false,
      addSteps: (steps) =>
        set({ entries: [...get().entries, { id: newId(), steps, atMs: Date.now() }] }),
      reset: () => set({ entries: [] }),
      _setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'c42.steps',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ entries: s.entries }),
      onRehydrateStorage: () => (state) => state?._setHydrated(),
    },
  ),
);

function startOfDayMs(nowMs: number): number {
  const d = new Date(nowMs);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function todaySteps(entries: readonly StepEntry[], nowMs: number): number {
  const start = startOfDayMs(nowMs);
  return entries.filter((e) => e.atMs >= start).reduce((sum, e) => sum + e.steps, 0);
}

export function totalSteps(entries: readonly StepEntry[]): number {
  return entries.reduce((sum, e) => sum + e.steps, 0);
}
