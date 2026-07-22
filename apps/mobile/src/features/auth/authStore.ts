import { create } from 'zustand';
import type { AuthErrorCode, AuthSession } from '@challenge42/types';
import { getAuthService } from '@/services/auth';
import { getAnalytics } from '@/services/analytics/AnalyticsService';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { useProfileStore } from '@/features/profile/profileStore';
import { useWeightStore } from '@/features/tracking/weightStore';
import { useFoodLogStore } from '@/features/tracking/foodLogStore';
import { useStepsStore } from '@/features/tracking/stepsStore';
import { useActivityStore } from '@/features/activity/activityStore';

export type AuthStatus = 'restoring' | 'signedOut' | 'signedIn';

interface AuthState {
  status: AuthStatus;
  session: AuthSession | null;
  error: AuthErrorCode | null;
  busy: boolean;
  restore: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  requestReset: (email: string) => Promise<boolean>;
  clearError: () => void;
}

const auth = getAuthService();
const analytics = getAnalytics();

export const useAuthStore = create<AuthState>((set) => ({
  status: 'restoring',
  session: null,
  error: null,
  busy: false,

  restore: async () => {
    try {
      const session = await auth.getSession();
      set({ session, status: session ? 'signedIn' : 'signedOut' });
    } catch {
      set({ session: null, status: 'signedOut' });
    }
  },

  signIn: async (email, password) => {
    set({ busy: true, error: null });
    const res = await auth.signIn(email, password);
    if (res.ok && res.session) {
      set({ session: res.session, status: 'signedIn', busy: false });
      return true;
    }
    set({ error: res.errorCode ?? 'unknown', busy: false });
    return false;
  },

  signUp: async (email, password) => {
    set({ busy: true, error: null });
    const res = await auth.signUp(email, password);
    if (res.ok && res.session) {
      // A brand-new account starts clean — never inherit leftover local data from a prior user.
      useOnboardingStore.getState().reset();
      useProfileStore.getState().reset();
      useWeightStore.getState().reset();
      useFoodLogStore.getState().reset();
      useStepsStore.getState().reset();
      useActivityStore.getState().reset();
      analytics.track('ACCOUNT_CREATED', { method: 'email' });
      set({ session: res.session, status: 'signedIn', busy: false });
      return true;
    }
    set({ error: res.errorCode ?? 'unknown', busy: false });
    return false;
  },

  signOut: async () => {
    await auth.signOut();
    // Clear per-user state so a different account on this device starts clean (dev single-user model).
    useOnboardingStore.getState().reset();
    useProfileStore.getState().reset();
    useWeightStore.getState().reset();
    useFoodLogStore.getState().reset();
    useActivityStore.getState().reset();
    set({ session: null, status: 'signedOut', error: null });
  },

  requestReset: async (email) => {
    set({ busy: true, error: null });
    const res = await auth.requestPasswordReset(email);
    set({ busy: false, error: res.ok ? null : (res.errorCode ?? 'unknown') });
    return res.ok;
  },

  clearError: () => set({ error: null }),
}));
