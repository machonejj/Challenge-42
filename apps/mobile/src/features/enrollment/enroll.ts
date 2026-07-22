/**
 * Enrollment: turn completed onboarding answers into an immutable challenge start snapshot + the
 * user's personalized profile. Uses the shared domain engine (deterministic targets + safety). In
 * dev this persists to AsyncStorage; a Supabase-backed enrollment repository slots in later.
 */
import {
  FOUNDING_CHALLENGE,
  ONBOARDING_VERSION,
  CHALLENGE_RULES_VERSION,
} from '@challenge42/config';
import {
  buildTargetInput,
  recommendTargets,
  buildChallengeStartSnapshot,
} from '@challenge42/domain';
import { finalizeOnboardingSchema } from '@challenge42/validation';
import type {
  ChallengeStartSnapshot,
  OnboardingAnswers,
  TargetRecommendation,
} from '@challenge42/types';
import { storage } from '@/lib/storage';
import { newId } from '@/lib/id';
import { useProfileStore } from '@/features/profile/profileStore';
import { getAnalytics } from '@/services/analytics/AnalyticsService';

export interface EnrollResult {
  ok: boolean;
  recommendation?: TargetRecommendation;
  error?: 'incomplete';
}

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function enrollFromOnboarding(
  userId: string,
  answers: OnboardingAnswers,
): Promise<EnrollResult> {
  // Belt-and-suspenders: ensure the fields needed for a target + snapshot are present/valid.
  const parsed = finalizeOnboardingSchema.safeParse({
    age: answers.age,
    sex: answers.sex,
    heightCm: answers.heightCm,
    currentWeightKg: answers.currentWeightKg,
    goalWeightKg: answers.goalWeightKg,
    activityLevel: answers.activityLevel,
    primaryGoal: answers.primaryGoal,
    isPregnant: answers.isPregnant ?? false,
    isRecentPostpartum: answers.isRecentPostpartum ?? false,
    isBreastfeeding: answers.isBreastfeeding ?? false,
    hasHealthConditions: answers.hasHealthConditions ?? false,
    underMedicalCare: answers.underMedicalCare ?? false,
    eatingDisorderHistory: answers.eatingDisorderHistory ?? false,
    confidenceCompletion: answers.confidenceCompletion,
    habitSatisfaction: answers.habitSatisfaction,
    foodControl: answers.foodControl,
    exerciseConsistency: answers.exerciseConsistency,
  });
  const input = buildTargetInput(answers);
  if (!parsed.success || !input) return { ok: false, error: 'incomplete' };

  const recommendation = recommendTargets(input);

  const memberId = newId();
  const snapshot = buildChallengeStartSnapshot({
    id: newId(),
    challengeId: FOUNDING_CHALLENGE.id,
    challengeMemberId: memberId,
    userId,
    answers,
    recommendation,
    createdAt: new Date().toISOString(),
    onboardingVersion: ONBOARDING_VERSION,
    challengeRulesVersion: CHALLENGE_RULES_VERSION,
  });

  // Persist the snapshot IMMUTABLY: write once, never overwrite an existing one.
  const snapKey = `c42.snapshot.${FOUNDING_CHALLENGE.id}.${userId}`;
  const existing = await storage.getJSON<ChallengeStartSnapshot>(snapKey);
  const finalSnapshot = existing ?? snapshot;
  if (!existing) {
    await storage.setJSON(snapKey, snapshot);
    await storage.setJSON(`c42.membership.${FOUNDING_CHALLENGE.id}.${userId}`, {
      memberId: finalSnapshot.challenge_member_id,
      joinedAt: finalSnapshot.created_at,
    });
    // Pilot baseline lives alongside (extensible to weekly pulses later).
    await storage.setJSON(
      `c42.baseline.${FOUNDING_CHALLENGE.id}.${userId}`,
      finalSnapshot.baseline,
    );
  }

  useProfileStore.getState().setEnrollment({
    firstName: answers.firstName ?? null,
    displayName: answers.displayName ?? answers.firstName ?? null,
    city: answers.city ?? null,
    state: answers.state ?? null,
    weightUnit: answers.weightUnit ?? 'lb',
    challengeId: FOUNDING_CHALLENGE.id,
    challengeName: FOUNDING_CHALLENGE.name,
    challengeStartDate: todayISODate(),
    challengeLengthDays: FOUNDING_CHALLENGE.lengthDays,
    startWeightKg: finalSnapshot.start_weight_kg,
    recommendation,
    safetyStatus: recommendation.status,
  });

  const analytics = getAnalytics();
  analytics.track('CHALLENGE_JOINED', { challengeId: FOUNDING_CHALLENGE.id });
  analytics.track('ONBOARDING_COMPLETED', {
    version: ONBOARDING_VERSION,
    safeReviewRequired: recommendation.status === 'SAFE_REVIEW_REQUIRED',
  });

  return { ok: true, recommendation };
}
