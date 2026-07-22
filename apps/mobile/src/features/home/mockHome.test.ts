import { describe, it, expect } from 'vitest';
import { buildHomeSnapshot } from './mockHome';

/**
 * Smoke test for the Home dev seed. Validates the data contract the UI relies on (and that seeded
 * content is honestly labeled), without a full React Native render harness.
 */
describe('buildHomeSnapshot (dev seed)', () => {
  it('is labeled demo data', () => {
    expect(buildHomeSnapshot().isDemo).toBe(true);
  });

  it('keeps calories internally consistent (remaining = target - consumed)', () => {
    const s = buildHomeSnapshot();
    expect(s.today.calories.remaining).toBe(s.today.calories.target - s.today.calories.consumed);
  });

  it('provides a full four-slot plan in order', () => {
    const slots = buildHomeSnapshot().plan.map((m) => m.slot);
    expect(slots).toEqual(['breakfast', 'lunch', 'dinner', 'snack']);
  });

  it('has live activity and a bounded score', () => {
    const s = buildHomeSnapshot();
    expect(s.pulse.liveActivity.length).toBeGreaterThan(0);
    expect(s.today.score).toBeGreaterThanOrEqual(0);
    expect(s.today.score).toBeLessThanOrEqual(s.today.scoreMax);
  });
});
