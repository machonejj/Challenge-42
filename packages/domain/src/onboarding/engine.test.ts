import { describe, it, expect } from 'vitest';
import { ONBOARDING_STEPS } from '@challenge42/config';
import type {
  OnboardingAnswers,
  OnboardingStepDef,
  TargetRecommendation,
} from '@challenge42/types';
import {
  deriveSafetyFlags,
  buildTargetInput,
  visibleSteps,
  canAdvance,
  progressFor,
  nextStepId,
  prevStepId,
  resumeStepId,
  isOnboardingComplete,
  buildChallengeStartSnapshot,
} from './engine';

const fixture: OnboardingStepDef[] = [
  { id: 'name', section: 'basics', kind: 'text', key: 'firstName', title: '', required: true },
  {
    id: 'age',
    section: 'basics',
    kind: 'number',
    key: 'age',
    title: '',
    min: 16,
    max: 100,
    required: true,
  },
  {
    id: 'isParent',
    section: 'household',
    kind: 'boolean',
    key: 'isParent',
    title: '',
    required: true,
  },
  {
    id: 'kids',
    section: 'household',
    kind: 'number',
    key: 'childrenCount',
    title: '',
    required: true,
    condition: (a) => a.isParent === true,
  },
  {
    id: 'barriers',
    section: 'household',
    kind: 'multi_select',
    key: 'eatingBarriers',
    title: '',
    required: true,
    minSelect: 1,
  },
  { id: 'motiv', section: 'goal', kind: 'longtext', key: 'motivation', title: '', required: false },
  { id: 'outro', section: 'baseline', kind: 'info', title: '' },
];

describe('deriveSafetyFlags', () => {
  it('maps each answer to its flag', () => {
    expect(deriveSafetyFlags({ isPregnant: true })).toEqual(['PREGNANT']);
    expect(deriveSafetyFlags({ eatingDisorderHistory: true })).toEqual([
      'EATING_DISORDER_SAFETY_FLAG',
    ]);
    expect(deriveSafetyFlags({ hasHealthConditions: true })).toEqual([
      'CLINICAL_REVIEW_RECOMMENDED',
    ]);
    expect(deriveSafetyFlags({ underMedicalCare: true })).toEqual(['CLINICAL_REVIEW_RECOMMENDED']);
    expect(deriveSafetyFlags({})).toEqual([]);
  });
});

describe('buildTargetInput', () => {
  it('returns null when required fields are missing', () => {
    expect(buildTargetInput({ firstName: 'Jo' })).toBeNull();
  });
  it('builds input and maps time available + flags', () => {
    const input = buildTargetInput({
      age: 34,
      heightCm: 165,
      currentWeightKg: 78,
      sex: 'female',
      activityLevel: 'light',
      primaryGoal: 'lose_weight',
      timeAvailable: '45_plus',
      isBreastfeeding: true,
    });
    expect(input).not.toBeNull();
    expect(input!.timeAvailableMinutes).toBe(45);
    expect(input!.safetyFlags).toEqual(['BREASTFEEDING']);
  });
  it('maps "varies" time to null', () => {
    const input = buildTargetInput({
      age: 34,
      heightCm: 165,
      currentWeightKg: 78,
      sex: 'female',
      activityLevel: 'light',
      primaryGoal: 'lose_weight',
      timeAvailable: 'varies',
    });
    expect(input!.timeAvailableMinutes).toBeNull();
  });
});

describe('visibility & completeness', () => {
  it('hides conditional steps that do not apply', () => {
    expect(visibleSteps(fixture, { isParent: false }).map((s) => s.id)).not.toContain('kids');
    expect(visibleSteps(fixture, { isParent: true }).map((s) => s.id)).toContain('kids');
  });
  it('canAdvance enforces required rules per kind', () => {
    const name = fixture[0]!;
    expect(canAdvance(name, {})).toBe(false);
    expect(canAdvance(name, { firstName: '  ' })).toBe(false);
    expect(canAdvance(name, { firstName: 'Jo' })).toBe(true);

    const age = fixture[1]!;
    expect(canAdvance(age, { age: 12 })).toBe(false); // below min
    expect(canAdvance(age, { age: 34 })).toBe(true);

    const barriers = fixture[4]!;
    expect(canAdvance(barriers, { eatingBarriers: [] })).toBe(false);
    expect(canAdvance(barriers, { eatingBarriers: ['no_time'] })).toBe(true);

    const motiv = fixture[5]!; // optional
    expect(canAdvance(motiv, {})).toBe(true);

    const info = fixture[6]!;
    expect(canAdvance(info, {})).toBe(true);
  });
});

