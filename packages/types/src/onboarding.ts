/**
 * Onboarding domain — enums, the progressive answer shape, and data-driven step definitions.
 *
 * The onboarding flow is DATA-DRIVEN: `packages/config` defines the ordered step list; the pure
 * engine in `packages/domain` computes visible steps / progress / resume; the mobile app renders one
 * question per screen. Adding or reordering a question is a config edit — no new screen files.
 *
 * Audience note: parent-focused *content* lives in config; these structures stay audience-agnostic.
 */
import type { WeightUnit } from './enums';
import type { ISOTimestamp } from './primitives';

// ---- Enums (also consumed by the Target Engine) ---------------------------------------------

export type Sex = 'male' | 'female' | 'unspecified';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active';

export type PrimaryGoal =
  | 'lose_weight'
  | 'build_habits'
  | 'feel_in_control'
  | 'get_back_to_exercise'
  | 'improve_energy'
  | 'build_consistency';

export type SafetyFlag =
  | 'PREGNANT'
  | 'RECENT_POSTPARTUM'
  | 'BREASTFEEDING'
  | 'CLINICAL_REVIEW_RECOMMENDED'
  | 'EATING_DISORDER_SAFETY_FLAG';

export type SafetyStatus = 'STANDARD_AUTOMATED_PLAN_ELIGIBLE' | 'SAFE_REVIEW_REQUIRED';

export type OnboardingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

// Parent / household
export type ChildAgeBand =
  | 'baby_under_1'
  | 'age_1_2'
  | 'age_3_5'
  | 'age_6_9'
  | 'age_10_13'
  | 'teen'
  | 'adult_children'
  | 'other';
export type ParentSeason =
  'new_baby' | 'toddler_chaos' | 'preschool' | 'school_age' | 'multiple_ages' | 'other';
export type CookForCount = '1' | '2' | '3_4' | '5_plus';
export type MealResponsibility =
  'mostly_me' | 'mostly_partner' | 'shared' | 'varies' | 'someone_else';
export type EatingBarrier =
  | 'no_time'
  | 'picky_kids'
  | 'eating_out'
  | 'work_schedule'
  | 'grocery_cost'
  | 'meal_planning'
  | 'separate_meals'
  | 'stress'
  | 'exhaustion'
  | 'weekends'
  | 'social_events'
  | 'other';

// History / barriers
export type FalloffTrigger =
  | 'weekends'
  | 'eating_out'
  | 'stress'
  | 'poor_sleep'
  | 'work'
  | 'kids'
  | 'travel'
  | 'hunger'
  | 'motivation'
  | 'all_or_nothing'
  | 'missing_one_day'
  | 'other';
export type PriorAttempts = 'first' | '1_2' | '3_5' | 'more_than_5' | 'lost_count';
export type FalloffPattern =
  'restart_next_day' | 'restart_monday' | 'give_up_days' | 'stop_completely' | 'depends';

// Food
export type CookTimePref = 'under_15' | '15_30' | '30_45' | 'enjoy_cooking';
export type CostImportance = 'very' | 'somewhat' | 'flexible';
export type EatOutFrequency = 'rarely' | '1_2_weekly' | '3_4_weekly' | '5_plus_weekly';
export type FamilyAdventurousness =
  'very_picky' | 'somewhat_picky' | 'flexible' | 'very_adventurous' | 'na';

// Activity / schedule
export type TimeAvailable = '10' | '20' | '30' | '45_plus' | 'varies';
export type EnjoyedActivity =
  | 'walking'
  | 'running'
  | 'strength'
  | 'home_workouts'
  | 'gym'
  | 'cycling'
  | 'sports'
  | 'yoga'
  | 'hiking'
  | 'none_yet'
  | 'other';
export type ActivityTimePref =
  'early_morning' | 'morning' | 'lunch' | 'afternoon' | 'evening' | 'after_bedtime' | 'varies';
export type ScheduleUnpredictability =
  | 'work'
  | 'kids'
  | 'sleep'
  | 'sports'
  | 'childcare'
  | 'travel'
  | 'shift_work'
  | 'predictable'
  | 'other';

// ---- Progressive answer shape ----------------------------------------------------------------

