/** Weight statistics — pure functions over canonical kg values. */
import type { Delta, WeightUnit } from '@challenge42/types';
import { kgToDisplay, round } from './units';

export interface WeightPoint {
  readonly weightKg: number;
  /** Epoch milliseconds. Caller converts ISO → ms so this module stays clock/parse-free. */
  readonly measuredAtMs: number;
}

/** Total change from start to current, in kg (negative = loss). */
export function totalChangeKg(startKg: number, currentKg: number): number {
  return currentKg - startKg;
}

/** Fractional change from start (e.g. -0.034 = 3.4% loss). Guards divide-by-zero. */
export function pctChange(startKg: number, currentKg: number): number {
  if (startKg <= 0) return 0;
  return (currentKg - startKg) / startKg;
}

/**
 * Build a direction-aware Delta for display. `value` is the absolute magnitude in the user's unit;
 * `direction` is 'down' for a loss (the common healthy case), 'up' for a gain.
 */
export function buildWeightDelta(startKg: number, currentKg: number, unit: WeightUnit): Delta {
  const diffDisplay = kgToDisplay(currentKg, unit) - kgToDisplay(startKg, unit);
  const direction: Delta['direction'] = diffDisplay < 0 ? 'down' : diffDisplay > 0 ? 'up' : 'none';
  return { value: round(Math.abs(diffDisplay), 1), direction };
}

/**
 * Weekly averages bucketed into 7-day windows from the earliest measurement. Returns one row per
 * week that has data, in chronological order. Useful for the trend chart and weekly-average UI.
 */
export interface WeeklyAverage {
  readonly weekIndex: number; // 0-based from the first measurement
  readonly averageKg: number;
  readonly count: number;
}

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

export function weeklyAverages(points: readonly WeightPoint[]): WeeklyAverage[] {
  if (points.length === 0) return [];
  const sorted = [...points].sort((a, b) => a.measuredAtMs - b.measuredAtMs);
  const origin = sorted[0]!.measuredAtMs;
  const buckets = new Map<number, { sum: number; count: number }>();
  for (const p of sorted) {
    const weekIndex = Math.floor((p.measuredAtMs - origin) / MS_PER_WEEK);
    const bucket = buckets.get(weekIndex) ?? { sum: 0, count: 0 };
    bucket.sum += p.weightKg;
    bucket.count += 1;
    buckets.set(weekIndex, bucket);
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([weekIndex, { sum, count }]) => ({
      weekIndex,
      averageKg: round(sum / count, 2),
      count,
    }));
}

/** Simple trend from weekly averages: comparing the latest week to the previous one. */
export type WeightTrend = 'down' | 'up' | 'flat' | 'insufficient_data';

export function weightTrend(points: readonly WeightPoint[]): WeightTrend {
  const weeks = weeklyAverages(points);
  if (weeks.length < 2) return 'insufficient_data';
  const latest = weeks[weeks.length - 1]!.averageKg;
  const prev = weeks[weeks.length - 2]!.averageKg;
  const diff = latest - prev;
  if (Math.abs(diff) < 0.1) return 'flat';
  return diff < 0 ? 'down' : 'up';
}

/**
 * Exponentially-weighted moving average ("trend weight" — the Hacker's Diet / Trendweight approach).
 * This is what we headline instead of the raw daily reading, so day-to-day water-weight swings don't
 * cause distress and skipping a day never matters. `alpha` is the smoothing factor (0–1); lower =
 * smoother. Default 0.1.
 */
export interface TrendPoint {
  readonly measuredAtMs: number;
  readonly trendKg: number;
}

export function trendSeries(points: readonly WeightPoint[], alpha = 0.1): TrendPoint[] {
  if (points.length === 0) return [];
  const a = Math.min(Math.max(alpha, 0.01), 1);
  const sorted = [...points].sort((p, q) => p.measuredAtMs - q.measuredAtMs);
  let trend: number | null = null;
  return sorted.map((p) => {
    trend = trend === null ? p.weightKg : trend + a * (p.weightKg - trend);
    return { measuredAtMs: p.measuredAtMs, trendKg: round(trend, 2) };
  });
}

/** The current trend-weight (smoothed), or null with no data. */
export function latestTrendKg(points: readonly WeightPoint[], alpha = 0.1): number | null {
  const series = trendSeries(points, alpha);
  return series.length > 0 ? series[series.length - 1]!.trendKg : null;
}

/** The most recent raw reading, or null. */
export function latestRawKg(points: readonly WeightPoint[]): number | null {
  if (points.length === 0) return null;
  return [...points].sort((p, q) => p.measuredAtMs - q.measuredAtMs)[points.length - 1]!.weightKg;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface DailyWeightPoint {
  readonly day: number; // 1-based challenge day
  readonly weightKg: number;
  readonly hasReading: boolean; // false when carried forward from a prior day
}

/**
 * A day-by-day weight series for the 42-day journey chart. Missing days **carry forward** the last
 * known weight (LOCF), seeded with the starting weight — so a skipped weigh-in never breaks the line
 * (per product decision). Runs from day 1 through the current challenge day.
 */
export function buildDailySeries(params: {
  startKg: number;
  startDateMs: number;
  totalDays: number;
  todayMs: number;
  points: readonly WeightPoint[];
}): DailyWeightPoint[] {
  const { startKg, startDateMs, totalDays, todayMs, points } = params;
  const currentDay = Math.min(
    Math.max(Math.floor((todayMs - startDateMs) / MS_PER_DAY) + 1, 1),
    totalDays,
  );
  const sorted = [...points].sort((p, q) => p.measuredAtMs - q.measuredAtMs);

  const result: DailyWeightPoint[] = [];
  let last = startKg;
  let idx = 0;
  for (let day = 1; day <= currentDay; day += 1) {
    const dayStart = startDateMs + (day - 1) * MS_PER_DAY;
    const dayEnd = startDateMs + day * MS_PER_DAY;
    let hasReading = false;
    while (idx < sorted.length && sorted[idx]!.measuredAtMs < dayEnd) {
      last = sorted[idx]!.weightKg;
      if (sorted[idx]!.measuredAtMs >= dayStart) hasReading = true;
      idx += 1;
    }
    result.push({ day, weightKg: last, hasReading });
  }
  return result;
}
