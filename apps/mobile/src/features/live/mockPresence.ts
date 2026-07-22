/**
 * DEV seed for the community presence map (demo data). Positions are APPROXIMATE (normalized 0–1 on
 * the stylized US map) — never precise coordinates, matching the privacy rule that location is
 * city-level at most. Real data later projects coarse city lat/lng the same way.
 */
export type SubmissionKind = 'meal' | 'workout' | 'photo' | 'message';

export interface PresenceDot {
  id: string;
  name: string;
  city: string;
  state: string;
  /** Normalized position on the map (0–1). Approximate — city-level, deliberately imprecise. */
  x: number;
  y: number;
  online: boolean;
  submission?: { kind: SubmissionKind; label: string };
}

export const mockPresence: readonly PresenceDot[] = [
  {
    id: 'p1',
    name: 'Jake M.',
    city: 'Palmdale',
    state: 'CA',
    x: 0.12,
    y: 0.6,
    online: true,
    submission: { kind: 'workout', label: '20-min home workout' },
  },
  {
    id: 'p2',
    name: 'Sarah L.',
    city: 'Austin',
    state: 'TX',
    x: 0.52,
    y: 0.78,
    online: true,
    submission: { kind: 'meal', label: 'Sheet-pan chicken & veg' },
  },
  {
    id: 'p3',
    name: 'Mike R.',
    city: 'Denver',
    state: 'CO',
    x: 0.4,
    y: 0.48,
    online: true,
    submission: { kind: 'workout', label: 'Push day' },
  },
  {
    id: 'p4',
    name: 'Jessica P.',
    city: 'Portland',
    state: 'OR',
    x: 0.1,
    y: 0.23,
    online: false,
    submission: { kind: 'meal', label: 'Greek yogurt bowls' },
  },
  {
    id: 'p5',
    name: 'Anthony D.',
    city: 'Chicago',
    state: 'IL',
    x: 0.64,
    y: 0.4,
    online: true,
    submission: { kind: 'photo', label: 'Family taco night' },
  },
  { id: 'p6', name: 'Maria G.', city: 'Miami', state: 'FL', x: 0.88, y: 0.85, online: true },
  {
    id: 'p7',
    name: 'Priya N.',
    city: 'Boston',
    state: 'MA',
    x: 0.89,
    y: 0.3,
    online: false,
    submission: { kind: 'message', label: 'Day 12 — still going!' },
  },
  {
    id: 'p8',
    name: 'David K.',
    city: 'Seattle',
    state: 'WA',
    x: 0.11,
    y: 0.19,
    online: true,
    submission: { kind: 'workout', label: 'Zone 2 ride' },
  },
  { id: 'p9', name: 'Elena R.', city: 'Nashville', state: 'TN', x: 0.68, y: 0.55, online: false },
  {
    id: 'p10',
    name: 'Chris B.',
    city: 'Atlanta',
    state: 'GA',
    x: 0.76,
    y: 0.62,
    online: true,
    submission: { kind: 'meal', label: 'Turkey chili' },
  },
  { id: 'p11', name: 'Nina S.', city: 'San Diego', state: 'CA', x: 0.15, y: 0.67, online: false },
  { id: 'p12', name: 'Tom W.', city: 'New York', state: 'NY', x: 0.85, y: 0.37, online: true },
];

export const SUBMISSION_META: Record<SubmissionKind, { emoji: string; label: string }> = {
  meal: { emoji: '🍽️', label: 'Meal' },
  workout: { emoji: '💪', label: 'Workout' },
  photo: { emoji: '📸', label: 'Photo' },
  message: { emoji: '💬', label: 'Message' },
};
