import type { ActivityTypeKey } from '@challenge42/types';

export interface QuickActivity {
  label: string;
  type: ActivityTypeKey;
  durationMin: number;
  emoji: string;
}

/** One-tap activity presets — short bursts that count without the timer. */
export const QUICK_ADDS: QuickActivity[] = [
  { label: '1 mile walk', type: 'walk', durationMin: 18, emoji: '🚶' },
  { label: '1 mile run', type: 'run', durationMin: 10, emoji: '🏃' },
  { label: '25 push-ups', type: 'strength', durationMin: 3, emoji: '💪' },
  { label: '10 burpees', type: 'hiit', durationMin: 2, emoji: '🔥' },
  { label: '50 squats', type: 'strength', durationMin: 3, emoji: '🦵' },
  { label: '1 min plank', type: 'strength', durationMin: 1, emoji: '🧘' },
];
