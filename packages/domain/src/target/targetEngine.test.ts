import { describe, it, expect } from 'vitest';
import { HEALTH_GUARDRAILS, TARGET_ENGINE } from '@challenge42/config';
import type { TargetEngineInput } from '@challenge42/types';
import { recommendTargets, deriveSafetyStatus, basalMetabolicRate } from './targetEngine';

const base: TargetEngineInput = {
  age: 35,
  heightCm: 178,
  currentWeightKg: 100,
  goalWeightKg: 82,
  sex: 'male',
  activityLevel: 'light',
  primaryGoal: 'lose_weight',
  timeAvailableMinutes: 30,
  safetyFlags: [],
};

describe('BMR (Mifflin-St Jeor)', () => {
  it('matches the male formula', () => {
    // 10*100 + 6.25*178 - 5*35 + 5 = 1000 + 1112.5 - 175 + 5 = 1942.5
    expect(basalMetabolicRate('male', 100, 178, 35)).toBeCloseTo(1942.5, 1);
  });
  it("uses the neutral constant for 'unspecified'", () => {
    expect(basalMetabolicRate('unspecified', 100, 178, 35)).toBeCloseTo(1942.5 - 5 - 78, 1);
  });
});

describe('recommendTargets — standard eligible', () => {
  const r = recommendTargets(base);

  it('is eligible with no safety flags', () => {
    expect(r.status).toBe('STANDARD_AUTOMATED_PLAN_ELIGIBLE');
  });

  it('produces a calorie target below maintenance (a real but modest deficit)', () => {
    expect(r.calorieTarget).not.toBeNull();
    const midMaintenance = (r.maintenanceRangeKcal.low + r.maintenanceRangeKcal.high) / 2;
    expect(r.calorieTarget!).toBeLessThan(midMaintenance);
  });

  it('never prescribes below the safety floor', () => {
    expect(r.calorieTarget!).toBeGreaterThanOrEqual(HEALTH_GUARDRAILS.minCalorieTargetFloor);
    expect(r.calorieTarget!).toBeGreaterThanOrEqual(TARGET_ENGINE.calorieFloorBySex.male);
  });

  it('deficit never exceeds the configured cap', () => {
    const midMaintenance = (r.maintenanceRangeKcal.low + r.maintenanceRangeKcal.high) / 2;
    expect(midMaintenance - r.calorieTarget!).toBeLessThanOrEqual(
      TARGET_ENGINE.deficit.capKcal + 25,
    );
  });

  it('gives a protein target and conservative movement', () => {
    expect(r.proteinTargetG).toBe(160); // 1.6 * 100
    expect(r.movement.dailySteps).toBe(8000);
    expect(r.movement.sessionsPerWeek).toBe(3);
  });

  it('provides a conservative 42-day progress range', () => {
    expect(r.weightLossRangeKg).not.toBeNull();
    expect(r.weightLossRangeKg!.low).toBeGreaterThan(0);
    expect(r.weightLossRangeKg!.high).toBeGreaterThan(r.weightLossRangeKg!.low);
    // ~0.4–0.75%/wk over 6 wk on 100kg => ~2.4–4.5 kg
    expect(r.weightLossRangeKg!.high).toBeLessThan(6);
  });

  it('focus is always consistency, not the number', () => {
    expect(r.primaryFocus.toLowerCase()).toContain('consistency');
  });
});

describe('recommendTargets — non-weight-loss goal uses maintenance', () => {
  it('has no deficit and no weight-loss range', () => {
    const r = recommendTargets({ ...base, primaryGoal: 'build_habits' });
    expect(r.weightLossRangeKg).toBeNull();
    const midMaintenance = (r.maintenanceRangeKcal.low + r.maintenanceRangeKcal.high) / 2;
    expect(Math.abs(r.calorieTarget! - midMaintenance)).toBeLessThanOrEqual(25);
  });
});

describe('recommendTargets — sedentary starts with fewer sessions', () => {
  it('recommends 2 sessions for sedentary', () => {
    expect(recommendTargets({ ...base, activityLevel: 'sedentary' }).movement.sessionsPerWeek).toBe(
      2,
    );
  });
});

describe('SAFETY routing', () => {
  it('deriveSafetyStatus flips on any flag', () => {
    expect(deriveSafetyStatus([])).toBe('STANDARD_AUTOMATED_PLAN_ELIGIBLE');
    expect(deriveSafetyStatus(['PREGNANT'])).toBe('SAFE_REVIEW_REQUIRED');
  });

  for (const flag of [
    'PREGNANT',
    'RECENT_POSTPARTUM',
    'BREASTFEEDING',
    'CLINICAL_REVIEW_RECOMMENDED',
  ] as const) {
    it(`${flag}: no calorie target, no deficit, no weight-loss range`, () => {
      const r = recommendTargets({ ...base, safetyFlags: [flag] });
      expect(r.status).toBe('SAFE_REVIEW_REQUIRED');
      expect(r.calorieTarget).toBeNull();
      expect(r.calorieTargetRangeKcal).toBeNull();
      expect(r.weightLossRangeKg).toBeNull();
      expect(r.explanation).toMatch(/personalized approach/i);
    });
  }

  it('EATING_DISORDER flag additionally suppresses protein (all numeric food targets)', () => {
    const r = recommendTargets({ ...base, safetyFlags: ['EATING_DISORDER_SAFETY_FLAG'] });
    expect(r.status).toBe('SAFE_REVIEW_REQUIRED');
    expect(r.calorieTarget).toBeNull();
    expect(r.proteinTargetG).toBeNull();
  });

  it('other safety flags keep protein for general health', () => {
    const r = recommendTargets({ ...base, safetyFlags: ['BREASTFEEDING'] });
    expect(r.proteinTargetG).not.toBeNull();
  });
});
