/** DEV seed for the Live leaderboard teaser (demo data). Ranks on the consistency-weighted score. */
import type { LeaderboardEntry } from '@challenge42/types';

export const mockTopLeaders: readonly LeaderboardEntry[] = [
  {
    rank: 1,
    previous_rank: 2,
    challenge_member_id: 'demo-lb-1',
    display_name: 'Priya N.',
    avatar_url: null,
    team_name: 'Team Cedar',
    points: 861,
    current_streak: 17,
    category: 'overall',
    is_current_user: false,
  },
  {
    rank: 2,
    previous_rank: 1,
    challenge_member_id: 'demo-lb-2',
    display_name: 'Anthony D.',
    avatar_url: null,
    team_name: 'Team Birch',
    points: 848,
    current_streak: 16,
    category: 'overall',
    is_current_user: false,
  },
  {
    rank: 3,
    previous_rank: 5,
    challenge_member_id: 'demo-lb-3',
    display_name: 'Sarah L.',
    avatar_url: null,
    team_name: 'Team Pine',
    points: 833,
    current_streak: 15,
    category: 'overall',
    is_current_user: false,
  },
];

export const mockCurrentUserEntry: LeaderboardEntry = {
  rank: 37,
  previous_rank: 45,
  challenge_member_id: 'demo-lb-me',
  display_name: 'Jake M.',
  avatar_url: null,
  team_name: 'Team Pine',
  points: 612,
  current_streak: 14,
  category: 'overall',
  is_current_user: true,
};
