import { describe, it, expect } from 'vitest';
import {
  weighInSchema,
  quickAddCaloriesSchema,
  privacySettingsSchema,
  mealPreferencesSchema,
} from './schemas';

describe('weighInSchema', () => {
  it('accepts a plausible weigh-in', () => {
    const parsed = weighInSchema.parse({ weight: 251.4, unit: 'lb' });
    expect(parsed.weight).toBe(251.4);
    expect(parsed.unit).toBe('lb');
  });

  it('rejects a non-positive weight', () => {
    expect(weighInSchema.safeParse({ weight: 0, unit: 'lb' }).success).toBe(false);
    expect(weighInSchema.safeParse({ weight: -5, unit: 'kg' }).success).toBe(false);
  });

  it('rejects an absurd weight (typo guard)', () => {
    expect(weighInSchema.safeParse({ weight: 99999, unit: 'lb' }).success).toBe(false);
  });
});

describe('quickAddCaloriesSchema', () => {
  it('requires a valid meal slot', () => {
    expect(quickAddCaloriesSchema.safeParse({ slot: 'brunch', calories: 400 }).success).toBe(false);
    expect(quickAddCaloriesSchema.safeParse({ slot: 'lunch', calories: 400 }).success).toBe(true);
  });
});

describe('privacySettingsSchema', () => {
  it('defaults every sensitive field to private/hidden', () => {
    const parsed = privacySettingsSchema.parse({});
    expect(parsed.weightVisibility).toBe('private');
    expect(parsed.calorieVisibility).toBe('private');
    expect(parsed.photoVisibility).toBe('private');
    expect(parsed.mapVisibility).toBe('hidden');
  });
});

describe('mealPreferencesSchema', () => {
  it('defaults collections to empty and meals/day to 3', () => {
    const parsed = mealPreferencesSchema.parse({});
    expect(parsed.dislikedFoods).toEqual([]);
    expect(parsed.mealsPerDay).toBe(3);
  });
});
