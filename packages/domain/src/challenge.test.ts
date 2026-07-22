import { describe, it, expect } from 'vitest';
import { daysBetween, challengeDayNumber, daysRemaining, isWeighInDue } from './challenge';

describe('challenge calendar math', () => {
  it('daysBetween counts whole days', () => {
    expect(daysBetween('2026-01-01', '2026-01-08')).toBe(7);
    expect(daysBetween('2026-01-08', '2026-01-01')).toBe(-7);
  });

  it('challengeDayNumber is 1-based and clamped', () => {
    expect(challengeDayNumber('2026-01-01', '2026-01-01', 42)).toBe(1);
    expect(challengeDayNumber('2026-01-01', '2026-01-17', 42)).toBe(17);
    expect(challengeDayNumber('2026-01-01', '2025-12-20', 42)).toBe(1); // before start clamps to 1
    expect(challengeDayNumber('2026-01-01', '2026-06-01', 42)).toBe(42); // after end clamps
  });

  it('daysRemaining never goes negative', () => {
    expect(daysRemaining('2026-01-01', '2026-01-17', 42)).toBe(25);
    expect(daysRemaining('2026-01-01', '2026-06-01', 42)).toBe(0);
  });

  it('isWeighInDue follows a weekly cadence from day 1', () => {
    expect(isWeighInDue(1)).toBe(true);
    expect(isWeighInDue(2)).toBe(false);
    expect(isWeighInDue(8)).toBe(true);
    expect(isWeighInDue(15)).toBe(true);
  });
});
