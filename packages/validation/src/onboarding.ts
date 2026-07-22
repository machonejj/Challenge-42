/**
 * Onboarding finalization schema — validates the minimum needed to compute targets and build the
 * immutable snapshot. Per-step required/range checks are enforced by the onboarding engine; this is
 * the belt-and-suspenders guard before we finalize.
 */
import { z } from 'zod';

const scale = z.number().int().min(1).max(10);

const sexSchema = z.enum(['male', 'female', 'unspecified']);
const activityLevelSchema = z.enum(['sedentary', 'light', 'moderate', 'very_active']);
const primaryGoalSchema = z.enum([
  'lose_weight',
  'build_habits',
  'feel_in_control',
  'get_back_to_exercise',
  'improve_energy',
  'build_consistency',
]);

/** Plausibility bounds (typo guards), not medical limits. */
export const finalizeOnboardingSchema = z.object({
  age: z.number().int().min(16).max(100),
  sex: sexSchema,
  heightCm: z.number().min(80).max(260),
  currentWeightKg: z.number().min(25).max(400),
  goalWeightKg: z.number().min(25).max(400).optional(),
  activityLevel: activityLevelSchema,
  primaryGoal: primaryGoalSchema,

  // Safety booleans (default false if unanswered — engine treats missing as not-flagged).
  isPregnant: z.boolean().default(false),
  isRecentPostpartum: z.boolean().default(false),
  isBreastfeeding: z.boolean().default(false),
  hasHealthConditions: z.boolean().default(false),
  underMedicalCare: z.boolean().default(false),
  eatingDisorderHistory: z.boolean().default(false),

  // Pilot baseline (confidence + satisfaction are asked; the rest are optional / added later)
  confidenceCompletion: scale,
  habitSatisfaction: scale,
  foodControl: scale.optional(),
  exerciseConsistency: scale.optional(),
});
export type FinalizeOnboardingInput = z.infer<typeof finalizeOnboardingSchema>;

/** Long-term goal weight sanity (used at goal step). Long-term aim, not a 42-day target. */
export const goalWeightSchema = z.object({
  goalWeightKg: z.number().min(25).max(400),
  currentWeightKg: z.number().min(25).max(400),
});
