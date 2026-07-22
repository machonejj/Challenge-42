import { describe, it, expect } from 'vitest';
import {
  totalChangeKg,
  pctChange,
  buildWeightDelta,
  weeklyAverages,
  weightTrend,
  trendSeries,
  latestTrendKg,
  latestRawKg,
  buildDailySeries,
} from './weight';
import { lbToKg } from './units';

describe('weight stats', () => {
  it('totalChangeKg is negative for a loss', () => {
    expect(totalChangeKg(120, 116)).toBe(-4);
  });

  it('pctChange guards divide-by-zero and reports fraction', () => {
    expect(pctChange(0, 100)).toBe(0);
    expect(pctChange(100, 96.6)).toBeCloseTo(-0.034);
  });

  it('buildWeightDelta reports magnitude + direction in display unit', () => {
    const startKg = lbToKg(260);
    const currentKg = lbToKg(251.4);
    const delta = buildWeightDelta(startKg, currentKg, 'lb');
    expect(delta.direction).toBe('down');
    expect(delta.value).toBeCloseTo(8.6, 1);
  });

  it('reports "none" when unchanged', () => {
    expect(buildWeightDelta(100, 100, 'kg').direction).toBe('none');
  });
});

const DAY = 24 * 60 * 60 * 1000;

describe('weeklyAverages & trend', () => {
  it('buckets measurements into 7-day windows from the first point', () => {
    const base = 1_700_000_000_000;
    const points = [
      { weightKg: 100, measuredAtMs: base },
      { weightKg: 99, measuredAtMs: base + 2 * DAY },
      { weightKg: 98, measuredAtMs: base + 8 * DAY }, // week 2
    ];
    const weeks = weeklyAverages(points);
    expect(weeks).toHaveLength(2);
    expect(weeks[0]!.averageKg).toBeCloseTo(99.5);
    expect(weeks[1]!.averageKg).toBeCloseTo(98);
  });

  it('trend needs at least two weeks', () => {
    expect(weightTrend([{ weightKg: 100, measuredAtMs: 0 }])).toBe('insufficient_data');
  });

  it('detects a downward trend', () => {
    const base = 1_700_000_000_000;
    const points = [
      { weightKg: 100, measuredAtMs: base },
      { weightKg: 97, measuredAtMs: base + 8 * DAY },
    ];
    expect(weightTrend(points)).toBe('down');
  });
});

describe('trend weight (EWMA)', () => {
  const base = 1_700_000_000_000;
  it('is empty with no data and seeds on the first reading', () => {
    expect(trendSeries([])).toEqual([]);
    expect(latestTrendKg([])).toBeNull();
    expect(latestTrendKg([{ weightKg: 90, measuredAtMs: base }])).toBe(90);
  });

  it('smooths a single-day spike (trend moves only slightly)', () => {
    const points = [
      { weightKg: 90, measuredAtMs: base },
      { weightKg: 90, measuredAtMs: base + DAY },
      { weightKg: 94, measuredAtMs: base + 2 * DAY }, // water-weight spike
    ];
    const trend = latestTrendKg(points, 0.1)!;
    // Raw jumped +4, but the trend barely moves.
    expect(trend).toBeGreaterThan(90);
    expect(trend).toBeLessThan(90.5);
  });

  it('tracks a sustained decline downward but lags the raw value', () => {
    const points = Array.from({ length: 10 }, (_, i) => ({
      weightKg: 100 - i, // steady 1kg/day loss
      measuredAtMs: base + i * DAY,
    }));
    const trend = latestTrendKg(points, 0.1)!;
    expect(trend).toBeLessThan(100); // trending down
    expect(trend).toBeGreaterThan(91); // lags the latest raw (91) — smoothing
    expect(latestRawKg(points)).toBe(91);
  });

  it('is order-independent (sorts by time)', () => {
    const a = latestTrendKg([
      { weightKg: 90, measuredAtMs: base },
      { weightKg: 88, measuredAtMs: base + DAY },
    ]);
    const b = latestTrendKg([
      { weightKg: 88, measuredAtMs: base + DAY },
      { weightKg: 90, measuredAtMs: base },
    ]);
    expect(a).toBe(b);
  });
});

describe('buildDailySeries (carry-forward)', () => {
  const start = 1_700_000_000_000;
  const params = (points: { weightKg: number; measuredAtMs: number }[], todayDay: number) => ({
    startKg: 100,
    startDateMs: start,
    totalDays: 42,
    todayMs: start + (todayDay - 1) * DAY,
    points,
  });

  it('seeds day 1 with the starting weight and runs to the current day', () => {
    const series = buildDailySeries(params([], 5));
    expect(series).toHaveLength(5);
    expect(series[0]).toEqual({ day: 1, weightKg: 100, hasReading: false });
    expect(series.every((p) => p.weightKg === 100)).toBe(true);
  });

  it('carries the last weight forward across missed days', () => {
    const points = [
      { weightKg: 99, measuredAtMs: start + 1 * DAY }, // day 2
      { weightKg: 97, measuredAtMs: start + 4 * DAY }, // day 5
    ];
    const series = buildDailySeries(params(points, 6));
    expect(series.map((p) => p.weightKg)).toEqual([100, 99, 99, 99, 97, 97]);
    expect(series[1]!.hasReading).toBe(true); // day 2 real
    expect(series[2]!.hasReading).toBe(false); // day 3 carried forward
    expect(series[4]!.hasReading).toBe(true); // day 5 real
  });

  it('uses the last reading of a day when multiple are logged', () => {
    const points = [
      { weightKg: 99, measuredAtMs: start + 1 * DAY + 1000 },
      { weightKg: 98.5, measuredAtMs: start + 1 * DAY + 5000 },
    ];
    const series = buildDailySeries(params(points, 2));
    expect(series[1]!.weightKg).toBe(98.5);
  });
});