/** All optional — filled in progressively as the user advances. Persisted as the onboarding draft. */
export interface OnboardingAnswers {
  // A. Basic profile
  firstName?: string;
  displayName?: string;
  age?: number;
  sex?: Sex;
  heightCm?: number;
  currentWeightKg?: number;
  goalWeightKg?: number;
  weightUnit?: WeightUnit;
  city?: string;
  state?: string;

  // B. Parent / household
  isParent?: boolean;
  childrenCount?: number;
  childAgeBands?: ChildAgeBand[];
  parentSeason?: ParentSeason;
  cookForCount?: CookForCount;
  mealResponsibility?: MealResponsibility;
  eatingBarriers?: EatingBarrier[];

  // C. Goal
  primaryGoal?: PrimaryGoal;
  secondaryGoals?: PrimaryGoal[];
  motivation?: string; // private; stored in the immutable snapshot, never publicly exposed

  // D. History / barriers
  falloffTriggers?: FalloffTrigger[];
  priorAttempts?: PriorAttempts;
  falloffPattern?: FalloffPattern;

  // E. Food preferences
  lovedFoods?: string[];
  dislikedFoods?: string[];
  allergies?: string[];
  dietaryRestrictions?: string[];
  favoriteCuisines?: string[];
  cookTimePref?: CookTimePref;
  costImportance?: CostImportance;
  eatOutFrequency?: EatOutFrequency;
  sameMealForFamily?: boolean;
  familyAdventurousness?: FamilyAdventurousness;

  // F. Daily lifestyle
  activityLevel?: ActivityLevel;
  timeAvailable?: TimeAvailable;
  enjoyedActivities?: EnjoyedActivity[];
  activityTimePref?: ActivityTimePref;

  // G. Schedule
  scheduleUnpredictability?: ScheduleUnpredictability[];

  // H. Safety
  isPregnant?: boolean;
  isBreastfeeding?: boolean;
  isRecentPostpartum?: boolean;
  hasHealthConditions?: boolean;
  underMedicalCare?: boolean;
  eatingDisorderHistory?: boolean;

  // Confidence / baseline (pilot research)
  confidenceCompletion?: number; // 1–10
  habitSatisfaction?: number; // 1–10
  foodControl?: number; // 1–10
  exerciseConsistency?: number; // 1–10
  successDefinition?: string;
}

export type OnboardingAnswerKey = keyof OnboardingAnswers;

// ---- Data-driven step definitions ------------------------------------------------------------

export type OnboardingSection =
  | 'intro'
  | 'basics'
  | 'household'
  | 'goal'
  | 'history'
  | 'food'
  | 'lifestyle'
  | 'schedule'
  | 'safety'
  | 'baseline';

export type OnboardingStepKind =
  | 'info'
  | 'text'
  | 'longtext'
  | 'number'
  | 'height'
  | 'weight'
  | 'single_select'
  | 'multi_select'
  | 'taglist'
  | 'boolean'
  | 'scale';

export interface OnboardingOption {
  value: string;
  label: string;
  emoji?: string;
  /** Optional helper caption under the option label. */
  hint?: string;
}

export interface OnboardingStepDef {
  id: string;
  section: OnboardingSection;
  kind: OnboardingStepKind;
  /** Answer field this step reads/writes (omitted for `info` steps). */
  key?: OnboardingAnswerKey;
  title: string;
  subtitle?: string;
  options?: readonly OnboardingOption[];
  required?: boolean;
  min?: number;
  max?: number;
  minSelect?: number;
  maxSelect?: number;
  placeholder?: string;
  /** When present, the step is only shown if this returns true for the current answers. */
  condition?: (a: OnboardingAnswers) => boolean;
  /** Short reassuring line for sensitive steps (e.g. safety). */
  reassurance?: string;
}

/** Persisted onboarding state for resume. Stored by the OnboardingRepository. */
export interface OnboardingProgressRecord {
  status: OnboardingStatus;
  /** The step to resume on; null before start / after completion. */
  currentStepId: string | null;
  answers: OnboardingAnswers;
  version: string;
  updatedAt: ISOTimestamp;
}
