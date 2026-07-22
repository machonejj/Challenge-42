import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SafetyStatus, TargetRecommendation, WeightUnit } from '@challenge42/types';

export interface PrivacySettings {
  profileVisibility: 'challenge' | 'team' | 'private';
  mapVisibility: 'hidden' | 'city' | 'approximate';
  weightSharing: 'private' | 'total_change' | 'percent_change';
  photoSharing: 'private' | 'shared';
}

/** Privacy defaults lean private (map at city, weight/photos private). */
export const DEFAULT_PRIVACY: PrivacySettings = {
  profileVisibility: 'challenge',
  mapVisibility: 'city',
  weightSharing: 'private',
  photoSharing: 'private',
};

export interface EnrollmentPayload {
  firstName: string | null;
  displayName: string | null;
  city: string | null;
  state: string | null;
  weightUnit: WeightUnit;
  challengeId: string;
  challengeName: string;
  challengeStartDate: string; // ISO date (enrollment date)
  challengeLengthDays: number;
  startWeightKg: number;
  recommendation: TargetRecommendation;
  safetyStatus: SafetyStatus;
}

export interface EditablePreferences {
  displayName: string | null;
  city: string | null;
  state: string | null;
  weightUnit: WeightUnit;
}

interface ProfileState {
  hydrated: boolean;
  enrolled: boolean;
  firstName: string | null;
  displayName: string | null;
  city: string | null;
  state: string | null;
  weightUnit: WeightUnit;
  challengeId: string | null;
  challengeName: string | null;
  challengeStartDate: string | null;
  challengeLengthDays: number;
  startWeightKg: number | null;
  latestWeightKg: number | null;
  recommendation: TargetRecommendation | null;
  safetyStatus: SafetyStatus | null;
  privacy: PrivacySettings;

  setEnrollment: (p: EnrollmentPayload) => void;
  updatePreferences: (patch: Partial<EditablePreferences>) => void;
  updatePrivacy: (patch: Partial<PrivacySettings>) => void;
  reset: () => void;
  _setHydrated: () => void;
}

const initial = {
  enrolled: false,
  firstName: null,
  displayName: null,
  city: null,
  state: null,
  weightUnit: 'lb' as WeightUnit,
  challengeId: null,
  challengeName: null,
  challengeStartDate: null,
  challengeLengthDays: 42,
  startWeightKg: null,
  latestWeightKg: null,
  recommendation: null,
  safetyStatus: null,
  privacy: DEFAULT_PRIVACY,
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      hydrated: false,
      ...initial,

      setEnrollment: (p) =>
        set({
          enrolled: true,
          firstName: p.firstName,
          displayName: p.displayName ?? p.firstName,
          city: p.city,
          state: p.state,
          weightUnit: p.weightUnit,
          challengeId: p.challengeId,
          challengeName: p.challengeName,
          challengeStartDate: p.challengeStartDate,
          challengeLengthDays: p.challengeLengthDays,
          startWeightKg: p.startWeightKg,
          latestWeightKg: p.startWeightKg,
          recommendation: p.recommendation,
          safetyStatus: p.safetyStatus,
        }),

      // Editing current preferences NEVER touches the immutable start snapshot.
      updatePreferences: (patch) => set((s) => ({ ...s, ...patch })),
      updatePrivacy: (patch) => set((s) => ({ privacy: { ...s.privacy, ...patch } })),

      reset: () => set({ ...initial }),

      _setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'c42.profile',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ hydrated: _h, ...rest }) => rest,
      onRehydrateStorage: () => (state) => state?._setHydrated(),
    },
  ),
);
