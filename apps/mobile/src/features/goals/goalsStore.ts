/**
 * Personal daily goals the challenger can customize: steps, activity minutes, and calories. Calories
 * default to the safety-checked Target-Engine recommendation (calorieGoal = null) unless the user
 * sets their own. Persisted locally and synced across devices via cloudSync.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Goals {
  stepsGoal: number;
  activityMinutesGoal: number;
  /** Custom daily calorie goal, or null to use the recommended target. */
  calorieGoal: number | null;
}

export const DEFAULT_GOALS: Goals = {
  stepsGoal: 8000,
  activityMinutesGoal: 30,
  calorieGoal: null,
};

interface GoalsState extends Goals {
  hydrated: boolean;
  setGoals: (patch: Partial<Goals>) => void;
  reset: () => void;
  _setHydrated: () => void;
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set) => ({
      ...DEFAULT_GOALS,
      hydrated: false,
      setGoals: (patch) => set((s) => ({ ...s, ...patch })),
      reset: () => set({ ...DEFAULT_GOALS }),
      _setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'c42.goals',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        stepsGoal: s.stepsGoal,
        activityMinutesGoal: s.activityMinutesGoal,
        calorieGoal: s.calorieGoal,
      }),
      onRehydrateStorage: () => (state) => state?._setHydrated(),
    },
  ),
);
