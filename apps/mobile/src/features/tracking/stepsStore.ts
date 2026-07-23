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
  /** Opt-in to auto-sync from the phone's step counter. Device-local (not synced across devices). */
  syncEnabled: boolean;
  hydrated: boolean;
  addSteps: (steps: number) => void;
  /** Upsert the device's authoritative step total for a given day (id `device-<YYYY-MM-DD>`). */
  syncDeviceSteps: (steps: number, atMs?: number) => void;
  setSyncEnabled: (v: boolean) => void;
  reset: () => void;
  _setHydrated: () => void;
}

function dateKey(ms: number): string {
  const d = new Date(ms);
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export const useStepsStore = create<StepsState>()(
  persist(
    (set, get) => ({
      entries: [],
      syncEnabled: false,
      hydrated: false,
      addSteps: (steps) =>
        set({ entries: [...get().entries, { id: newId(), steps, atMs: Date.now() }] }),
      syncDeviceSteps: (steps, atMs = Date.now()) => {
        const id = `device-${dateKey(atMs)}`;
        const entries = get().entries;
        const exists = entries.some((e) => e.id === id);
        set({
          entries: exists
            ? entries.map((e) => (e.id === id ? { ...e, steps, atMs } : e))
            : [...entries, { id, steps, atMs }],
        });
      },
      setSyncEnabled: (v) => set({ syncEnabled: v }),
      reset: () => set({ entries: [], syncEnabled: false }),
      _setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'c42.steps',
      storage: createJSONStorage(() => AsyncStorage),
      // syncEnabled is device-local; entries sync to the cloud via cloudSync.
      partialize: (s) => ({ entries: s.entries, syncEnabled: s.syncEnabled }),
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
