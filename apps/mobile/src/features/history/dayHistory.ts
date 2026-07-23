/**
 * Aggregates everything logged (calories, weigh-ins, steps, activities) into a per-day index so the
 * calendar can dot each day and show its detail. Reads the local stores (which are the synced source
 * of truth), keyed by local date (YYYY-MM-DD).
 */
import { useMemo } from 'react';
import { useFoodLogStore } from '@/features/tracking/foodLogStore';
import { useWeightStore } from '@/features/tracking/weightStore';
import { useStepsStore } from '@/features/tracking/stepsStore';
import { useActivityStore } from '@/features/activity/activityStore';

export interface DayActivity {
  title: string;
  type: string;
  durationMin: number;
}

export interface DayData {
  calories: number;
  proteinG: number;
  weightKg: number | null;
  weightAtMs: number;
  steps: number;
  activities: DayActivity[];
  hasFood: boolean;
  hasWeight: boolean;
  hasSteps: boolean;
  hasActivity: boolean;
}

function blank(): DayData {
  return {
    calories: 0,
    proteinG: 0,
    weightKg: null,
    weightAtMs: 0,
    steps: 0,
    activities: [],
    hasFood: false,
    hasWeight: false,
    hasSteps: false,
    hasActivity: false,
  };
}

/** Local date key, e.g. 2026-07-23. Matches keyForYMD below. */
export function dateKey(ms: number): string {
  const d = new Date(ms);
  return keyForYMD(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Build a key from a year, 0-based month, and day. */
export function keyForYMD(year: number, month0: number, day: number): string {
  const m = `${month0 + 1}`.padStart(2, '0');
  const dd = `${day}`.padStart(2, '0');
  return `${year}-${m}-${dd}`;
}

export type DayIndex = Map<string, DayData>;

export function useHistory(): DayIndex {
  const food = useFoodLogStore((s) => s.entries);
  const weight = useWeightStore((s) => s.entries);
  const steps = useStepsStore((s) => s.entries);
  const activities = useActivityStore((s) => s.sessions);

  return useMemo(() => {
    const map: DayIndex = new Map();
    const ensure = (k: string): DayData => {
      let d = map.get(k);
      if (!d) {
        d = blank();
        map.set(k, d);
      }
      return d;
    };

    for (const e of food) {
      const d = ensure(dateKey(e.atMs));
      d.calories += e.calories;
      d.proteinG += e.proteinG;
      d.hasFood = true;
    }
    for (const e of weight) {
      const d = ensure(dateKey(e.measuredAtMs));
      if (e.measuredAtMs >= d.weightAtMs) {
        d.weightKg = e.weightKg; // latest reading that day wins
        d.weightAtMs = e.measuredAtMs;
      }
      d.hasWeight = true;
    }
    for (const e of steps) {
      const d = ensure(dateKey(e.atMs));
      d.steps += e.steps;
      d.hasSteps = true;
    }
    for (const s of activities) {
      const d = ensure(dateKey(s.completedAtMs));
      d.activities.push({
        title: s.title ?? s.type,
        type: s.type,
        durationMin: s.durationMin,
      });
      d.hasActivity = true;
    }
    return map;
  }, [food, weight, steps, activities]);
}
