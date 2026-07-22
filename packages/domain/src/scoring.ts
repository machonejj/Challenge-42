/**
 * Scoring engine — the competitive heart of Challenge42.
 *
 * SAFETY INVARIANTS (enforced by code + tests in scoring.test.ts):
 *  1. No component can be increased by eating LESS. Undereating scores the same as overeating
 *     (zero for "in range"). See `caloriesInRange`.
 *  2. Movement is capped: one qualifying session earns full credit; more earns nothing. Excess
 *     exercise never raises the score.
 *  3. Weigh-ins are only rewarded when *due* (weekly cadence); non-due days are never penalized,
 *     so there is no incentive to weigh daily.
 *  4. The daily score is bounded to [0, 100].
 *
 * The algorithm lives here (shared by mobile, admin, edge functions) so every surface agrees.
 */
import { SCORING } from '@challenge42/config';

export interface DailyScoreInput {
  readonly loggedFood: boolean;
  /** Calories consumed; null when the user has not logged. */
  readonly caloriesConsumed: number | null;
  readonly calorieTarget: number;
  readonly completedPlanMeals: number;
  readonly plannedMeals: number;
  /** Count of activity sessions that already meet the qualifying-minutes bar. */
  readonly qualifyingActivitySessions: number;
  readonly weighInDue: boolean;
  readonly weighedIn: boolean;
  readonly checkedIn: boolean;
}

export interface DailyScoreBreakdown {
  readonly loggedFood: number;
  readonly caloriesInRange: number;
  readonly completedPlanMeals: number;
  readonly movement: number;
  readonly weighInWhenDue: number;
  readonly dailyCheckin: number;
}

export interface DailyScoreResult {
  readonly score: number; // 0–100
  readonly breakdown: DailyScoreBreakdown;
}

/**
 * Whether consumed calories fall inside the healthy band around target. Symmetric by design:
 * eating far UNDER target returns false just like eating far OVER. Not logging → false.
 */
export function caloriesInRange(consumed: number | null, target: number): boolean {
  if (consumed === null || target <= 0) return false;
  const lower = target * (1 - SCORING.calorieBand.underTolerance);
  const upper = target * (1 + SCORING.calorieBand.overTolerance);
  return consumed >= lower && consumed <= upper;
}

/** Count how many sessions meet the qualifying-minutes bar (helper for callers). */
export function countQualifyingSessions(
  sessionMinutes: readonly number[],
  minMinutes: number = SCORING.movement.qualifyingMinutes,
): number {
  return sessionMinutes.filter((m) => m >= minMinutes).length;
}

export function computeDailyScore(input: DailyScoreInput): DailyScoreResult {
  const c = SCORING.components;

  const loggedFood = input.loggedFood ? c.loggedFood : 0;

  const caloriesInRangePts =
    input.loggedFood && caloriesInRange(input.caloriesConsumed, input.calorieTarget)
      ? c.caloriesInRange
      : 0;

  // Plan adherence, proportional to planned meals. No plan → this component is simply unearned
  // (a user can still comfortably clear the day-complete threshold without a meal plan).
  const completedPlanMeals =
    input.plannedMeals > 0
      ? Math.round(
          (Math.min(input.completedPlanMeals, input.plannedMeals) / input.plannedMeals) *
            c.completedPlanMeals,
        )
      : 0;

  // Movement is capped — extra sessions add nothing (anti-over-exercise).
  const qualifying = Math.min(
    input.qualifyingActivitySessions,
    SCORING.movement.fullCreditSessions,
  );
  const movement = qualifying >= 1 ? c.movement : 0;

  // Weigh-in only matters when due; non-due days grant the points freely (no daily pressure).
  const weighInWhenDue = input.weighInDue
    ? input.weighedIn
      ? c.weighInWhenDue
      : 0
    : c.weighInWhenDue;

  const dailyCheckin = input.checkedIn ? c.dailyCheckin : 0;

  const breakdown: DailyScoreBreakdown = {
    loggedFood,
    caloriesInRange: caloriesInRangePts,
    completedPlanMeals,
    movement,
    weighInWhenDue,
    dailyCheckin,
  };

  const raw =
    loggedFood + caloriesInRangePts + completedPlanMeals + movement + weighInWhenDue + dailyCheckin;
  const score = Math.min(Math.max(raw, 0), SCORING.maxDailyScore);

  return { score, breakdown };
}

/** Does a day's score count as "done" for streak/consistency purposes? */
export function dayCounts(score: number): boolean {
  return score >= SCORING.dayCompleteThreshold;
}

/** Current trailing streak: consecutive most-recent days at/above the streak threshold. */
export function currentStreak(dayScores: readonly number[]): number {
  let streak = 0;
  for (let i = dayScores.length - 1; i >= 0; i -= 1) {
    if (dayScores[i]! >= SCORING.streakThreshold) streak += 1;
    else break;
  }
  return streak;
}

/** Longest streak anywhere in the history. */
export function longestStreak(dayScores: readonly number[]): number {
  let best = 0;
  let run = 0;
  for (const s of dayScores) {
    if (s >= SCORING.streakThreshold) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }
  return best;
}

/** Consistency = days that count / days elapsed. Returns 0–1. */
export function consistency(dayScores: readonly number[], daysElapsed: number): number {
  if (daysElapsed <= 0) return 0;
  const done = dayScores.filter(dayCounts).length;
  return Math.min(done / daysElapsed, 1);
}

/**
 * Team score is the AVERAGE of member scores (per-capita), so a larger team never wins by size
 * alone. Returns 0 for an empty team.
 */
export function teamScore(memberScores: readonly number[]): number {
  if (memberScores.length === 0) return 0;
  const sum = memberScores.reduce((acc, s) => acc + s, 0);
  return Math.round((sum / memberScores.length) * 100) / 100;
}
