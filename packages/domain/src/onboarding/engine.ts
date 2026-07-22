/**
 * Onboarding engine — pure logic over the data-driven step list. Handles conditional visibility,
 * per-step completeness, progress, navigation, resume, safety-flag derivation, and building the
 * Target-Engine input + immutable snapshot. No React, no I/O — fully unit-tested.
 */
import type {
  ChallengeStartSnapshot,
  OnboardingAnswers,
  OnboardingStepDef,
  PilotBaseline,
  SafetyFlag,
  TargetEngineInput,
  TargetRecommendation,
  WeightUnit,
} from '@challenge42/types';

// ---- Safety --------------------------------------------------------------------------------

export function deriveSafetyFlags(a: OnboardingAnswers): SafetyFlag[] {
  const flags: SafetyFlag[] = [];
  if (a.isPregnant) flags.push('PREGNANT');
  if (a.isRecentPostpartum) flags.push('RECENT_POSTPARTUM');
  if (a.isBreastfeeding) flags.push('BREASTFEEDING');
  if (a.hasHealthConditions || a.underMedicalCare) flags.push('CLINICAL_REVIEW_RECOMMENDED');
  if (a.eatingDisorderHistory) flags.push('EATING_DISORDER_SAFETY_FLAG');
  return flags;
}

const TIME_AVAILABLE_MINUTES: Record<string, number | null> = {
  '10': 10,
  '20': 20,
  '30': 30,
  '45_plus': 45,
  varies: null,
};

/**
 * Build the Target-Engine input. Returns null if a required field is missing (caller should not
 * finalize). Defaults sex to 'unspecified' and activity to 'sedentary' only when explicitly absent
 * is impossible via the flow — here we require them and return null otherwise.
 */
export function buildTargetInput(a: OnboardingAnswers): TargetEngineInput | null {
  if (
    a.age == null ||
    a.heightCm == null ||
    a.currentWeightKg == null ||
    a.sex == null ||
    a.activityLevel == null ||
    a.primaryGoal == null
  ) {
    return null;
  }
  return {
    age: a.age,
    heightCm: a.heightCm,
    currentWeightKg: a.currentWeightKg,
    goalWeightKg: a.goalWeightKg ?? null,
    sex: a.sex,
    activityLevel: a.activityLevel,
    primaryGoal: a.primaryGoal,
    timeAvailableMinutes: a.timeAvailable
      ? (TIME_AVAILABLE_MINUTES[a.timeAvailable] ?? null)
      : null,
    safetyFlags: deriveSafetyFlags(a),
  };
}

// ---- Step visibility & completeness --------------------------------------------------------

export function visibleSteps(
  steps: readonly OnboardingStepDef[],
  answers: OnboardingAnswers,
): OnboardingStepDef[] {
  return steps.filter((s) => (s.condition ? s.condition(answers) : true));
}

/** Whether a step is satisfied enough to advance (optional steps always are). */
export function canAdvance(step: OnboardingStepDef, answers: OnboardingAnswers): boolean {
  if (step.kind === 'info') return true;
  if (!step.required) return true;
  if (!step.key) return true;
  const v = answers[step.key];

  switch (step.kind) {
    case 'text':
    case 'longtext':
      return typeof v === 'string' && v.trim().length > 0;
    case 'number':
    case 'scale': {
      if (typeof v !== 'number' || Number.isNaN(v)) return false;
      if (step.min != null && v < step.min) return false;
      if (step.max != null && v > step.max) return false;
      return true;
    }
    case 'height':
    case 'weight':
      return typeof v === 'number' && v > 0;
    case 'single_select':
      return typeof v === 'string' && v.length > 0;
    case 'boolean':
      return typeof v === 'boolean';
    case 'multi_select':
    case 'taglist':
      return Array.isArray(v) && v.length >= (step.minSelect ?? 1);
    default:
      return v != null;
  }
}

// ---- Navigation, progress, resume ----------------------------------------------------------

export function firstStepId(
  steps: readonly OnboardingStepDef[],
  answers: OnboardingAnswers,
): string | null {
  return visibleSteps(steps, answers)[0]?.id ?? null;
}

export function nextStepId(
  steps: readonly OnboardingStepDef[],
  answers: OnboardingAnswers,
  currentId: string,
): string | null {
  const vis = visibleSteps(steps, answers);
  const i = vis.findIndex((s) => s.id === currentId);
  if (i === -1) return null;
  return vis[i + 1]?.id ?? null;
}

