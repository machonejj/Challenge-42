import { describe, it, expect } from 'vitest';
import { totalChangeKg, pctChange, buildWeightDelta, weeklyAverages, weightTrend } from './weight';
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
