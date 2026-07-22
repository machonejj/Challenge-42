/**
 * Target Recommendation Engine constants (see docs/TARGET_ENGINE.md). Deterministic, conservative,
 * configurable. The engine itself lives in `packages/domain`; these are the tunable policy numbers.
 */

/** Version stamps recorded on every immutable snapshot for reproducibility. Bump on any change. */
export const TARGET_ENGINE_VERSION = 'target-engine@1.0.0';
export const ONBOARDING_VERSION = 'onboarding@1.0.0';
export const CHALLENGE_RULES_VERSION = 'challenge-rules@1.0.0';

export const TARGET_ENGINE = {
  /** Mifflin-St Jeor sex constants; 'unspecified' is the average of male/female. */
  bmrSexConstant: { male: 5, female: -161, unspecified: -78 },

  /** Conservative activity multipliers (TDEE = BMR × factor). */
  activityFactor: {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very_active: 1.725,
  },

  /** Weight-loss deficit: the smaller of a flat cap and a fraction of TDEE (conservative). */
  deficit: {
    capKcal: 500,
    maxFraction: 0.2,
  },

  /** Hard calorie floors by sex. Target never drops below these (nor below the global floor). */
  calorieFloorBySex: { male: 1500, female: 1200, unspecified: 1300 },

  /** Protein: 1.6 g/kg of a capped reference weight, clamped. */
  protein: {
    gramsPerKg: 1.6,
    referenceWeightCapKg: 125,
    minG: 90,
    maxG: 200,
  },

  /** Movement defaults — sustainable, never "more is better". */
  movement: {
    dailySteps: 8000,
    sessionsPerWeekDefault: 3,
    sessionsPerWeekSedentary: 2,
  },

  /** 42-day suggested progress range as a fraction of body weight per week (0.4%–0.75%). */
  weeklyLossFraction: { low: 0.004, high: 0.0075 },
  challengeWeeks: 6,

  /** Maintenance/target display band, rounded to this granularity. */
  displayBandKcal: 100,
  roundToKcal: 25,
} as const;

/** Goals that trigger a weight-loss deficit. Others use maintenance. */
export const WEIGHT_LOSS_GOALS = ['lose_weight'] as const;
