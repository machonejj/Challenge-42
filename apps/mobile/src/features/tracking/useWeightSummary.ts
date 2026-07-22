import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  buildWeightDelta,
  kgToDisplay,
  latestRawKg,
  latestTrendKg,
  round,
  trendSeries,
} from '@challenge42/domain';
import type { Delta, WeightUnit } from '@challenge42/types';
import { useWeightStore } from './weightStore';
import { useProfileStore } from '@/features/profile/profileStore';

export interface RecentWeighIn {
  id: string;
  display: number;
  measuredAtMs: number;
}

export interface WeightSummary {
  hasData: boolean;
  /** Eating-disorder safety flag → keep weight numbers in the background. */
  numbersHidden: boolean;
  unit: WeightUnit;
  startDisplay: number | null;
  trendDisplay: number | null; // smoothed headline
  rawLatestDisplay: number | null;
  delta: Delta; // trend vs start
  sparkline: number[]; // trend series in display unit
  loggedToday: boolean;
  recent: RecentWeighIn[];
}

function startOfTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function useWeightSummary(): WeightSummary {
  const entries = useWeightStore((s) => s.entries);
  const profile = useProfileStore(
    useShallow((s) => ({
      unit: s.weightUnit,
      startWeightKg: s.startWeightKg,
      edFlag: s.recommendation?.safetyFlags.includes('EATING_DISORDER_SAFETY_FLAG') ?? false,
    })),
  );

  return useMemo<WeightSummary>(() => {
    const unit = profile.unit;
    const startKg = profile.startWeightKg;
    const points = entries.map((e) => ({ weightKg: e.weightKg, measuredAtMs: e.measuredAtMs }));
    const hasData = points.length > 0;

    const trendKg = latestTrendKg(points) ?? startKg ?? null;
    const rawKg = latestRawKg(points);
    const todayStart = startOfTodayMs();

    const delta =
      startKg != null && trendKg != null
        ? buildWeightDelta(startKg, trendKg, unit)
        : ({ value: 0, direction: 'none' } as Delta);

    const recent: RecentWeighIn[] = [...entries]
      .sort((a, b) => b.measuredAtMs - a.measuredAtMs)
      .slice(0, 12)
      .map((e) => ({
        id: e.id,
        display: round(kgToDisplay(e.weightKg, unit), 1),
        measuredAtMs: e.measuredAtMs,
      }));

    return {
      hasData,
      numbersHidden: profile.edFlag,
      unit,
      startDisplay: startKg != null ? round(kgToDisplay(startKg, unit), 1) : null,
      trendDisplay: trendKg != null ? round(kgToDisplay(trendKg, unit), 1) : null,
      rawLatestDisplay: rawKg != null ? round(kgToDisplay(rawKg, unit), 1) : null,
      delta,
      sparkline: trendSeries(points).map((p) => round(kgToDisplay(p.trendKg, unit), 2)),
      loggedToday: entries.some((e) => e.measuredAtMs >= todayStart),
      recent,
    };
  }, [entries, profile]);
}
