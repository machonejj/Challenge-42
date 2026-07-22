import { describe, it, expect } from 'vitest';
import {
  kgToLb,
  lbToKg,
  kgToDisplay,
  displayToKg,
  metersToMiles,
  formatDuration,
  formatElapsed,
  round,
} from './units';
import { scaleNutrition } from './nutrition/provider';
import { mockNutritionProvider } from './nutrition/mock-provider';

describe('unit conversions', () => {
  it('round-trips kg <-> lb', () => {
    expect(kgToLb(lbToKg(180))).toBeCloseTo(180, 6);
  });
  it('respects the display unit', () => {
    expect(kgToDisplay(100, 'kg')).toBe(100);
    expect(kgToDisplay(100, 'lb')).toBeCloseTo(220.462, 2);
    expect(displayToKg(220.462, 'lb')).toBeCloseTo(100, 2);
  });
  it('converts distance', () => {
    expect(metersToMiles(1609.344)).toBeCloseTo(1, 6);
  });
  it('formats durations', () => {
    expect(formatDuration(512)).toBe('8:32');
    expect(formatDuration(5)).toBe('0:05');
    expect(formatElapsed(3725)).toBe('1:02:05');
    expect(formatElapsed(65)).toBe('1:05');
  });
  it('rounds to decimals', () => {
    expect(round(8.567, 1)).toBe(8.6);
  });
});

describe('nutrition provider (mock)', () => {
  it('scales nutrition by grams', () => {
    const scaled = scaleNutrition(
      {
        providerFoodId: 'x',
        name: 'x',
        brand: null,
        servingLabel: '100 g',
        servingGrams: 100,
        nutrition: { calories: 200, proteinG: 10, carbsG: 20, fatG: 5 },
        source: 'mock',
      },
      50,
    );
    expect(scaled.calories).toBe(100);
    expect(scaled.proteinG).toBe(5);
  });

  it('searches and fetches by id', async () => {
    const results = await mockNutritionProvider.search('chicken');
    expect(results.items.length).toBeGreaterThan(0);
    const first = results.items[0]!;
    const byId = await mockNutritionProvider.getById(first.providerFoodId);
    expect(byId?.name).toBe(first.name);
    expect(byId?.source).toBe('mock'); // never presented as verified data
  });
});
