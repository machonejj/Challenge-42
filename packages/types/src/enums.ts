/** String-union enums that mirror the DB text-enum columns (see DATA_MODEL.md §1.7). */

export type ChallengeStatus = 'upcoming' | 'active' | 'completed' | 'archived';

export type MemberStatus = 'active' | 'paused' | 'withdrawn' | 'completed';

/** Live presence / activity state broadcast via Realtime Presence (never persisted per-tick). */
export type PresenceStatus =
  'OFFLINE' | 'ONLINE' | 'RUNNING' | 'WALKING' | 'WORKING_OUT' | 'CYCLING' | 'OTHER_ACTIVITY';

export type ActivityTypeKey =
  'run' | 'walk' | 'strength' | 'cycling' | 'yoga' | 'hiit' | 'sports' | 'other';

export type ActivitySessionStatus = 'in_progress' | 'completed' | 'discarded';

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type LeaderboardCategory = 'overall' | 'consistency' | 'streak' | 'percent_change' | 'team';

export type FeedEventType =
  | 'milestone'
  | 'activity_completed'
  | 'meal_shared'
  | 'recipe_shared'
  | 'goal_hit'
  | 'day_completed'
  | 'badge_earned'
  | 'team_event';

export type CommunitySection =
  'for_you' | 'wins' | 'meal_ideas' | 'questions' | 'my_team' | 'recipes';

export type ReactionKind = '🔥' | '💪' | '👏' | '🚀' | '❤️' | '👍';

/** Separate consent surfaces — one never implies another (see SECURITY.md §7). */
export type ConsentSurface = 'in_app' | 'public_web' | 'marketing';

export type WeightSource = 'manual' | 'scale' | 'import';

/** Map visibility. Exact GPS is never an option. */
export type MapVisibility = 'hidden' | 'city' | 'approximate';

export type WeightUnit = 'lb' | 'kg';
export type DistanceUnit = 'mi' | 'km';

export type CookingAbility = 'beginner' | 'comfortable' | 'advanced';
