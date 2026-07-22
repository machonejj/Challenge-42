/**
 * Immutable challenge-start snapshot + pilot baseline. Captured once at enrollment and NEVER mutated
 * by later profile edits — critical for pilot research and reproducible analytics.
 */
import type { UUID, ISOTimestamp } from './primitives';
import type { WeightUnit } from './enums';
import type {
  ActivityLevel,
  ChildAgeBand,
  EatingBarrier,
  EnjoyedActivity,
  FalloffTrigger,
  ParentSeason,
  PrimaryGoal,
  SafetyFlag,
  SafetyStatus,
} from './onboarding';
import type { MovementRecommendation, Range } from './target';

export interface PilotBaseline {
  confidenceCompletion: number; // 1–10
  habitSatisfaction: number; // 1–10
  foodControl: number; // 1–10
  exerciseConsistency: number; // 1–10
  successDefinition: string | null;
}

/** The immutable record written at enrollment. */
export interface ChallengeStartSnapshot {
  id: UUID;
  challenge_id: UUID;
  challenge_member_id: UUID;
  user_id: UUID;

  // Body baseline (canonical units)
  start_weight_kg: number;
  long_term_goal_weight_kg: number | null;
  display_weight_unit: WeightUnit;

  // Targets at start
  target_status: SafetyStatus;
  safety_flags: readonly SafetyFlag[];
  calorie_target: number | null;
  calorie_target_low: number | null;
  calorie_target_high: number | null;
  protein_target_g: number | null;
  movement: MovementRecommendation;
  weight_loss_range_kg: Range | null;

  // Context captured for research + personalization
  primary_goal: PrimaryGoal;
  secondary_goals: readonly PrimaryGoal[];
  primary_motivation: string | null; // private
  primary_barriers: readonly EatingBarrier[];
  falloff_triggers: readonly FalloffTrigger[];
  parent_season: ParentSeason | null;
  child_age_bands: readonly ChildAgeBand[];
  activity_level: ActivityLevel;
  enjoyed_activities: readonly EnjoyedActivity[];

  // Pilot baseline survey
  baseline: PilotBaseline;

  // Version stamps for reproducibility
  target_engine_version: string;
  onboarding_version: string;
  challenge_rules_version: string;

  created_at: ISOTimestamp;
}
