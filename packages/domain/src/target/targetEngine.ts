/**
 * Target Recommendation Engine — deterministic, conservative, safety-first. See docs/TARGET_ENGINE.md.
 *
 * NEVER calls AI. NEVER prescribes an aggressive deficit. Special circumstances return
 * SAFE_REVIEW_REQUIRED with no automated weight-loss target.
 */
import {
  TARGET_ENGINE,
  TARGET_ENGINE_VERSION,
  HEALTH_GUARDRAILS,
  WEIGHT_LOSS_GOALS,
} from '@challenge42/config';
import type {
  PrimaryGoal,
  Range,
  SafetyFlag,
  SafetyStatus,
  Sex,
  TargetEngineInput,
  TargetRecommendation,
} from '@challenge42/types';

const roundTo = (value: number, step: number): number => Math.round(value / step) * step;

/** Mifflin-St Jeor BMR (kcal/day). */
export function basalMetabolicRate(
  sex: Sex,
  weightKg: number,
  heightCm: number,
  age: number,
): number {
  const c = TARGET_ENGINE.bmrSexConstant[sex];
  return 10 * weightKg + 6.25 * heightCm - 5 * age + c;
}

export function totalDailyEnergyExpenditure(
  bmr: number,
  activityLevel: TargetEngineInput['activityLevel'],
): number {
  return bmr * TARGET_ENGINE.activityFactor[activityLevel];
}

/** SAFE_REVIEW_REQUIRED if any safety flag is present. */
export function deriveSafetyStatus(flags: readonly SafetyFlag[]): SafetyStatus {
  return flags.length > 0 ? 'SAFE_REVIEW_REQUIRED' : 'STANDARD_AUTOMATED_PLAN_ELIGIBLE';
}

function isWeightLossGoal(goal: PrimaryGoal): boolean {
  return (WEIGHT_LOSS_GOALS as readonly string[]).includes(goal);
}

function proteinTargetG(currentWeightKg: number): number {
  const ref = Math.min(currentWeightKg, TARGET_ENGINE.protein.referenceWeightCapKg);
  const grams = roundTo(TARGET_ENGINE.protein.gramsPerKg * ref, 5);
  return Math.max(TARGET_ENGINE.protein.minG, Math.min(TARGET_ENGINE.protein.maxG, grams));
}

function movementFor(activityLevel: TargetEngineInput['activityLevel']) {
  return {
    dailySteps: TARGET_ENGINE.movement.dailySteps,
    sessionsPerWeek:
      activityLevel === 'sedentary'
        ? TARGET_ENGINE.movement.sessionsPerWeekSedentary
        : TARGET_ENGINE.movement.sessionsPerWeekDefault,
  };
}

function band(mid: number): Range {
  const b = TARGET_ENGINE.displayBandKcal;
  return {
    low: roundTo(mid - b, TARGET_ENGINE.roundToKcal),
    high: roundTo(mid + b, TARGET_ENGINE.roundToKcal),
  };
}

const SAFE_REVIEW_MESSAGE =
  'Your situation deserves a more personalized approach. We’ll help you continue, but we won’t ' +
  'automatically generate a weight-loss target until the appropriate safety review is complete.';

/**
 * The service. Pure: same input → same output. Stamps the engine version for reproducible snapshots.
 */
export function recommendTargets(input: TargetEngineInput): TargetRecommendation {
  const status = deriveSafetyStatus(input.safetyFlags);
  const bmr = basalMetabolicRate(input.sex, input.currentWeightKg, input.heightCm, input.age);
  const tdee = totalDailyEnergyExpenditure(bmr, input.activityLevel);
  const maintenanceRangeKcal = band(tdee);
  const movement = movementFor(input.activityLevel);

  // ---- Safety-routed path: no automated deficit / weight-loss target -------------------------
  if (status === 'SAFE_REVIEW_REQUIRED') {
    const eatingDisorder = input.safetyFlags.includes('EATING_DISORDER_SAFETY_FLAG');
    return {
      status,
      safetyFlags: input.safetyFlags,
      maintenanceRangeKcal,
      calorieTarget: null,
      calorieTargetRangeKcal: null,
      // Suppress all numeric food targets when eating-disorder history is present.
      proteinTargetG: eatingDisorder ? null : proteinTargetG(input.currentWeightKg),
      movement,
      weightLossRangeKg: null,
      primaryFocus: 'Build gentle consistency',
      explanation: SAFE_REVIEW_MESSAGE,
      assumptions: [
        'No automated calorie deficit or weight-loss target is generated for your circumstances.',
        'Estimates shown are general maintenance references, not medical advice.',
      ],
      engineVersion: TARGET_ENGINE_VERSION,
    };
  }

  // ---- Standard eligible path ----------------------------------------------------------------
  const assumptions: string[] = [
    'Maintenance estimated with the Mifflin-St Jeor equation and a conservative activity factor.',
    'All values are population estimates, not individualized medical advice.',
  ];

  const wantsLoss = isWeightLossGoal(input.primaryGoal);
  let calorieTargetMid = tdee;

  if (wantsLoss) {
    const deficit = Math.min(
      TARGET_ENGINE.deficit.capKcal,
      tdee * TARGET_ENGINE.deficit.maxFraction,
    );
    const floor = Math.max(
      TARGET_ENGINE.calorieFloorBySex[input.sex],
      HEALTH_GUARDRAILS.minCalorieTargetFloor,
    );
    const raw = tdee - deficit;
    calorieTargetMid = Math.max(raw, floor);
    if (calorieTargetMid > raw) {
      assumptions.push('A calorie floor was applied, so the deficit is smaller than the cap.');
    } else {
      assumptions.push('A conservative deficit (≤500 kcal and ≤20% of maintenance) was applied.');
    }
  } else {
    assumptions.push(
      'Your goal doesn’t call for a deficit — this is a maintenance-oriented target.',
    );
  }

  const calorieTarget = roundTo(calorieTargetMid, TARGET_ENGINE.roundToKcal);
  const calorieTargetRangeKcal = band(calorieTargetMid);

  const weightLossRangeKg: Range | null = wantsLoss
    ? {
        low:
          Math.round(
            input.currentWeightKg *
              TARGET_ENGINE.weeklyLossFraction.low *
              TARGET_ENGINE.challengeWeeks *
              10,
          ) / 10,
        high:
          Math.round(
            input.currentWeightKg *
              TARGET_ENGINE.weeklyLossFraction.high *
              TARGET_ENGINE.challengeWeeks *
              10,
          ) / 10,
      }
    : null;

  return {
    status,
    safetyFlags: input.safetyFlags,
    maintenanceRangeKcal,
    calorieTarget,
    calorieTargetRangeKcal,
    proteinTargetG: proteinTargetG(input.currentWeightKg),
    movement,
    weightLossRangeKg,
    primaryFocus: 'Build 90%+ consistency',
    explanation: wantsLoss
      ? `Your estimated maintenance is about ${maintenanceRangeKcal.low}–${maintenanceRangeKcal.high} kcal. ` +
        'We set a conservative target with a modest deficit. These are estimates, not medical advice.'
      : `Your estimated maintenance is about ${maintenanceRangeKcal.low}–${maintenanceRangeKcal.high} kcal. ` +
        'We’ll focus on consistency and protein rather than a deficit. These are estimates.',
    assumptions,
    engineVersion: TARGET_ENGINE_VERSION,
  };
}
