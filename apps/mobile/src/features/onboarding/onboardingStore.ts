import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ONBOARDING_STEPS } from '@challenge42/config';
import type { OnboardingAnswers, OnboardingAnswerKey, OnboardingStatus } from '@challenge42/types';
import { nextStepId, prevStepId, resumeStepId } from '@challenge42/domain';

interface OnboardingState {
  answers: OnboardingAnswers;
  currentStepId: string | null;
  status: OnboardingStatus;
  hydrated: boolean;

  setAnswer: <K extends OnboardingAnswerKey>(key: K, value: OnboardingAnswers[K]) => void;
  /** Begin (or resume) onboarding. Returns the step to show. */
  begin: () => string | null;
  /** Advance; returns 'complete' when there is no next visible step. */
  goNext: () => 'advanced' | 'complete';
  goBack: () => void;
  markCompleted: () => void;
  reset: () => void;
  _setHydrated: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      answers: {},
      currentStepId: null,
      status: 'NOT_STARTED',
      hydrated: false,

      setAnswer: (key, value) => set((s) => ({ answers: { ...s.answers, [key]: value } })),

      begin: () => {
        const { answers, currentStepId } = get();
        const resume = resumeStepId(ONBOARDING_STEPS, answers, currentStepId);
        set({ status: 'IN_PROGRESS', currentStepId: resume });
        return resume;
      },

      goNext: () => {
        const { answers, currentStepId } = get();
        if (!currentStepId) return 'complete';
        const next = nextStepId(ONBOARDING_STEPS, answers, currentStepId);
        if (next) {
          set({ currentStepId: next });
          return 'advanced';
        }
        return 'complete';
      },

      goBack: () => {
        const { answers, currentStepId } = get();
        if (!currentStepId) return;
        const prev = prevStepId(ONBOARDING_STEPS, answers, currentStepId);
        if (prev) set({ currentStepId: prev });
      },

      markCompleted: () => set({ status: 'COMPLETED', currentStepId: null }),

      reset: () => set({ answers: {}, currentStepId: null, status: 'NOT_STARTED' }),

      _setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'c42.onboarding',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist the draft; `hydrated` is runtime-only.
      partialize: (s) => ({ answers: s.answers, currentStepId: s.currentStepId, status: s.status }),
      onRehydrateStorage: () => (state) => state?._setHydrated(),
    },
  ),
);
