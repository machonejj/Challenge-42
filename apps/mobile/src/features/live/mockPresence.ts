/**
 * DEV seed for the community presence map (demo data). Dot positions come from real city lon/lat
 * projected through the same Albers-USA projection as the map (see usMapData.ts / scripts/genUsMap),
 * so they land accurately — but they remain APPROXIMATE (city-level), matching the privacy rule that
 * location is never precise.
 */
import { CITY_XY } from './usMapData';

export type SubmissionKind = 'meal' | 'workout' | 'photo' | 'message';

export interface PresenceDot {
  id: string;
  name: string;
  city: string;
  state: string;
  x: number; // 0–1 on the map (projected, city-level)
  y: number;
  online: boolean;
  submission?: { kind: SubmissionKind; label: string };
}

interface DotMeta {
  id: string;
  name: string;
  city: string;
  state: string;
  online: boolean;
  submission?: { kind: SubmissionKind; label: string };
}

const META: readonly DotMeta[] = [
  {
    id: 'p1',
    name: 'Jake M.',
    city: 'Palmdale',
    state: 'CA',
    online: true,
    submission: { kind: 'workout', label: '20-min home workout' },
  },
  {
    id: 'p2',
    name: 'Sarah L.',
    city: 'Austin',
    state: 'TX',
    online: true,
    submission: { kind: 'meal', label: 'Sheet-pan chicken & veg' },
  },
  {
    id: 'p3',
    name: 'Mike R.',
    city: 'Denver',
    state: 'CO',
    online: true,
    submission: { kind: 'workout', label: 'Push day' },
  },
  {
    id: 'p4',
    name: 'Jessica P.',
    city: 'Portland',
    state: 'OR',
    online: false,
    submission: { kind: 'meal', label: 'Greek yogurt bowls' },
  },
  {
    id: 'p5',
    name: 'Anthony D.',
    city: 'Chicago',
    state: 'IL',
    online: true,
    submission: { kind: 'photo', label: 'Family taco night' },
  },
  { id: 'p6', name: 'Maria G.', city: 'Miami', state: 'FL', online: true },
  {
    id: 'p7',
    name: 'Priya N.',
    city: 'Boston',
    state: 'MA',
    online: false,
    submission: { kind: 'message', label: 'Day 12 — still going!' },
  },
  {
    id: 'p8',
    name: 'David K.',
    city: 'Seattle',
    state: 'WA',
    online: true,
    submission: { kind: 'workout', label: 'Zone 2 ride' },
  },
  { id: 'p9', name: 'Elena R.', city: 'Nashville', state: 'TN', online: false },
  {
    id: 'p10',
    name: 'Chris B.',
    city: 'Atlanta',
    state: 'GA',
    online: true,
    submission: { kind: 'meal', label: 'Turkey chili' },
  },
  { id: 'p11', name: 'Nina S.', city: 'San Diego', state: 'CA', online: false },
  { id: 'p12', name: 'Tom W.', city: 'New York', state: 'NY', online: true },
];

export const mockPresence: readonly PresenceDot[] = META.map((m) => ({
  ...m,
  x: CITY_XY[m.id]?.x ?? 0.5,
  y: CITY_XY[m.id]?.y ?? 0.5,
}));

export const SUBMISSION_META: Record<SubmissionKind, { emoji: string; label: string }> = {
  meal: { emoji: '🍽️', label: 'Meal' },
  workout: { emoji: '💪', label: 'Workout' },
  photo: { emoji: '📸', label: 'Photo' },
  message: { emoji: '💬', label: 'Message' },
};
