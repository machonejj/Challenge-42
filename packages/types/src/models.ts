/**
 * Domain models — TypeScript shapes mirroring core database rows. These are the shared contract
 * between the mobile app, admin app, and edge functions. They intentionally mirror
 * `supabase/migrations/*` and `docs/DATA_MODEL.md`.
 */
import type { UUID, ISODate, ISOTimestamp, Timestamps } from './primitives';
import type {
  ActivitySessionStatus,
  ActivityTypeKey,
  ChallengeStatus,
  CommunitySection,
  ConsentSurface,
  CookingAbility,
  DistanceUnit,
  FeedEventType,
  LeaderboardCategory,
  MapVisibility,
  MealSlot,
  MemberStatus,
  PresenceStatus,
  ReactionKind,
  WeightSource,
  WeightUnit,
} from './enums';

// ---- Identity -------------------------------------------------------------------------------

export interface Profile extends Timestamps {
  readonly id: UUID; // equals auth.users.id
  readonly display_name: string;
  readonly avatar_url: string | null;
  readonly city: string | null;
  readonly state: string | null;
  readonly weight_unit: WeightUnit;
  readonly distance_unit: DistanceUnit;
  readonly cooking_ability: CookingAbility | null;
  readonly is_demo: boolean; // labels seeded/demo accounts
}

export interface NutritionTarget extends Timestamps {
  readonly id: UUID;
  readonly user_id: UUID;
  readonly challenge_id: UUID | null;
  readonly calorie_target: number; // kcal/day (>= safety floor)
  readonly protein_target_g: number;
}

export interface ActivityPrivacySettings extends Timestamps {
  readonly user_id: UUID; // PK
  readonly weight_visibility: 'private' | 'team' | 'challenge';
  readonly calorie_visibility: 'private' | 'team' | 'challenge';
  readonly photo_visibility: 'private' | 'team' | 'challenge';
  readonly map_visibility: MapVisibility;
  readonly share_routes: false; // routes are never shared with others; type pins it to false
}

// ---- Challenge & teams ----------------------------------------------------------------------

export interface Challenge extends Timestamps {
  readonly id: UUID;
  readonly name: string;
  readonly status: ChallengeStatus;
  readonly start_date: ISODate;
  readonly end_date: ISODate;
  readonly length_days: number;
  readonly timezone: string;
  readonly is_demo: boolean;
}

export interface ChallengeMember extends Timestamps {
  readonly id: UUID;
  readonly challenge_id: UUID;
  readonly user_id: UUID;
  readonly team_id: UUID | null;
  readonly status: MemberStatus;
  readonly start_weight_kg: number;
  readonly goal_weight_kg: number | null;
  readonly joined_at: ISOTimestamp;
}

export interface Team extends Timestamps {
  readonly id: UUID;
  readonly challenge_id: UUID;
  readonly name: string;
  readonly color: string; // hex
  readonly member_count: number;
}

// ---- Tracking -------------------------------------------------------------------------------

export interface WeightEntry extends Timestamps {
  readonly id: UUID;
  readonly challenge_member_id: UUID;
  readonly user_id: UUID;
  readonly weight_kg: number;
  readonly measured_at: ISOTimestamp;
  readonly source: WeightSource;
  readonly note: string | null;
}

export interface FoodLogEntry extends Timestamps {
  readonly id: UUID;
  readonly user_id: UUID;
  readonly log_date: ISODate;
  readonly slot: MealSlot;
  readonly is_planned_meal: boolean;
  readonly total_calories: number;
  readonly total_protein_g: number;
}

export interface FoodLogItem extends Timestamps {
  readonly id: UUID;
  readonly entry_id: UUID;
  readonly label: string;
  readonly provider_food_id: string | null; // reference into the verified nutrition provider
  readonly quantity: number;
  readonly unit: string;
  readonly calories: number; // point-in-time snapshot from provider (not AI)
  readonly protein_g: number;
}

/** One row per member per challenge-day: which actions were completed (drives scoring). */
export interface DailyCheckin extends Timestamps {
  readonly id: UUID;
  readonly challenge_member_id: UUID;
  readonly checkin_date: ISODate;
  readonly logged_food: boolean;
  readonly calories_in_range: boolean;
  readonly completed_plan_meals: number;
  readonly planned_meals: number;
  readonly had_movement: boolean;
  readonly weighed_in: boolean;
  readonly checked_in: boolean;
  readonly day_score: number; // 0–100, computed by domain/scoring
}

// ---- Nutrition & plans ----------------------------------------------------------------------

export interface Recipe extends Timestamps {
  readonly id: UUID;
  readonly title: string;
  readonly cuisine: string | null;
  readonly prep_minutes: number;
  readonly servings: number;
  readonly calories_per_serving: number;
  readonly protein_per_serving_g: number;
  readonly is_ai_generated: boolean; // ideas may be AI; macros are provider-verified
  readonly is_demo: boolean;
}