export function prevStepId(
  steps: readonly OnboardingStepDef[],
  answers: OnboardingAnswers,
  currentId: string,
): string | null {
  const vis = visibleSteps(steps, answers);
  const i = vis.findIndex((s) => s.id === currentId);
  if (i <= 0) return null;
  return vis[i - 1]?.id ?? null;
}

export interface OnboardingProgress {
  index: number; // 1-based position of current step among visible
  total: number; // count of visible steps
  fraction: number; // 0–1
}

export function progressFor(
  steps: readonly OnboardingStepDef[],
  answers: OnboardingAnswers,
  currentId: string,
): OnboardingProgress {
  const vis = visibleSteps(steps, answers);
  const i = vis.findIndex((s) => s.id === currentId);
  const index = i === -1 ? 1 : i + 1;
  const total = Math.max(vis.length, 1);
  return { index, total, fraction: Math.min(index / total, 1) };
}

/** All visible required steps answered → onboarding can be finalized. */
export function isOnboardingComplete(
  steps: readonly OnboardingStepDef[],
  answers: OnboardingAnswers,
): boolean {
  return visibleSteps(steps, answers).every((s) => canAdvance(s, answers));
}

/**
 * The step to resume on: prefer a persisted `currentStepId` if it's still visible; otherwise the
 * first visible required step that is not yet answered; otherwise the first step.
 */
export function resumeStepId(
  steps: readonly OnboardingStepDef[],
  answers: OnboardingAnswers,
  persistedCurrentId: string | null,
): string | null {
  const vis = visibleSteps(steps, answers);
  if (vis.length === 0) return null;
  if (persistedCurrentId && vis.some((s) => s.id === persistedCurrentId)) return persistedCurrentId;
  const firstUnanswered = vis.find((s) => !canAdvance(s, answers));
  return (firstUnanswered ?? vis[0])!.id;
}

// ---- Snapshot builder ----------------------------------------------------------------------

export interface BuildSnapshotParams {
  id: string;
  challengeId: string;
  challengeMemberId: string;
  userId: string;
  answers: OnboardingAnswers;
  recommendation: TargetRecommendation;
  createdAt: string; // ISO — passed in (domain stays clock-free)
  onboardingVersion: string;
  challengeRulesVersion: string;
}

/** Assemble the immutable challenge-start snapshot. Ids/timestamps are supplied by the caller. */
export function buildChallengeStartSnapshot(p: BuildSnapshotParams): ChallengeStartSnapshot {
  const a = p.answers;
  const r = p.recommendation;
  const baseline: PilotBaseline = {
    confidenceCompletion: a.confidenceCompletion ?? 0,
    habitSatisfaction: a.habitSatisfaction ?? 0,
    foodControl: a.foodControl ?? 0,
    exerciseConsistency: a.exerciseConsistency ?? 0,
    successDefinition: a.successDefinition ?? null,
  };
  const unit: WeightUnit = a.weightUnit ?? 'lb';

  return {
    id: p.id,
    challenge_id: p.challengeId,
    challenge_member_id: p.challengeMemberId,
    user_id: p.userId,

    start_weight_kg: a.currentWeightKg ?? 0,
    long_term_goal_weight_kg: a.goalWeightKg ?? null,
    display_weight_unit: unit,

    target_status: r.status,
    // Copy arrays/objects so later profile edits can never mutate this historical record.
    safety_flags: [...r.safetyFlags],
    calorie_target: r.calorieTarget,
    calorie_target_low: r.calorieTargetRangeKcal?.low ?? null,
    calorie_target_high: r.calorieTargetRangeKcal?.high ?? null,
    protein_target_g: r.proteinTargetG,
    movement: { ...r.movement },
    weight_loss_range_kg: r.weightLossRangeKg ? { ...r.weightLossRangeKg } : null,

    primary_goal: a.primaryGoal ?? 'build_consistency',
    secondary_goals: [...(a.secondaryGoals ?? [])],
    primary_motivation: a.motivation ?? null,
    primary_barriers: [...(a.eatingBarriers ?? [])],
    falloff_triggers: [...(a.falloffTriggers ?? [])],
    parent_season: a.parentSeason ?? null,
    child_age_bands: [...(a.childAgeBands ?? [])],
    activity_level: a.activityLevel ?? 'sedentary',
    enjoyed_activities: [...(a.enjoyedActivities ?? [])],

    baseline,

    target_engine_version: r.engineVersion,
    onboarding_version: p.onboardingVersion,
    challenge_rules_version: p.challengeRulesVersion,

    created_at: p.createdAt,
  };
}
