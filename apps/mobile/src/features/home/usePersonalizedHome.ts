/**
 * Personalized Home: real user data (name, challenge day, weight, calorie/protein targets) merged
 * with the Phase-One dev adapters for pulse / team / plan / rank (those become real in later phases).
 * The seam is the same `HomeSnapshot` contract, so nothing downstream changes.
 */
import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { buildWeightDelta, challengeDayNumber, kgToDisplay, round } from '@challenge42/domain';
import type { HomeSnapshot } from '@challenge42/types';
import { useHomeSnapshot } from './useHomeSnapshot';
import { useProfileStore } from '@/features/profile/profileStore';
import { useFoodLogStore, todayFoodTotals } from '@/features/tracking/foodLogStore';
import { useChallengeStore } from '@/features/challenge/challengeStore';

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function usePersonalizedHome() {
  const query = useHomeSnapshot();
  // useShallow: this selector builds a new object each call, so without shallow equality Zustand
  // would re-render on every render → "Maximum update depth exceeded".
  const profile = useProfileStore(
    useShallow((s) => ({
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
    })),
  );

  const foodEntries = useFoodLogStore((s) => s.entries);
  // The shared, admin-set challenge window wins over the per-user enrollment date when present.
  const globalStart = useChallengeStore((s) => s.startDate);
  const globalLength = useChallengeStore((s) => s.lengthDays);

  const data = useMemo<HomeSnapshot | undefined>(() => {
    const base = query.data;
    if (!base) return undefined;
    if (!profile.enrolled || profile.startWeightKg == null) return base;

    const unit = profile.weightUnit;
    const startKg = profile.startWeightKg;
    const currentKg = profile.latestWeightKg ?? startKg;
    const rec = profile.recommendation;

    const effStart = globalStart ?? profile.challengeStartDate;
    const totalDays = globalStart ? globalLength : profile.challengeLengthDays;
    const dayNumber = effStart ? challengeDayNumber(effStart, todayISODate(), totalDays) : 1;

    // Calorie target: real recommendation, or maintenance ceiling for safe-review users.
    const target =
      rec?.calorieTarget ?? rec?.maintenanceRangeKcal.high ?? base.today.calories.target;
    // Consumed = today's real food log.
    const consumed = todayFoodTotals(foodEntries, Date.now()).calories;

    return {
      ...base,
      challenge: {
        name: profile.challengeName ?? base.challenge.name,
        dayNumber,
        totalDays,
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
  }, [query.data, profile, foodEntries, globalStart, globalLength]);

  return { ...query, data };
}