export interface MealPlanMeal {
  readonly id: UUID;
  readonly slot: MealSlot;
  readonly recipe_id: UUID | null;
  readonly title: string;
  readonly calories: number;
  readonly protein_g: number;
  readonly completed: boolean;
}

// ---- Scoring & leaderboard ------------------------------------------------------------------

export interface ChallengeScore extends Timestamps {
  readonly id: UUID;
  readonly challenge_id: UUID;
  readonly challenge_member_id: UUID;
  readonly points: number;
  readonly current_streak: number;
  readonly longest_streak: number;
  readonly consistency_pct: number; // 0–1
  readonly pct_weight_change: number; // e.g. -0.034 for 3.4% loss
  readonly rank: number | null;
}

export interface LeaderboardEntry {
  readonly rank: number;
  readonly previous_rank: number | null;
  readonly challenge_member_id: UUID;
  readonly display_name: string;
  readonly avatar_url: string | null;
  readonly team_name: string | null;
  readonly points: number;
  readonly current_streak: number;
  readonly category: LeaderboardCategory;
  readonly is_current_user: boolean;
}

// ---- Community & feed -----------------------------------------------------------------------

export interface Post extends Timestamps {
  readonly id: UUID;
  readonly challenge_id: UUID;
  readonly author_id: UUID;
  readonly section: CommunitySection;
  readonly body: string;
  readonly media_urls: readonly string[];
  readonly reaction_count: number;
  readonly comment_count: number;
}

export interface Reaction extends Timestamps {
  readonly id: UUID;
  readonly user_id: UUID;
  readonly target_type: 'post' | 'comment' | 'activity_session';
  readonly target_id: UUID;
  readonly kind: ReactionKind;
}

/** Persistent, curated, feed-worthy event (distinct from ephemeral presence). */
export interface FeedEvent extends Timestamps {
  readonly id: UUID;
  readonly challenge_id: UUID;
  readonly actor_id: UUID;
  readonly actor_display_name: string;
  readonly type: FeedEventType;
  readonly title: string; // e.g. "hit a 10-pound milestone"
  readonly detail: string | null;
}

// ---- Activity, workouts & runs --------------------------------------------------------------

export interface ActivitySession extends Timestamps {
  readonly id: UUID;
  readonly user_id: UUID;
  readonly challenge_id: UUID;
  readonly activity_type: ActivityTypeKey;
  readonly title: string | null; // e.g. "Push Day"
  readonly started_at: ISOTimestamp; // authoritative for the live timer
  readonly ended_at: ISOTimestamp | null;
  readonly duration_s: number | null;
  readonly status: ActivitySessionStatus;
}

export interface RunSession {
  readonly id: UUID;
  readonly activity_session_id: UUID;
  readonly distance_m: number;
  readonly duration_s: number;
  readonly avg_pace_s_per_km: number;
  // NOTE: raw route points are a separate owner-only table and are never included here.
}

// ---- Location -------------------------------------------------------------------------------

/** Coarse, opt-in location for the map. Never precise coordinates. */
export interface UserLocation extends Timestamps {
  readonly user_id: UUID; // PK
  readonly visibility: MapVisibility;
  readonly city: string | null;
  readonly state: string | null;
  readonly coarse_lat: number | null; // city-centroid or jittered — not a home address
  readonly coarse_lng: number | null;
}

// ---- Success gallery ------------------------------------------------------------------------

export interface SuccessStory extends Timestamps {
  readonly id: UUID;
  readonly profile_id: UUID;
  readonly challenge_id: UUID;
  readonly first_name: string;
  readonly headline: string;
  readonly story: string;
  readonly start_weight_kg: number;
  readonly end_weight_kg: number;
  readonly pct_change: number;
  readonly consistency_pct: number;
  readonly is_demo: boolean;
}

export interface SuccessStoryConsent extends Timestamps {
  readonly id: UUID;
  readonly success_story_id: UUID;
  readonly surface: ConsentSurface;
  readonly granted: boolean;
  readonly granted_at: ISOTimestamp | null;
  readonly revoked_at: ISOTimestamp | null;
}

// ---- Presence (ephemeral, not a DB row) -----------------------------------------------------

/** Live presence payload broadcast via Realtime. Not persisted per-tick. */
export interface PresencePayload {
  readonly userId: UUID;
  readonly displayName: string;
  readonly avatarUrl: string | null;
  readonly city: string | null;
  readonly state: string | null;
  readonly activityStatus: PresenceStatus;
  readonly activitySessionId: UUID | null;
  readonly activityTitle: string | null;
  readonly activityStartedAt: ISOTimestamp | null;
}
