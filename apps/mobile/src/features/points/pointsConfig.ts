/**
 * Point values — a pure module (no store imports) so any store can award points without an import
 * cycle. usePoints() and the celebration read from here.
 */
export const POINTS = {
  food: 3, // per food logged
  weighIn: 10, // per weigh-in
  per15MinActivity: 5, // 5 points per 15 minutes of activity
  per1000Steps: 5, // per 1,000 steps
} as const;

/** Points for one activity: 5 per 15 minutes, with a 1-point floor so short bursts still count. */
export function activityPoints(durationMin: number): number {
  return Math.max(1, Math.round((durationMin / 15) * POINTS.per15MinActivity));
}
