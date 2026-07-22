import { describe, it, expect } from 'vitest';
import { SCORING } from '@challenge42/config';
import {
  computeDailyScore,
  caloriesInRange,
  countQualifyingSessions,
  currentStreak,
  longestStreak,
  consistency,
  teamScore,
  dayCounts,
  type DailyScoreInput,
} from './scoring';

const perfectDay: DailyScoreInput = {
  loggedFood: true,
  caloriesConsumed: 2000,
  calorieTarget: 2000,
  completedPlanMeals: 4,
  plannedMeals: 4,
  qualifyingActivitySessions: 1,
  weighInDue: true,
  weighedIn: true,
  checkedIn: true,
};

describe('computeDailyScore', () => {
  it('a fully-completed day scores 100', () => {
    expect(computeDailyScore(perfectDay).score).toBe(100);
  });

  it('is bounded to [0, 100]', () => {
    const empty = computeDailyScore({
      loggedFood: false,
      caloriesConsumed: null,
      calorieTarget: 2000,
      completedPlanMeals: 0,
      plannedMeals: 0,
      qualifyingActivitySessions: 0,
      weighInDue: false,
      weighedIn: false,
      checkedIn: false,
    });
    // Non-due weigh-in still grants its points (no daily weigh-in pressure).
    expect(empty.score).toBe(SCORING.components.weighInWhenDue);
    expect(empty.score).toBeGreaterThanOrEqual(0);
    expect(empty.score).toBeLessThanOrEqual(100);
  });

  // ---- SAFETY INVARIANT 1: undereating is NOT rewarded ----------------------------------------
  it('SAFETY: eating far under target scores the SAME as eating far over (both zero in-range)', () => {
    const under = computeDailyScore({ ...perfectDay, caloriesConsumed: 900 });
    const over = computeDailyScore({ ...perfectDay, caloriesConsumed: 3200 });
    expect(under.breakdown.caloriesInRange).toBe(0);
    expect(over.breakdown.caloriesInRange).toBe(0);
    expect(under.score).toBe(over.score);
  });

  it('SAFETY: a starvation day never beats a healthy in-range day', () => {
    const starving = computeDailyScore({ ...perfectDay, caloriesConsumed: 600 });
    const healthy = computeDailyScore({ ...perfectDay, caloriesConsumed: 2000 });
    expect(starving.score).toBeLessThan(healthy.score);
  });

  // ---- SAFETY INVARIANT 2: over-exercise is capped --------------------------------------------
  it('SAFETY: extra activity sessions add nothing beyond the cap', () => {
    const one = computeDailyScore({ ...perfectDay, qualifyingActivitySessions: 1 });
    const many = computeDailyScore({ ...perfectDay, qualifyingActivitySessions: 6 });
    expect(one.breakdown.movement).toBe(SCORING.components.movement);
    expect(many.breakdown.movement).toBe(SCORING.components.movement);
    expect(one.score).toBe(many.score);
  });

  // ---- SAFETY INVARIANT 3: no daily weigh-in pressure -----------------------------------------
  it('SAFETY: not weighing in on a non-due day is not penalized', () => {
    const notDue = computeDailyScore({ ...perfectDay, weighInDue: false, weighedIn: false });
    expect(notDue.breakdown.weighInWhenDue).toBe(SCORING.components.weighInWhenDue);
    expect(notDue.score).toBe(100);
  });

  it('missing a due weigh-in costs exactly the weigh-in component', () => {
    const missed = computeDailyScore({ ...perfectDay, weighInDue: true, weighedIn: false });
    expect(missed.breakdown.weighInWhenDue).toBe(0);
    expect(missed.score).toBe(100 - SCORING.components.weighInWhenDue);
  });

  it('scores plan adherence proportionally', () => {
    const half = computeDailyScore({ ...perfectDay, completedPlanMeals: 2, plannedMeals: 4 });
    expect(half.breakdown.completedPlanMeals).toBe(
      Math.round(SCORING.components.completedPlanMeals / 2),
    );
  });

  it('a user without a meal plan can still clear the day-complete threshold', () => {
    const noPlan = computeDailyScore({
      loggedFood: true,
      caloriesConsumed: 2000,
      calorieTarget: 2000,
      completedPlanMeals: 0,
      plannedMeals: 0,
      qualifyingActivitySessions: 1,
      weighInDue: false,
      weighedIn: false,
      checkedIn: true,
    });
    expect(noPlan.score).toBeGreaterThanOrEqual(SCORING.dayCompleteThreshold);
  });
});

describe('caloriesInRange', () => {
  it('is false when nothing is logged', () => {
    expect(caloriesInRange(null, 2000)).toBe(false);
  });
  it('is symmetric around target', () => {
    expect(caloriesInRange(2000, 2000)).toBe(true);
    expect(caloriesInRange(2000 * 0.8, 2000)).toBe(false); // 20% under
    expect(caloriesInRange(2000 * 1.2, 2000)).toBe(false); // 20% over
  });
});

describe('countQualifyingSessions', () => {
  it('only counts sessions meeting the minute bar', () => {
    expect(countQualifyingSessions([5, 10, 15, 45])).toBe(2);
  });
});

describe('streaks & consistency', () => {
  const T = SCORING.streakThreshold;
  it('currentStreak counts trailing qualifying days', () => {
    expect(currentStreak([T, T, 10, T, T, T])).toBe(3);
    expect(currentStreak([10, 20, 30])).toBe(0);
  });
  it('longestStreak finds the best run', () => {
    expect(longestStreak([T, T, 10, T, T, T, 0, T])).toBe(3);
  });
  it('consistency is done-days / elapsed', () => {
    expect(consistency([T, T, 10, T], 4)).toBeCloseTo(0.75);
    expect(consistency([], 0)).toBe(0);
  });
  it('dayCounts respects the threshold', () => {
    expect(dayCounts(T)).toBe(true);
    expect(dayCounts(T - 1)).toBe(false);
  });
});

describe('teamScore (size normalization)', () => {
  it('is the average, so a bigger team does not automatically win', () => {
    const smallStrong = teamScore([90, 92, 88]); // 3 members, avg 90
    const bigWeak = teamScore([60, 62, 58, 61, 59, 60, 61, 59]); // 8 members, avg ~60
    expect(smallStrong).toBeGreaterThan(bigWeak);
  });
  it('is 0 for an empty team', () => {
    expect(teamScore([])).toBe(0);
  });
});
