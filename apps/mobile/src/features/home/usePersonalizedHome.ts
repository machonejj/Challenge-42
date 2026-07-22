/**
 * Personalized Home: real user data (name, challenge day, weight, calorie/protein targets) merged
 * with the Phase-One dev adapters for pulse / team / plan / rank (those become real in later phases).
 * The seam is the same `HomeSnapshot` contract, so nothing downstream changes.
 */
import { useMemo } from 'react';
import { buildWeightDelta, challengeDayNumber, kgToDisplay, round } from '@challenge42/domain';
import type { HomeSnapshot } from '@challenge42/types';
import { useHomeSnapshot } from './useHomeSnapshot';
import { useProfileStore } from '@/features/profile/profileStore';

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function usePersonalizedHome() {
  const query = useHomeSnapshot();
  const profile = useProfileStore((s) => ({
    enrolled: s.enrolled,
    firstName: s.firstName,
    weightUnit: s.weightUnit,
    challengeName: s.challengeName,
    challengeStartDate: s.challengeStartDate,
    challengeLengthDays: s.challengeLengthDays,
    startWeightKg: s.startWeightKg,
    latestWeightKg: s.latestWeightKg,
    recommendation: s.recommendation,
    safetyStatus: s.safetyStatus,
  }));

  const data = useMemo<HomeSnapshot | undefined>(() => {
    const base = query.data;
    if (!base) return undefined;
    if (!profile.enrolled || profile.startWeightKg == null) return base;

    const unit = profile.weightUnit;
    const startKg = profile.startWeightKg;
    const currentKg = profile.latestWeightKg ?? startKg;
    const rec = profile.recommendation;

    const dayNumber = profile.challengeStartDate
      ? challengeDayNumber(profile.challengeStartDate, todayISODate(), profile.challengeLengthDays)
      : 1;

    // Calorie target: real recommendation, or maintenance ceiling for safe-review users.
    const target =
      rec?.calorieTarget ?? rec?.maintenanceRangeKcal.high ?? base.today.calories.target;
    const consumed = base.today.calories.consumed; // dev placeholder until tracking (Phase 3)

    return {
      ...base,
      challenge: {
        name: profile.challengeName ?? base.challenge.name,
        dayNumber,
        totalDays: profile.challengeLengthDays,
      },
      greetingName: profile.firstName ?? base.greetingName,
      // A brand-new challenger genuinely has no streak/score history yet.
      streakDays: 0,
      today: {
        ...base.today,
        score: 0,
        calories: { consumed, target, remaining: Math.max(target - consumed, 0) },
        weight: {
          currentDisplay: round(kgToDisplay(currentKg, unit), 1),
          unit,
          totalChange: buildWeightDelta(startKg, currentKg, unit),
        },
      },
    };
  }, [query.data, profile]);

  return { ...query, data };
}
