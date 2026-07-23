/**
 * DEMO seed — 10 fictional challengers so the leaderboard, map, and community counters look
 * populated while the pilot fills up. Client-side only (never written to the database), and merged
 * in alongside the real signed-in user. Delete this file + its imports to remove them.
 */
export interface DemoPerson {
  id: string;
  name: string;
  state: string;
  avatarUrl: string;
  pctLost: number;
  lbsLost: number;
  steps: number;
  activeMin: number;
  meals: number;
  activeRecent: boolean;
}

const raw: Omit<DemoPerson, 'id' | 'avatarUrl' | 'activeMin'>[] = [
  {
    name: 'Marcus T.',
    state: 'TX',
    pctLost: 5.1,
    lbsLost: 11.2,
    steps: 12400,
    meals: 18,
    activeRecent: true,
  },
  {
    name: 'Priya N.',
    state: 'CA',
    pctLost: 4.6,
    lbsLost: 8.4,
    steps: 9800,
    meals: 22,
    activeRecent: true,
  },
  {
    name: 'Sarah L.',
    state: 'NY',
    pctLost: 4.2,
    lbsLost: 9.1,
    steps: 8600,
    meals: 15,
    activeRecent: true,
  },
  {
    name: 'Diego R.',
    state: 'FL',
    pctLost: 3.9,
    lbsLost: 7.8,
    steps: 11200,
    meals: 20,
    activeRecent: false,
  },
  {
    name: 'Emma W.',
    state: 'WA',
    pctLost: 3.5,
    lbsLost: 6.2,
    steps: 10500,
    meals: 12,
    activeRecent: true,
  },
  {
    name: 'Jamal K.',
    state: 'GA',
    pctLost: 3.1,
    lbsLost: 6.8,
    steps: 7400,
    meals: 16,
    activeRecent: true,
  },
  {
    name: 'Lena M.',
    state: 'IL',
    pctLost: 2.8,
    lbsLost: 5.0,
    steps: 9100,
    meals: 14,
    activeRecent: false,
  },
  {
    name: 'Tyler B.',
    state: 'CO',
    pctLost: 2.4,
    lbsLost: 4.9,
    steps: 13800,
    meals: 10,
    activeRecent: true,
  },
  {
    name: 'Aisha H.',
    state: 'MI',
    pctLost: 1.9,
    lbsLost: 3.6,
    steps: 6800,
    meals: 19,
    activeRecent: true,
  },
  {
    name: 'Noah P.',
    state: 'AZ',
    pctLost: 1.2,
    lbsLost: 2.5,
    steps: 8200,
    meals: 8,
    activeRecent: false,
  },
];

const AVATAR_IMG = [12, 5, 9, 32, 20, 47, 33, 3, 25, 11];
const ACTIVE_MIN = [45, 30, 20, 60, 25, 40, 15, 55, 35, 10];

export const DEMO_PEOPLE: DemoPerson[] = raw.map((p, i) => ({
  ...p,
  id: `demo-${i}`,
  avatarUrl: `https://i.pravatar.cc/200?img=${AVATAR_IMG[i]}`,
  activeMin: ACTIVE_MIN[i] ?? 0,
}));

export const DEMO_TOTALS = {
  lbsLost: DEMO_PEOPLE.reduce((s, p) => s + p.lbsLost, 0),
  steps: DEMO_PEOPLE.reduce((s, p) => s + p.steps, 0),
  meals: DEMO_PEOPLE.reduce((s, p) => s + p.meals, 0),
  members: DEMO_PEOPLE.length,
};
