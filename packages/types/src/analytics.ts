/**
 * Product-analytics event contract. Provider-agnostic (dev logger now; a real provider later).
 *
 * PRIVACY: analytics is SEPARATE from the primary health database. Payloads carry only non-sensitive
 * product signals — never weight, calories, motivation text, or safety details. See docs/SECURITY.md.
 */
import type { OnboardingSection } from './onboarding';

export type AnalyticsEventName =
  | 'APP_OPENED'
  | 'ACCOUNT_CREATED'
  | 'ONBOARDING_STARTED'
  | 'ONBOARDING_STEP_COMPLETED'
  | 'ONBOARDING_COMPLETED'
  | 'CHALLENGE_JOINED'
  | 'PLAN_REVEALED'
  | 'HOME_VIEWED'
  | 'PROFILE_UPDATED'
  | 'PRIVACY_SETTING_CHANGED';

/** Type-safe payloads. Keys are intentionally coarse and non-sensitive. */
export interface AnalyticsEventPayloads {
  APP_OPENED: { authenticated: boolean };
  ACCOUNT_CREATED: { method: 'email' };
  ONBOARDING_STARTED: { version: string };
  ONBOARDING_STEP_COMPLETED: { stepId: string; section: OnboardingSection; index: number };
  ONBOARDING_COMPLETED: { version: string; safeReviewRequired: boolean };
  CHALLENGE_JOINED: { challengeId: string };
  PLAN_REVEALED: { safeReviewRequired: boolean };
  HOME_VIEWED: { dayNumber: number };
  PROFILE_UPDATED: { fields: readonly string[] };
  PRIVACY_SETTING_CHANGED: { setting: string; value: string };
}

export interface AnalyticsEvent<K extends AnalyticsEventName = AnalyticsEventName> {
  name: K;
  payload: AnalyticsEventPayloads[K];
  at: string; // ISO timestamp, stamped by the caller
}
