/**
 * DEVELOPMENT SEED for the Home screen (clearly labeled demo data — `isDemo: true`).
 *
 * This is the Phase-One data source: it makes Home feel alive with zero backend and zero secrets.
 * It satisfies the exact `HomeSnapshot` contract that the future Supabase source will implement, so
 * swapping in the real backend (Phase 2+) is a data-source change, not a UI change.
 *
 * These are FICTIONAL numbers for development. They are never presented as real production stats.
 */
import type { HomeSnapshot, LiveActivityItem } from '@challenge42/types';

/** ISO timestamp `secondsAgo` before now (app-side; shared domain stays clock-free). */
function secondsAgoIso(secondsAgo: number): string {
  return new Date(Date.now() - secondsAgo * 1000).toISOString();
}

const liveActivity: LiveActivityItem[] = [
  {
    id: 'demo-live-1',
    displayName: 'Sarah L.',
    avatarUrl: null,
    status: 'RUNNING',
    title: 'Morning Run',
    detail: '2.4 mi',
    startedAt: null,
  },
  {
    id: 'demo-live-2',
    displayName: 'Mike R.',
    avatarUrl: null,
    status: 'WORKING_OUT',
    title: 'Push Day',
    detail: 'Upper body',
    startedAt: secondsAgoIso(18 * 60 + 42), // ~18:42 elapsed, ticks live
  },
  {
    id: 'demo-live-3',
    displayName: 'Maria G.',
    avatarUrl: null,
    status: 'WALKING',
    title: 'Evening Walk',
    detail: '1.1 mi',
    startedAt: null,
  },
  {
    id: 'demo-live-4',
    displayName: 'David K.',
    avatarUrl: null,
    status: 'CYCLING',
    title: 'Zone 2 Ride',
    detail: 'Indoor',
    startedAt: secondsAgoIso(41 * 60 + 5),
  },
];

export function buildHomeSnapshot(): HomeSnapshot {
  return {
    challenge: { name: 'Winter Reset', dayNumber: 17, totalDays: 42 },
    greetingName: 'Jake M.',
    streakDays: 14,
    today: {
      calories: { consumed: 1482, target: 2100, remaining: 618 },
      weight: { currentDisplay: 251.4, unit: 'lb', totalChange: { value: 8.6, direction: 'down' } },
      score: 72,
      scoreMax: 100,
    },
    rank: { overall: 37, movement: 8, pointsToNextTarget: 46, nextTargetLabel: 'Top 25' },
    pulse: {
      activeCount: 87,
      workingOutCount: 31,
      runningCount: 12,
      walkingCount: 19,
      plannedMealsLastHour: 27,
      liveActivity,
    },
    team: {
      name: 'Team Pine',
      color: '#12382B',
      standing: 2,
      totalTeams: 8,
      onlineCount: 9,
      memberCount: 14,
      goalLabel: "Today's movement goal",
      goalProgress: 0.64,
    },
    plan: [
      {
        slot: 'breakfast',
        title: 'Protein Breakfast Burrito',
        calories: 480,
        proteinG: 38,
        completed: true,
      },
      { slot: 'lunch', title: 'Chicken Caesar Wrap', calories: 510, proteinG: 40, completed: true },
      {
        slot: 'dinner',
        title: 'Buffalo Chicken Bowls',
        calories: 690,
        proteinG: 48,
        completed: false,
      },
      {
        slot: 'snack',
        title: 'Greek Yogurt Crunch',
        calories: 310,
        proteinG: 24,
        completed: false,
      },
    ],
    collectiveLostLb: 1284,
    challengerCount: 327,
    isDemo: true,
    generatedAt: new Date().toISOString(),
  };
}
