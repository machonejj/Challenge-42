/**
 * Zod schemas for user input at the edges (forms, API bodies). Parsing happens where untrusted data
 * enters; internal code then works with the inferred, trusted types.
 *
 * Health-safety note: bounds here are *plausibility* guards (reject absurd/typo values), not medical
 * limits. Scoring safety lives in `packages/domain`.
 */
import { z } from 'zod';
import type {
  MealSlot,
  WeightUnit,
  DistanceUnit,
  MapVisibility,
  CookingAbility,
  ActivityTypeKey,
} from '@challenge42/types';

// ---- Reusable enums (kept in lockstep with @challenge42/types) -------------------------------

export const mealSlotSchema = z.enum([
  'breakfast',
  'lunch',
  'dinner',
  'snack',
]) satisfies z.ZodType<MealSlot>;

export const weightUnitSchema = z.enum(['lb', 'kg']) satisfies z.ZodType<WeightUnit>;
export const distanceUnitSchema = z.enum(['mi', 'km']) satisfies z.ZodType<DistanceUnit>;
export const mapVisibilitySchema = z.enum([
  'hidden',
  'city',
  'approximate',
]) satisfies z.ZodType<MapVisibility>;
export const cookingAbilitySchema = z.enum([
  'beginner',
  'comfortable',
  'advanced',
]) satisfies z.ZodType<CookingAbility>;
export const activityTypeSchema = z.enum([
  'run',
  'walk',
  'strength',
  'cycling',
  'yoga',
  'hiit',
  'sports',
  'other',
]) satisfies z.ZodType<ActivityTypeKey>;

// ---- Weigh-in ---------------------------------------------------------------------------------

/** A weigh-in. Weight is captured in the user's unit and normalized to kg downstream. */
export const weighInSchema = z.object({
  weight: z.number().positive().max(1500), // plausibility guard (lb or kg pre-normalization)
  unit: weightUnitSchema,
  measuredAt: z.iso.datetime().optional(),
  note: z.string().max(280).optional(),
});
export type WeighInInput = z.infer<typeof weighInSchema>;

// ---- Food logging -----------------------------------------------------------------------------

/** Quick-add calories (no food breakdown). */
export const quickAddCaloriesSchema = z.object({
  slot: mealSlotSchema,
  calories: z.number().int().nonnegative().max(10000),
  proteinG: z.number().nonnegative().max(1000).optional(),
});
export type QuickAddCaloriesInput = z.infer<typeof quickAddCaloriesSchema>;

/** A single logged food item. Nutrition values come from a verified provider, not free text/AI. */
export const foodLogItemSchema = z.object({
  label: z.string().min(1).max(120),
  providerFoodId: z.string().min(1).nullable(),
  quantity: z.number().positive().max(10000),
  unit: z.string().min(1).max(24),
  calories: z.number().nonnegative().max(10000),
  proteinG: z.number().nonnegative().max(1000),
});
export type FoodLogItemInput = z.infer<typeof foodLogItemSchema>;

export const foodLogEntrySchema = z.object({
  slot: mealSlotSchema,
  isPlannedMeal: z.boolean().default(false),
  items: z.array(foodLogItemSchema).min(1).max(50),
});
export type FoodLogEntryInput = z.infer<typeof foodLogEntrySchema>;

// ---- Onboarding / preferences -----------------------------------------------------------------

export const onboardingProfileSchema = z.object({
  displayName: z.string().min(1).max(60),
  city: z.string().max(120).optional(),
  state: z.string().max(60).optional(),
  weightUnit: weightUnitSchema.default('lb'),
  distanceUnit: distanceUnitSchema.default('mi'),
  cookingAbility: cookingAbilitySchema.optional(),
});
export type OnboardingProfileInput = z.infer<typeof onboardingProfileSchema>;

export const mealPreferencesSchema = z.object({
  dislikedFoods: z.array(z.string().max(60)).max(100).default([]),
  allergies: z.array(z.string().max(60)).max(100).default([]),
  dietaryRestrictions: z.array(z.string().max(60)).max(50).default([]),
  favoriteCuisines: z.array(z.string().max(60)).max(50).default([]),
  maxCookMinutes: z.number().int().positive().max(240).optional(),
  familySize: z.number().int().min(1).max(20).optional(),
  weeklyBudgetCents: z.number().int().nonnegative().max(200000).optional(),
  mealsPerDay: z.number().int().min(1).max(8).default(3),
});
export type MealPreferencesInput = z.infer<typeof mealPreferencesSchema>;

// ---- Activity ---------------------------------------------------------------------------------

export const startActivitySchema = z.object({
  activityType: activityTypeSchema,
  title: z.string().max(80).optional(),
});
export type StartActivityInput = z.infer<typeof startActivitySchema>;

// ---- Privacy / map ----------------------------------------------------------------------------

export const privacySettingsSchema = z.object({
  weightVisibility: z.enum(['private', 'team', 'challenge']).default('private'),
  calorieVisibility: z.enum(['private', 'team', 'challenge']).default('private'),
  photoVisibility: z.enum(['private', 'team', 'challenge']).default('private'),
  mapVisibility: mapVisibilitySchema.default('hidden'),
  // `shareRoutes` intentionally omitted: raw routes are never shareable (see SECURITY.md §3.3).
});
export type PrivacySettingsInput = z.infer<typeof privacySettingsSchema>;

// ---- Community --------------------------------------------------------------------------------

export const createPostSchema = z.object({
  section: z.enum(['for_you', 'wins', 'meal_ideas', 'questions', 'my_team', 'recipes']),
  body: z.string().min(1).max(2000),
  mediaUrls: z.array(z.url()).max(6).default([]),
});
export type CreatePostInput = z.infer<typeof createPostSchema>;