describe('navigation, progress, resume', () => {
  const answers: OnboardingAnswers = { isParent: false };
  it('progress uses visible-step count', () => {
    const p = progressFor(fixture, answers, 'age');
    expect(p.total).toBe(6); // 7 minus the hidden "kids"
    expect(p.index).toBe(2);
  });
  it('next/prev skip hidden steps', () => {
    expect(nextStepId(fixture, answers, 'isParent')).toBe('barriers'); // "kids" hidden
    expect(prevStepId(fixture, answers, 'barriers')).toBe('isParent');
  });
  it('resume prefers a valid persisted step', () => {
    expect(resumeStepId(fixture, answers, 'barriers')).toBe('barriers');
  });
  it('resume falls back to first unanswered required step', () => {
    expect(resumeStepId(fixture, { isParent: false, firstName: 'Jo' }, null)).toBe('age');
  });
  it('resume ignores a persisted step that is no longer visible', () => {
    // "kids" was answered then user changed isParent to false → not visible; resume elsewhere.
    expect(resumeStepId(fixture, { isParent: false }, 'kids')).toBe('name');
  });
});

describe('isOnboardingComplete', () => {
  it('is false until all visible required steps pass', () => {
    expect(isOnboardingComplete(fixture, { isParent: false })).toBe(false);
    expect(
      isOnboardingComplete(fixture, {
        firstName: 'Jo',
        age: 34,
        isParent: false,
        eatingBarriers: ['no_time'],
      }),
    ).toBe(true);
  });
});

describe('real config: household steps hidden for non-parents', () => {
  it('excludes childrenCount when not a parent', () => {
    const ids = visibleSteps(ONBOARDING_STEPS, { isParent: false }).map((s) => s.id);
    expect(ids).not.toContain('childrenCount');
    expect(ids).toContain('cookForCount'); // non-conditional household step still shows
  });
});

describe('buildChallengeStartSnapshot', () => {
  const rec: TargetRecommendation = {
    status: 'STANDARD_AUTOMATED_PLAN_ELIGIBLE',
    safetyFlags: [],
    maintenanceRangeKcal: { low: 2100, high: 2300 },
    calorieTarget: 1900,
    calorieTargetRangeKcal: { low: 1800, high: 2000 },
    proteinTargetG: 160,
    movement: { dailySteps: 8000, sessionsPerWeek: 3 },
    weightLossRangeKg: { low: 2.4, high: 4.5 },
    primaryFocus: 'Build 90%+ consistency',
    explanation: 'x',
    assumptions: [],
    engineVersion: 'target-engine@1.0.0',
  };

  it('captures baseline + targets and is immutable against later answer edits', () => {
    const answers: OnboardingAnswers = {
      currentWeightKg: 100,
      goalWeightKg: 82,
      weightUnit: 'lb',
      primaryGoal: 'lose_weight',
      secondaryGoals: ['improve_energy'],
      motivation: 'For my kids',
      confidenceCompletion: 8,
      habitSatisfaction: 4,
      foodControl: 5,
      exerciseConsistency: 3,
    };
    const snap = buildChallengeStartSnapshot({
      id: 'snap-1',
      challengeId: 'ch-1',
      challengeMemberId: 'm-1',
      userId: 'u-1',
      answers,
      recommendation: rec,
      createdAt: '2026-01-05T00:00:00Z',
      onboardingVersion: 'onboarding@1.0.0',
      challengeRulesVersion: 'challenge-rules@1.0.0',
    });

    expect(snap.start_weight_kg).toBe(100);
    expect(snap.calorie_target).toBe(1900);
    expect(snap.baseline.confidenceCompletion).toBe(8);
    expect(snap.primary_motivation).toBe('For my kids');
    expect(snap.target_engine_version).toBe('target-engine@1.0.0');

    // Mutating the source answers must not change the historical snapshot.
    answers.secondaryGoals!.push('lose_weight');
    answers.currentWeightKg = 95;
    expect(snap.secondary_goals).toEqual(['improve_energy']);
    expect(snap.start_weight_kg).toBe(100);
  });
});
