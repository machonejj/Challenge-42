import { describe, it, expect } from 'vitest';
import { finalizeOnboardingSchema, goalWeightSchema } from './onboarding';

const valid = {
  age: 34,
  sex: 'female' as const,
  heightCm: 165,
  currentWeightKg: 78,
  activityLevel: 'light' as const,
  primaryGoal: 'lose_weight' as const,
  confidenceCompletion: 8,
  habitSatisfaction: 4,
  foodControl: 5,
  exerciseConsistency: 3,
};

describe('finalizeOnboardingSchema', () => {
  it('accepts a complete answer set and defaults safety flags to false', () => {
    const parsed = finalizeOnboardingSchema.parse(valid);
    expect(parsed.isPregnant).toBe(false);
    expect(parsed.eatingDisorderHistory).toBe(false);
  });

  it('rejects missing required data', () => {
    const { age: _omit, ...missing } = valid;
    expect(finalizeOnboardingSchema.safeParse(missing).success).toBe(false);
  });

  it('rejects implausible weights (typo guard)', () => {
    expect(finalizeOnboardingSchema.safeParse({ ...valid, currentWeightKg: 999 }).success).toBe(
      false,
    );
    expect(finalizeOnboardingSchema.safeParse({ ...valid, currentWeightKg: 10 }).success).toBe(
      false,
    );
  });

  it('rejects an out-of-range confidence score', () => {
    expect(finalizeOnboardingSchema.safeParse({ ...valid, confidenceCompletion: 11 }).success).toBe(
      false,
    );
  });

  it('keeps goal weight optional but bounded', () => {
    expect(finalizeOnboardingSchema.safeParse({ ...valid, goalWeightKg: 70 }).success).toBe(true);
    expect(finalizeOnboardingSchema.safeParse({ ...valid, goalWeightKg: 5 }).success).toBe(false);
  });
});

describe('goalWeightSchema', () => {
  it('bounds a long-term goal weight', () => {
    expect(goalWeightSchema.safeParse({ goalWeightKg: 70, currentWeightKg: 82 }).success).toBe(
      true,
    );
    expect(goalWeightSchema.safeParse({ goalWeightKg: 900, currentWeightKg: 82 }).success).toBe(
      false,
    );
  });
});
