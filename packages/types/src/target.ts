/** Target Recommendation Engine types. See docs/TARGET_ENGINE.md. */
import type { ActivityLevel, PrimaryGoal, SafetyFlag, SafetyStatus, Sex } from './onboarding';

export interface TargetEngineInput {
  age: number;
  heightCm: number;
  currentWeightKg: number;
  goalWeightKg?: number | null;
  sex: Sex;
  activityLevel: ActivityLevel;
  primaryGoal: PrimaryGoal;
  timeAvailableMinutes?: number | null;
  safetyFlags: readonly SafetyFlag[];
}

export interface Range {
  low: number;
  high: number;
}

export interface MovementRecommendation {
  dailySteps: number;
  sessionsPerWeek: number;
}

export interface TargetRecommendation {
  status: SafetyStatus;
  safetyFlags: readonly SafetyFlag[];
  maintenanceRangeKcal: Range;
  /** null when SAFE_REVIEW_REQUIRED — we do not auto-prescribe a deficit for special circumstances. */
  calorieTarget: number | null;
  calorieTargetRangeKcal: Range | null;
  proteinTargetG: number | null;
  movement: MovementRecommendation;
  /** Canonical kg; the UI converts to the user's unit. null unless an eligible weight-loss goal. */
  weightLossRangeKg: Range | null;
  primaryFocus: string;
  explanation: string;
  assumptions: readonly string[];
  engineVersion: string;
}
