/**
 * View-model types for the Home screen. These are *composed read models* (not raw DB rows) — the
 * shape a data source returns for Home. Keeping them explicit lets the mock (Phase One) and the
 * future Supabase source satisfy the exact same contract.
 */
import type { UUID, ISOTimestamp, Delta } from './primitives';
import type { PresenceStatus, MealSlot, WeightUnit } from './enums';

export interface HomeChallengeSummary {
  readonly name: string;
  readonly dayNumber: number; // 1-based day within the challenge
  readonly totalDays: number;
}

export interface HomeCaloriesSummary {
  readonly consumed: number;
  readonly target: number;
  readonly remaining: number;
}

export interface HomeWeightSummary {
  readonly currentDisplay: number; // in the user's display unit
  readonly unit: WeightUnit;
  readonly totalChange: Delta; // total change since start, direction-aware
}

export interface HomeTodaySummary {
  readonly calories: HomeCaloriesSummary;
  readonly weight: HomeWeightSummary;
  readonly score: number; // today's 0–100 score
  readonly scoreMax: number;
}

export interface HomeRankSummary {
  readonly overall: number;
  readonly movement: number; // signed: +8 means moved up 8 places
  readonly pointsToNextTarget: number;
  readonly nextTargetLabel: string; // e.g. "Top 25"
}

/** One live participant row. Deliberately contains NO exact location or route data. */
export interface LiveActivityItem {
  readonly id: UUID;
  readonly displayName: string;
  readonly avatarUrl: string | null;
  readonly status: PresenceStatus;
  readonly title: string; // e.g. "Push Day" or "Morning Run"
  readonly detail: string; // e.g. "2.4 mi" or "18:42 elapsed" — human friendly
  readonly startedAt: ISOTimestamp | null; // for client-side elapsed calc
}

export interface HomePulseSummary {
  readonly activeCount: number;
  readonly workingOutCount: number;
  readonly runningCount: number;
  readonly walkingCount: number;
  readonly plannedMealsLastHour: number;
  readonly liveActivity: readonly LiveActivityItem[];
}

export interface HomeTeamSummary {
  readonly name: string;
  readonly color: string;
  readonly standing: number; // rank among teams
  readonly totalTeams: number;
  readonly onlineCount: number;
  readonly memberCount: number;
  readonly goalLabel: string; // e.g. "Team movement goal"
  readonly goalProgress: number; // 0–1, size-normalized
}

export interface HomePlanMeal {
  readonly slot: MealSlot;
  readonly title: string;
  readonly calories: number;
  readonly proteinG: number;
  readonly completed: boolean;
}

export interface HomeSnapshot {
  readonly challenge: HomeChallengeSummary;
  readonly greetingName: string;
  readonly streakDays: number;
  readonly today: HomeTodaySummary;
  readonly rank: HomeRankSummary;
  readonly pulse: HomePulseSummary;
  readonly team: HomeTeamSummary;
  readonly plan: readonly HomePlanMeal[];
  /** Challenge-wide collective progress — a motivating shared total (not a ranking). */
  readonly collectiveLostLb: number;
  readonly challengerCount: number;
  /** True when backed by labeled development/demo data. Surfaced in the UI. */
  readonly isDemo: boolean;
  readonly generatedAt: ISOTimestamp;
}
