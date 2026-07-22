/**
 * Product constants — tunable numbers that encode product policy. Kept out of `domain` so the
 * algorithm (in `packages/domain`) stays pure and the policy knobs live in one reviewable place.
 */

/**
 * Scoring configuration. The daily score is 0–100, summed from capped components, each satisfiable
 * by a *healthy* action. See `docs/DATA_MODEL.md` §6 and `packages/domain/src/scoring.ts`.
 *
 * SAFETY INVARIANT: no component can be increased by eating less, weighing more often, or
 * exercising to excess. Undereating scores the SAME as overeating (zero for "in range").
 */
export const SCORING = {
  /** Max points per daily component. Must sum to `maxDailyScore`. */
  components: {
    loggedFood: 25, // engagement: logged intake at all (not "ate little")
    caloriesInRange: 20, // within a healthy band around target — symmetric
    completedPlanMeals: 20, // completing planned meals (up to planned count)
    movement: 20, // any qualifying activity (capped — more is NOT more)
    weighInWhenDue: 5, // a weigh-in only when the weekly cadence says one is due
    dailyCheckin: 10, // simple daily check-in
  },
  maxDailyScore: 100,

  /** A day "counts as done" (for streaks / consistency) at or above this score. */
  dayCompleteThreshold: 60,
  /** Streak increments on days scoring at/above this (same as complete threshold by default). */
  streakThreshold: 60,

  /** Healthy calorie band around the user's target. Symmetric intent; see safety invariant. */
  calorieBand: {
    underTolerance: 0.12, // eating up to 12% under target still counts as "in range"
    overTolerance: 0.12, // eating up to 12% over target still counts as "in range"
  },

  /** Movement is capped: one qualifying session earns full points; extra sessions add nothing. */
  movement: {
    qualifyingMinutes: 15, // a session must be at least this long to qualify
    fullCreditSessions: 1, // sessions beyond this add ZERO (anti-over-exercise)
  },
} as const;

/**
 * Health guardrails used to flag (never reward) unsafe patterns. These do not gate the product;
 * they inform conservative target calculation and warning surfaces.
 */
export const HEALTH_GUARDRAILS = {
  /** Absolute lower bound for any computed calorie target (adult general safety floor). */
  minCalorieTargetFloor: 1200,
  /** We never *recommend* a deficit implying more than this fraction of body weight lost per week. */
  maxRecommendedWeeklyLossPct: 0.01, // ~1% of body weight / week
  /** Weigh-in cadence we encourage — weekly, not daily (avoids unhealthy fixation). */
  weighInCadenceDays: 7,
} as const;

/** Team scoring policy: teams compete on a per-capita basis so size never decides the winner. */
export const TEAM_SCORING = {
  mode: 'average', // 'average' member score, not 'sum'
} as const;

/** Canonical activity types (mirror `activity_types` reference table). */
export const ACTIVITY_TYPES = [
  { key: 'run', label: 'Run', emoji: '🏃', colorKey: 'running', presence: 'RUNNING' },
  { key: 'walk', label: 'Walk', emoji: '🚶', colorKey: 'walking', presence: 'WALKING' },
  { key: 'strength', label: 'Strength', emoji: '💪', colorKey: 'workout', presence: 'WORKING_OUT' },
  { key: 'cycling', label: 'Cycling', emoji: '🚴', colorKey: 'cycling', presence: 'CYCLING' },
  {
    key: 'yoga',
    label: 'Yoga / Mobility',
    emoji: '🧘',
    colorKey: 'yoga',
    presence: 'OTHER_ACTIVITY',
  },
  { key: 'hiit', label: 'HIIT', emoji: '🔥', colorKey: 'hiit', presence: 'WORKING_OUT' },
  { key: 'sports', label: 'Sports', emoji: '⚽', colorKey: 'sports', presence: 'OTHER_ACTIVITY' },
  { key: 'other', label: 'Other', emoji: '✨', colorKey: 'other', presence: 'OTHER_ACTIVITY' },
] as const;

/** Cheer reactions available on live activities. */
export const CHEERS = ['🔥', '💪', '👏', '🚀'] as const;

/** Map visibility modes (mirror `user_locations.visibility`). Exact GPS is never an option. */
export const MAP_VISIBILITY = ['hidden', 'city', 'approximate'] as const;

/** Feature flags — Phase One ships Home; the rest are architected but gated off. */
export const FEATURE_FLAGS = {
  home: true,
  liveLeaderboard: false,
  liveMap: false,
  liveFeed: false,
  tracking: false,
  mealPlans: false,
  community: false,
  successGallery: false,
  realtimePresence: false,
} as const;

/**
 * Data source selection. Phase One runs entirely on the `mock` source (labeled seed data), so the
 * app needs no secrets. Later phases switch to `supabase` behind the same repository interfaces.
 */
export const DATA_SOURCE = {
  mode: (process.env.EXPO_PUBLIC_DATA_SOURCE ?? process.env.APP_ENV ?? 'mock') as
    'mock' | 'supabase',
} as const;

export type ActivityTypeKey = (typeof ACTIVITY_TYPES)[number]['key'];
export type Cheer = (typeof CHEERS)[number];
export type MapVisibility = (typeof MAP_VISIBILITY)[number];
