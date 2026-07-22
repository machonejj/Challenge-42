-- Challenge42 — full schema (generated from migrations/0001–0015, in order).
-- Paste this whole file into the Supabase SQL Editor and Run once, on a fresh project.

-- ============================================================
-- migrations/0001_extensions_and_helpers.sql
-- ============================================================
-- 0001 · Extensions and shared helpers
-- Additive foundation for all later migrations. Safe to re-run (idempotent where possible).

create extension if not exists pgcrypto; -- gen_random_uuid()

-- Shared trigger to maintain updated_at. Attached per-table in later migrations.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'BEFORE UPDATE trigger: stamps updated_at = now(). Attach to every table with an updated_at column.';

-- Convention note (documented, not enforced here):
--   * Enums are modeled as text + CHECK constraints (see DATA_MODEL.md §1.7) to ease evolution.
--   * Mass is stored in kilograms, distance in meters, duration in seconds, money in integer cents.

-- ============================================================
-- migrations/0002_identity_and_profiles.sql
-- ============================================================
-- 0002 · Identity & profiles
-- profiles is 1:1 with auth.users. Sensitive settings default to the most private option.

create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  display_name   text not null check (char_length(display_name) between 1 and 60),
  avatar_url     text,
  city           text,
  state          text,
  weight_unit    text not null default 'lb' check (weight_unit in ('lb', 'kg')),
  distance_unit  text not null default 'mi' check (distance_unit in ('mi', 'km')),
  cooking_ability text check (cooking_ability in ('beginner', 'comfortable', 'advanced')),
  is_demo        boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

comment on column public.profiles.is_demo is 'Labels seeded/demo accounts so they are never treated as real users.';

-- Per-user (optionally per-challenge) nutrition targets. Conservative floor enforced in app/domain.
-- challenge_id FK is added in 0003 once the challenges table exists.
create table public.nutrition_targets (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  challenge_id   uuid,
  calorie_target integer not null check (calorie_target >= 1000),
  protein_target_g integer not null check (protein_target_g >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index nutrition_targets_user_idx on public.nutrition_targets (user_id);
create trigger set_updated_at before update on public.nutrition_targets
  for each row execute function public.set_updated_at();

-- Privacy: sensitive data defaults to private; routes can NEVER be shared (DB-enforced invariant).
create table public.activity_privacy_settings (
  user_id           uuid primary key references public.profiles (id) on delete cascade,
  weight_visibility text not null default 'private' check (weight_visibility in ('private', 'team', 'challenge')),
  calorie_visibility text not null default 'private' check (calorie_visibility in ('private', 'team', 'challenge')),
  photo_visibility  text not null default 'private' check (photo_visibility in ('private', 'team', 'challenge')),
  map_visibility    text not null default 'hidden' check (map_visibility in ('hidden', 'city', 'approximate')),
  share_routes      boolean not null default false check (share_routes = false),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger set_updated_at before update on public.activity_privacy_settings
  for each row execute function public.set_updated_at();

comment on constraint activity_privacy_settings_share_routes_check on public.activity_privacy_settings is
  'Hard privacy invariant: raw GPS routes are never shareable with other challengers.';

-- What a user exposes to co-challengers vs. the public website (distinct from marketing consent).
create table public.public_profile_preferences (
  user_id                 uuid primary key references public.profiles (id) on delete cascade,
  show_display_name       boolean not null default true,
  show_on_public_web      boolean not null default false,
  show_in_success_gallery boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create trigger set_updated_at before update on public.public_profile_preferences
  for each row execute function public.set_updated_at();

-- Expo push tokens per device.
create table public.push_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  expo_token text not null,
  platform   text check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, expo_token)
);
create index push_tokens_user_idx on public.push_tokens (user_id);
create trigger set_updated_at before update on public.push_tokens
  for each row execute function public.set_updated_at();

-- ============================================================
-- migrations/0003_challenges_and_teams.sql
-- ============================================================
-- 0003 · Challenges, teams, membership

create table public.challenges (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  status      text not null default 'upcoming' check (status in ('upcoming', 'active', 'completed', 'archived')),
  start_date  date not null,
  end_date    date not null,
  length_days integer not null default 42 check (length_days between 1 and 365),
  timezone    text not null default 'UTC',
  is_demo     boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (end_date >= start_date)
);
create trigger set_updated_at before update on public.challenges
  for each row execute function public.set_updated_at();

-- Now that challenges exists, wire the deferred nutrition_targets FK.
alter table public.nutrition_targets
  add constraint nutrition_targets_challenge_id_fkey
  foreign key (challenge_id) references public.challenges (id) on delete cascade;

create table public.teams (
  id           uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 60),
  color        text not null default '#12382B',
  member_count integer not null default 0 check (member_count >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (challenge_id, name)
);
create index teams_challenge_idx on public.teams (challenge_id);
create trigger set_updated_at before update on public.teams
  for each row execute function public.set_updated_at();

-- Anchor of participation: starting/goal weight and standing hang off this row.
create table public.challenge_members (
  id              uuid primary key default gen_random_uuid(),
  challenge_id    uuid not null references public.challenges (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  team_id         uuid references public.teams (id) on delete set null,
  status          text not null default 'active' check (status in ('active', 'paused', 'withdrawn', 'completed')),
  start_weight_kg numeric(6, 3) not null check (start_weight_kg > 0),
  goal_weight_kg  numeric(6, 3) check (goal_weight_kg > 0),
  joined_at       timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (challenge_id, user_id)
);
create index challenge_members_challenge_idx on public.challenge_members (challenge_id);
create index challenge_members_user_idx on public.challenge_members (user_id);
create index challenge_members_team_idx on public.challenge_members (team_id);
create trigger set_updated_at before update on public.challenge_members
  for each row execute function public.set_updated_at();

-- Explicit team membership (a user is on one team per challenge).
create table public.team_members (
  id           uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  team_id      uuid not null references public.teams (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (challenge_id, user_id)
);
create index team_members_team_idx on public.team_members (team_id);
create trigger set_updated_at before update on public.team_members
  for each row execute function public.set_updated_at();

-- ============================================================
-- migrations/0004_tracking.sql
-- ============================================================
-- 0004 · Tracking: weight, food logs, daily check-ins

create table public.weight_entries (
  id                  uuid primary key default gen_random_uuid(),
  challenge_member_id uuid not null references public.challenge_members (id) on delete cascade,
  user_id             uuid not null references public.profiles (id) on delete cascade,
  weight_kg           numeric(6, 3) not null check (weight_kg > 0 and weight_kg < 700),
  measured_at         timestamptz not null default now(),
  source              text not null default 'manual' check (source in ('manual', 'scale', 'import')),
  note                text check (char_length(note) <= 280),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index weight_entries_member_measured_idx
  on public.weight_entries (challenge_member_id, measured_at desc);
create index weight_entries_user_idx on public.weight_entries (user_id);
create trigger set_updated_at before update on public.weight_entries
  for each row execute function public.set_updated_at();

-- A meal slot on a day. Totals are denormalized from items for fast reads (kept in sync in app/edge).
create table public.food_log_entries (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  log_date       date not null,
  slot           text not null check (slot in ('breakfast', 'lunch', 'dinner', 'snack')),
  is_planned_meal boolean not null default false,
  total_calories integer not null default 0 check (total_calories >= 0),
  total_protein_g numeric(6, 1) not null default 0 check (total_protein_g >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index food_log_entries_user_date_idx on public.food_log_entries (user_id, log_date);
create trigger set_updated_at before update on public.food_log_entries
  for each row execute function public.set_updated_at();

-- Line items. Nutrition values are a point-in-time snapshot from the verified provider (never AI),
-- copied at log time so historical logs never drift.
create table public.food_log_items (
  id               uuid primary key default gen_random_uuid(),
  entry_id         uuid not null references public.food_log_entries (id) on delete cascade,
  label            text not null check (char_length(label) between 1 and 120),
  provider_food_id text,
  quantity         numeric(8, 2) not null check (quantity > 0),
  unit             text not null,
  calories         integer not null check (calories >= 0),
  protein_g        numeric(6, 1) not null default 0 check (protein_g >= 0),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index food_log_items_entry_idx on public.food_log_items (entry_id);
create trigger set_updated_at before update on public.food_log_items
  for each row execute function public.set_updated_at();

-- One row per member per challenge-day. Drives scoring (see packages/domain/scoring.ts).
create table public.daily_checkins (
  id                  uuid primary key default gen_random_uuid(),
  challenge_member_id uuid not null references public.challenge_members (id) on delete cascade,
  checkin_date        date not null,
  logged_food         boolean not null default false,
  calories_in_range   boolean not null default false,
  completed_plan_meals integer not null default 0 check (completed_plan_meals >= 0),
  planned_meals       integer not null default 0 check (planned_meals >= 0),
  had_movement        boolean not null default false,
  weighed_in          boolean not null default false,
  checked_in          boolean not null default false,
  day_score           integer not null default 0 check (day_score between 0 and 100),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (challenge_member_id, checkin_date)
);
create index daily_checkins_date_idx on public.daily_checkins (checkin_date);
create trigger set_updated_at before update on public.daily_checkins
  for each row execute function public.set_updated_at();

-- ============================================================
-- migrations/0005_nutrition_and_plans.sql
-- ============================================================
-- 0005 · Recipes & meal plans
-- AI may generate recipe IDEAS/STRUCTURE; macros are reconciled against the verified provider.

create table public.recipes (
  id                   uuid primary key default gen_random_uuid(),
  title                text not null check (char_length(title) between 1 and 160),
  cuisine              text,
  prep_minutes         integer not null default 0 check (prep_minutes >= 0),
  servings             integer not null default 1 check (servings >= 1),
  calories_per_serving integer not null check (calories_per_serving >= 0),
  protein_per_serving_g numeric(6, 1) not null default 0 check (protein_per_serving_g >= 0),
  instructions         text,
  is_ai_generated      boolean not null default false,
  is_demo              boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create trigger set_updated_at before update on public.recipes
  for each row execute function public.set_updated_at();

create table public.recipe_ingredients (
  id               uuid primary key default gen_random_uuid(),
  recipe_id        uuid not null references public.recipes (id) on delete cascade,
  label            text not null,
  provider_food_id text,
  quantity         numeric(8, 2) not null default 1 check (quantity > 0),
  unit             text not null default 'unit',
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index recipe_ingredients_recipe_idx on public.recipe_ingredients (recipe_id);
create trigger set_updated_at before update on public.recipe_ingredients
  for each row execute function public.set_updated_at();

-- A user's plan over a date range, with the constraints snapshot that generated it.
create table public.meal_plans (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  challenge_id uuid references public.challenges (id) on delete set null,
  start_date   date not null,
  end_date     date not null,
  constraints  jsonb not null default '{}'::jsonb, -- calorie/protein target, prefs, budget, etc.
  is_demo      boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (end_date >= start_date)
);
create index meal_plans_user_idx on public.meal_plans (user_id);
create trigger set_updated_at before update on public.meal_plans
  for each row execute function public.set_updated_at();

create table public.meal_plan_days (
  id           uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans (id) on delete cascade,
  plan_date    date not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (meal_plan_id, plan_date)
);
create index meal_plan_days_plan_idx on public.meal_plan_days (meal_plan_id);
create trigger set_updated_at before update on public.meal_plan_days
  for each row execute function public.set_updated_at();

create table public.meal_plan_meals (
  id               uuid primary key default gen_random_uuid(),
  meal_plan_day_id uuid not null references public.meal_plan_days (id) on delete cascade,
  slot             text not null check (slot in ('breakfast', 'lunch', 'dinner', 'snack')),
  recipe_id        uuid references public.recipes (id) on delete set null,
  title            text not null,
  calories         integer not null check (calories >= 0),
  protein_g        numeric(6, 1) not null default 0 check (protein_g >= 0),
  completed        boolean not null default false,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index meal_plan_meals_day_idx on public.meal_plan_meals (meal_plan_day_id);
create trigger set_updated_at before update on public.meal_plan_meals
  for each row execute function public.set_updated_at();

-- ============================================================
-- migrations/0006_scoring_and_feed.sql
-- ============================================================
-- 0006 · Scoring, leaderboards, community & curated feed

-- Running per-member score. Derived by the shared scoring engine; stored for fast reads.
create table public.challenge_scores (
  id                  uuid primary key default gen_random_uuid(),
  challenge_id        uuid not null references public.challenges (id) on delete cascade,
  challenge_member_id uuid not null references public.challenge_members (id) on delete cascade,
  points              integer not null default 0 check (points >= 0),
  current_streak      integer not null default 0 check (current_streak >= 0),
  longest_streak      integer not null default 0 check (longest_streak >= 0),
  consistency_pct     numeric(4, 3) not null default 0 check (consistency_pct between 0 and 1),
  pct_weight_change   numeric(5, 4) not null default 0, -- negative = loss
  rank                integer check (rank > 0),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (challenge_member_id)
);
create index challenge_scores_ranking_idx on public.challenge_scores (challenge_id, points desc);
create trigger set_updated_at before update on public.challenge_scores
  for each row execute function public.set_updated_at();

-- Denormalized ranking snapshots for fast leaderboard reads + rank-movement (↑/↓) computation.
-- Note: total pounds lost is intentionally NOT a category (see PRODUCT_SPEC / DATA_MODEL §6.4).
create table public.leaderboard_snapshots (
  id                  uuid primary key default gen_random_uuid(),
  challenge_id        uuid not null references public.challenges (id) on delete cascade,
  category            text not null check (category in ('overall', 'consistency', 'streak', 'percent_change', 'team')),
  captured_at         timestamptz not null default now(),
  rank                integer not null check (rank > 0),
  previous_rank       integer check (previous_rank > 0),
  challenge_member_id uuid references public.challenge_members (id) on delete cascade,
  team_id             uuid references public.teams (id) on delete cascade,
  points              integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index leaderboard_snapshots_lookup_idx
  on public.leaderboard_snapshots (challenge_id, category, captured_at desc, rank);
create trigger set_updated_at before update on public.leaderboard_snapshots
  for each row execute function public.set_updated_at();

-- Community posts.
create table public.posts (
  id             uuid primary key default gen_random_uuid(),
  challenge_id   uuid not null references public.challenges (id) on delete cascade,
  author_id      uuid not null references public.profiles (id) on delete cascade,
  section        text not null default 'for_you'
                   check (section in ('for_you', 'wins', 'meal_ideas', 'questions', 'my_team', 'recipes')),
  body           text not null check (char_length(body) between 1 and 2000),
  media_urls     text[] not null default '{}',
  reaction_count integer not null default 0 check (reaction_count >= 0),
  comment_count  integer not null default 0 check (comment_count >= 0),
  is_hidden      boolean not null default false, -- moderation
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index posts_challenge_created_idx on public.posts (challenge_id, created_at desc);
create index posts_author_idx on public.posts (author_id);
create trigger set_updated_at before update on public.posts
  for each row execute function public.set_updated_at();

create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 1000),
  is_hidden  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index comments_post_idx on public.comments (post_id, created_at);
create trigger set_updated_at before update on public.comments
  for each row execute function public.set_updated_at();

create table public.reactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment', 'activity_session')),
  target_id   uuid not null,
  kind        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, target_type, target_id, kind)
);
create index reactions_target_idx on public.reactions (target_type, target_id);
create trigger set_updated_at before update on public.reactions
  for each row execute function public.set_updated_at();

-- Curated, persistent, feed-worthy events (distinct from ephemeral realtime presence).
create table public.feed_events (
  id                uuid primary key default gen_random_uuid(),
  challenge_id      uuid not null references public.challenges (id) on delete cascade,
  actor_id          uuid references public.profiles (id) on delete set null,
  actor_display_name text not null,
  type              text not null
                     check (type in ('milestone', 'activity_completed', 'meal_shared', 'recipe_shared',
                                     'goal_hit', 'day_completed', 'badge_earned', 'team_event')),
  title             text not null,
  detail            text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index feed_events_challenge_created_idx on public.feed_events (challenge_id, created_at desc);
create trigger set_updated_at before update on public.feed_events
  for each row execute function public.set_updated_at();

-- ============================================================
-- migrations/0007_activity_and_map.sql
-- ============================================================
-- 0007 · Activity, workouts, runs, cheers, and privacy-safe map location

-- Reference table for activity types.
create table public.activity_types (
  key        text primary key check (key in ('run', 'walk', 'strength', 'cycling', 'yoga', 'hiit', 'sports', 'other')),
  label      text not null,
  created_at timestamptz not null default now()
);
insert into public.activity_types (key, label) values
  ('run', 'Run'), ('walk', 'Walk'), ('strength', 'Strength'), ('cycling', 'Cycling'),
  ('yoga', 'Yoga / Mobility'), ('hiit', 'HIIT'), ('sports', 'Sports'), ('other', 'Other');

-- A workout/run session. started_at is authoritative for the LIVE timer; clients compute elapsed as
-- now() - started_at. We never write elapsed seconds continuously (see DATA_MODEL §7).
create table public.activity_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  challenge_id  uuid references public.challenges (id) on delete set null,
  activity_type text not null references public.activity_types (key),
  title         text check (char_length(title) <= 80),
  started_at    timestamptz not null default now(),
  ended_at      timestamptz,
  duration_s    integer check (duration_s >= 0),
  status        text not null default 'in_progress' check (status in ('in_progress', 'completed', 'discarded')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);
create index activity_sessions_user_idx on public.activity_sessions (user_id, started_at desc);
-- Partial index for the "who is active right now" query.
create index activity_sessions_in_progress_idx on public.activity_sessions (challenge_id)
  where status = 'in_progress';
create trigger set_updated_at before update on public.activity_sessions
  for each row execute function public.set_updated_at();

create table public.workout_templates (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid references public.profiles (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 80),
  is_demo    boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.workout_templates
  for each row execute function public.set_updated_at();

create table public.workout_template_exercises (
  id           uuid primary key default gen_random_uuid(),
  template_id  uuid not null references public.workout_templates (id) on delete cascade,
  name         text not null,
  target_sets  integer check (target_sets >= 0),
  target_reps  integer check (target_reps >= 0),
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index wte_template_idx on public.workout_template_exercises (template_id);
create trigger set_updated_at before update on public.workout_template_exercises
  for each row execute function public.set_updated_at();

create table public.workout_session_exercises (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.activity_sessions (id) on delete cascade,
  name        text not null,
  sets        integer check (sets >= 0),
  reps        integer check (reps >= 0),
  weight_kg   numeric(6, 2) check (weight_kg >= 0),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index wse_session_idx on public.workout_session_exercises (session_id);
create trigger set_updated_at before update on public.workout_session_exercises
  for each row execute function public.set_updated_at();

-- Run/walk specifics.
create table public.run_sessions (
  id                  uuid primary key default gen_random_uuid(),
  activity_session_id uuid not null references public.activity_sessions (id) on delete cascade,
  distance_m          numeric(10, 2) not null default 0 check (distance_m >= 0),
  duration_s          integer not null default 0 check (duration_s >= 0),
  avg_pace_s_per_km   numeric(8, 2) check (avg_pace_s_per_km >= 0),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (activity_session_id)
);
create trigger set_updated_at before update on public.run_sessions
  for each row execute function public.set_updated_at();

-- Raw GPS route points. OWNER-ONLY (see SECURITY.md §3.3). Never exposed to other challengers.
create table public.run_route_points (
  id             uuid primary key default gen_random_uuid(),
  run_session_id uuid not null references public.run_sessions (id) on delete cascade,
  user_id        uuid not null references public.profiles (id) on delete cascade,
  sequence       integer not null,
  lat            double precision not null,
  lng            double precision not null,
  recorded_at    timestamptz not null,
  created_at     timestamptz not null default now()
);
create index run_route_points_session_seq_idx on public.run_route_points (run_session_id, sequence);
comment on table public.run_route_points is
  'Owner-only raw GPS. RLS grants SELECT only to user_id = auth.uid(). No co-challenger/team/public policy exists.';

create table public.activity_cheers (
  id                  uuid primary key default gen_random_uuid(),
  activity_session_id uuid not null references public.activity_sessions (id) on delete cascade,
  sender_id           uuid not null references public.profiles (id) on delete cascade,
  emoji               text not null check (emoji in ('🔥', '💪', '👏', '🚀')),
  created_at          timestamptz not null default now()
);
create index activity_cheers_session_idx on public.activity_cheers (activity_session_id);
create unique index activity_cheers_unique on public.activity_cheers (activity_session_id, sender_id, emoji);

-- Coarse, opt-in location for the map. NEVER precise coordinates or a home address.
create table public.user_locations (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  visibility text not null default 'hidden' check (visibility in ('hidden', 'city', 'approximate')),
  city       text,
  state      text,
  coarse_lat double precision, -- city centroid or jittered; not a precise location
  coarse_lng double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.user_locations
  for each row execute function public.set_updated_at();
comment on table public.user_locations is
  'Coarse map location only. Precise GPS lives transiently or in owner-only run_route_points.';

-- ============================================================
-- migrations/0008_success_and_system.sql
-- ============================================================
-- 0008 · Success gallery, alumni, badges, notifications, reports, admin

-- Immutable end-of-challenge rollup per member (derived; source for alumni/success stories).
create table public.challenge_completion_summaries (
  id                  uuid primary key default gen_random_uuid(),
  challenge_id        uuid not null references public.challenges (id) on delete cascade,
  challenge_member_id uuid not null references public.challenge_members (id) on delete cascade,
  start_weight_kg     numeric(6, 3) not null,
  end_weight_kg       numeric(6, 3) not null,
  pct_change          numeric(5, 4) not null,
  consistency_pct     numeric(4, 3) not null check (consistency_pct between 0 and 1),
  longest_streak      integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (challenge_member_id)
);
create trigger set_updated_at before update on public.challenge_completion_summaries
  for each row execute function public.set_updated_at();

-- Curated alumni story. Visibility on any surface requires a matching consent row (below).
create table public.success_stories (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null references public.profiles (id) on delete cascade,
  challenge_id    uuid not null references public.challenges (id) on delete cascade,
  first_name      text not null,
  headline        text not null,
  story           text not null,
  start_weight_kg numeric(6, 3) not null,
  end_weight_kg   numeric(6, 3) not null,
  pct_change      numeric(5, 4) not null,
  consistency_pct numeric(4, 3) not null check (consistency_pct between 0 and 1),
  status          text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_demo         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index success_stories_challenge_idx on public.success_stories (challenge_id);
create trigger set_updated_at before update on public.success_stories
  for each row execute function public.set_updated_at();

create table public.success_story_media (
  id               uuid primary key default gen_random_uuid(),
  success_story_id uuid not null references public.success_stories (id) on delete cascade,
  kind             text not null check (kind in ('before', 'after', 'progress')),
  storage_path     text not null, -- private bucket path; served via signed URL after consent check
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index success_story_media_story_idx on public.success_story_media (success_story_id);
create trigger set_updated_at before update on public.success_story_media
  for each row execute function public.set_updated_at();

-- SEPARATE consent per surface. Consent for one surface NEVER implies another (SECURITY.md §7).
create table public.success_story_consents (
  id               uuid primary key default gen_random_uuid(),
  success_story_id uuid not null references public.success_stories (id) on delete cascade,
  surface          text not null check (surface in ('in_app', 'public_web', 'marketing')),
  granted          boolean not null default false,
  granted_at       timestamptz,
  revoked_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (success_story_id, surface)
);
create trigger set_updated_at before update on public.success_story_consents
  for each row execute function public.set_updated_at();

-- Badges.
create table public.badges (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  art_url     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger set_updated_at before update on public.badges
  for each row execute function public.set_updated_at();

create table public.graduate_badges (
  id           uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  slug         text not null,
  name         text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (challenge_id, slug)
);
create trigger set_updated_at before update on public.graduate_badges
  for each row execute function public.set_updated_at();

create table public.user_badges (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  badge_id     uuid not null references public.badges (id) on delete cascade,
  challenge_id uuid references public.challenges (id) on delete set null,
  earned_at    timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, badge_id, challenge_id)
);
create index user_badges_user_idx on public.user_badges (user_id);
create trigger set_updated_at before update on public.user_badges
  for each row execute function public.set_updated_at();

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       text not null,
  payload    jsonb not null default '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create trigger set_updated_at before update on public.notifications
  for each row execute function public.set_updated_at();

create table public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references public.profiles (id) on delete cascade,
  subject_type text not null check (subject_type in ('post', 'comment', 'profile')),
  subject_id   uuid not null,
  reason       text not null,
  status       text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index reports_status_idx on public.reports (status, created_at);
create trigger set_updated_at before update on public.reports
  for each row execute function public.set_updated_at();

-- Staff, separate from profiles. Privileged access is defense-in-depth (RLS + app role checks).
create table public.admin_users (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references public.profiles (id) on delete cascade,
  role       text not null default 'moderator' check (role in ('moderator', 'admin', 'superadmin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.admin_users
  for each row execute function public.set_updated_at();

-- ============================================================
-- migrations/0009_rls_policies.sql
-- ============================================================
-- 0009 · Row-Level Security
-- Default posture is deny-all: RLS is enabled and policies grant the minimum. The service role
-- (server/edge only) bypasses RLS for computed writes (scores, snapshots, feed events).
-- See docs/SECURITY.md for the full rationale.

-- ---- Helper functions (SECURITY DEFINER to avoid RLS recursion on membership lookups) ----------

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users a where a.user_id = auth.uid());
$$;

create or replace function public.is_member_of_challenge(p_challenge_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.challenge_members m
    where m.challenge_id = p_challenge_id and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_same_challenge_as(p_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.challenge_members me
    join public.challenge_members them on them.challenge_id = me.challenge_id
    where me.user_id = auth.uid() and them.user_id = p_user_id
  );
$$;

-- Enable RLS on every user-facing table. (Reference tables get permissive read policies below.)
alter table public.profiles                       enable row level security;
alter table public.nutrition_targets              enable row level security;
alter table public.activity_privacy_settings      enable row level security;
alter table public.public_profile_preferences     enable row level security;
alter table public.push_tokens                    enable row level security;
alter table public.challenges                      enable row level security;
alter table public.teams                           enable row level security;
alter table public.challenge_members               enable row level security;
alter table public.team_members                    enable row level security;
alter table public.weight_entries                  enable row level security;
alter table public.food_log_entries                enable row level security;
alter table public.food_log_items                  enable row level security;
alter table public.daily_checkins                  enable row level security;
alter table public.recipes                         enable row level security;
alter table public.recipe_ingredients              enable row level security;
alter table public.meal_plans                      enable row level security;
alter table public.meal_plan_days                  enable row level security;
alter table public.meal_plan_meals                 enable row level security;
alter table public.challenge_scores                enable row level security;
alter table public.leaderboard_snapshots           enable row level security;
alter table public.posts                           enable row level security;
alter table public.comments                        enable row level security;
alter table public.reactions                       enable row level security;
alter table public.feed_events                     enable row level security;
alter table public.activity_types                  enable row level security;
alter table public.activity_sessions               enable row level security;
alter table public.workout_templates               enable row level security;
alter table public.workout_template_exercises      enable row level security;
alter table public.workout_session_exercises       enable row level security;
alter table public.run_sessions                    enable row level security;
alter table public.run_route_points                enable row level security;
alter table public.activity_cheers                 enable row level security;
alter table public.user_locations                  enable row level security;
alter table public.challenge_completion_summaries  enable row level security;
alter table public.success_stories                 enable row level security;
alter table public.success_story_media             enable row level security;
alter table public.success_story_consents          enable row level security;
alter table public.badges                          enable row level security;
alter table public.graduate_badges                 enable row level security;
alter table public.user_badges                     enable row level security;
alter table public.notifications                   enable row level security;
alter table public.reports                         enable row level security;
alter table public.admin_users                     enable row level security;

-- ---- Identity ---------------------------------------------------------------------------------

-- Profiles: readable by self, co-challengers, and admins; writable only by self.
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_same_challenge_as(id) or public.is_admin());
create policy profiles_insert on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Owner-only private settings.
create policy nutrition_targets_owner on public.nutrition_targets for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy privacy_settings_owner on public.activity_privacy_settings for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy public_prefs_owner on public.public_profile_preferences for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy push_tokens_owner on public.push_tokens for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- Challenge & teams ------------------------------------------------------------------------

create policy challenges_select on public.challenges for select to authenticated
  using (public.is_member_of_challenge(id) or public.is_admin());

create policy teams_select on public.teams for select to authenticated
  using (public.is_member_of_challenge(challenge_id) or public.is_admin());

create policy challenge_members_select on public.challenge_members for select to authenticated
  using (user_id = auth.uid() or public.is_member_of_challenge(challenge_id) or public.is_admin());
create policy challenge_members_write_own on public.challenge_members for insert to authenticated
  with check (user_id = auth.uid());
create policy challenge_members_update_own on public.challenge_members for update to authenticated
  using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

create policy team_members_select on public.team_members for select to authenticated
  using (public.is_member_of_challenge(challenge_id) or public.is_admin());

-- ---- Tracking (PRIVATE by default) ------------------------------------------------------------

create policy weight_entries_owner on public.weight_entries for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy food_log_entries_owner on public.food_log_entries for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy food_log_items_owner on public.food_log_items for all to authenticated
  using (exists (select 1 from public.food_log_entries e where e.id = entry_id and e.user_id = auth.uid()))
  with check (exists (select 1 from public.food_log_entries e where e.id = entry_id and e.user_id = auth.uid()));

create policy daily_checkins_owner on public.daily_checkins for all to authenticated
  using (exists (select 1 from public.challenge_members m where m.id = challenge_member_id and m.user_id = auth.uid()))
  with check (exists (select 1 from public.challenge_members m where m.id = challenge_member_id and m.user_id = auth.uid()));

-- ---- Nutrition & plans ------------------------------------------------------------------------

-- Recipes/ingredients are shared reference content: readable by all authenticated users.
create policy recipes_read on public.recipes for select to authenticated using (true);
create policy recipe_ingredients_read on public.recipe_ingredients for select to authenticated using (true);
create policy activity_types_read on public.activity_types for select to authenticated using (true);
create policy badges_read on public.badges for select to authenticated using (true);
create policy graduate_badges_read on public.graduate_badges for select to authenticated using (true);

create policy meal_plans_owner on public.meal_plans for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy meal_plan_days_owner on public.meal_plan_days for all to authenticated
  using (exists (select 1 from public.meal_plans p where p.id = meal_plan_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.meal_plans p where p.id = meal_plan_id and p.user_id = auth.uid()));
create policy meal_plan_meals_owner on public.meal_plan_meals for all to authenticated
  using (exists (
    select 1 from public.meal_plan_days d
    join public.meal_plans p on p.id = d.meal_plan_id
    where d.id = meal_plan_day_id and p.user_id = auth.uid()))
  with check (exists (
    select 1 from public.meal_plan_days d
    join public.meal_plans p on p.id = d.meal_plan_id
    where d.id = meal_plan_day_id and p.user_id = auth.uid()));

-- ---- Scoring & feed (read within challenge; writes are server/edge via service role) ----------

create policy challenge_scores_select on public.challenge_scores for select to authenticated
  using (public.is_member_of_challenge(challenge_id) or public.is_admin());
create policy leaderboard_snapshots_select on public.leaderboard_snapshots for select to authenticated
  using (public.is_member_of_challenge(challenge_id) or public.is_admin());
create policy feed_events_select on public.feed_events for select to authenticated
  using (public.is_member_of_challenge(challenge_id) or public.is_admin());

-- ---- Community --------------------------------------------------------------------------------

create policy posts_select on public.posts for select to authenticated
  using ((public.is_member_of_challenge(challenge_id) and not is_hidden) or author_id = auth.uid() or public.is_admin());
create policy posts_insert on public.posts for insert to authenticated
  with check (author_id = auth.uid() and public.is_member_of_challenge(challenge_id));
create policy posts_modify on public.posts for update to authenticated
  using (author_id = auth.uid() or public.is_admin()) with check (author_id = auth.uid() or public.is_admin());
create policy posts_delete on public.posts for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

create policy comments_select on public.comments for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id
                 and (public.is_member_of_challenge(p.challenge_id) or public.is_admin()))
         and (not is_hidden or author_id = auth.uid() or public.is_admin()));
create policy comments_insert on public.comments for insert to authenticated
  with check (author_id = auth.uid()
              and exists (select 1 from public.posts p where p.id = post_id and public.is_member_of_challenge(p.challenge_id)));
create policy comments_modify on public.comments for update to authenticated
  using (author_id = auth.uid() or public.is_admin()) with check (author_id = auth.uid() or public.is_admin());
create policy comments_delete on public.comments for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

create policy reactions_select on public.reactions for select to authenticated using (true);
create policy reactions_write_own on public.reactions for insert to authenticated
  with check (user_id = auth.uid());
create policy reactions_delete_own on public.reactions for delete to authenticated
  using (user_id = auth.uid());

-- ---- Activity, workouts, runs -----------------------------------------------------------------

-- Live activity is visible to co-challengers; owner can write.
create policy activity_sessions_select on public.activity_sessions for select to authenticated
  using (user_id = auth.uid() or public.is_same_challenge_as(user_id) or public.is_admin());
create policy activity_sessions_write on public.activity_sessions for insert to authenticated
  with check (user_id = auth.uid());
create policy activity_sessions_update on public.activity_sessions for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy workout_templates_rw on public.workout_templates for all to authenticated
  using (owner_id = auth.uid() or is_demo) with check (owner_id = auth.uid());
create policy wte_rw on public.workout_template_exercises for all to authenticated
  using (exists (select 1 from public.workout_templates t where t.id = template_id and (t.owner_id = auth.uid() or t.is_demo)))
  with check (exists (select 1 from public.workout_templates t where t.id = template_id and t.owner_id = auth.uid()));
create policy wse_owner on public.workout_session_exercises for all to authenticated
  using (exists (select 1 from public.activity_sessions s where s.id = session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.activity_sessions s where s.id = session_id and s.user_id = auth.uid()));

create policy run_sessions_select on public.run_sessions for select to authenticated
  using (exists (select 1 from public.activity_sessions s where s.id = activity_session_id
                 and (s.user_id = auth.uid() or public.is_same_challenge_as(s.user_id))));
create policy run_sessions_write on public.run_sessions for all to authenticated
  using (exists (select 1 from public.activity_sessions s where s.id = activity_session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.activity_sessions s where s.id = activity_session_id and s.user_id = auth.uid()));

-- THE HARD LINE: raw GPS routes are OWNER-ONLY. No co-challenger/team/public read policy exists.
create policy run_route_points_owner_only on public.run_route_points for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy activity_cheers_select on public.activity_cheers for select to authenticated
  using (exists (select 1 from public.activity_sessions s where s.id = activity_session_id
                 and (s.user_id = auth.uid() or public.is_same_challenge_as(s.user_id))));
create policy activity_cheers_write on public.activity_cheers for insert to authenticated
  with check (sender_id = auth.uid());

-- ---- Map location: coarse, opt-in read by co-challengers; owner writes ------------------------

create policy user_locations_select on public.user_locations for select to authenticated
  using (user_id = auth.uid()
         or (visibility <> 'hidden' and public.is_same_challenge_as(user_id))
         or public.is_admin());
create policy user_locations_write on public.user_locations for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- Success gallery (surface consent enforced at query/edge layer; RLS gives the floor) ------

create policy completion_summaries_select on public.challenge_completion_summaries for select to authenticated
  using (exists (select 1 from public.challenge_members m where m.id = challenge_member_id
                 and (m.user_id = auth.uid() or public.is_member_of_challenge(m.challenge_id)))
         or public.is_admin());

create policy success_stories_select on public.success_stories for select to authenticated
  using (status = 'published' or profile_id = auth.uid() or public.is_admin());
create policy success_stories_write on public.success_stories for all to authenticated
  using (profile_id = auth.uid() or public.is_admin()) with check (profile_id = auth.uid() or public.is_admin());

create policy success_media_owner on public.success_story_media for all to authenticated
  using (exists (select 1 from public.success_stories s where s.id = success_story_id
                 and (s.profile_id = auth.uid() or public.is_admin())))
  with check (exists (select 1 from public.success_stories s where s.id = success_story_id and s.profile_id = auth.uid()));

create policy success_consents_owner on public.success_story_consents for all to authenticated
  using (exists (select 1 from public.success_stories s where s.id = success_story_id
                 and (s.profile_id = auth.uid() or public.is_admin())))
  with check (exists (select 1 from public.success_stories s where s.id = success_story_id and s.profile_id = auth.uid()));

-- ---- Badges, notifications, reports, admin ----------------------------------------------------

create policy user_badges_select on public.user_badges for select to authenticated
  using (user_id = auth.uid() or public.is_same_challenge_as(user_id) or public.is_admin());

create policy notifications_owner on public.notifications for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy reports_insert on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());
create policy reports_select on public.reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());

create policy admin_users_select on public.admin_users for select to authenticated
  using (public.is_admin());

-- ============================================================
-- migrations/0010_onboarding_and_prefs.sql
-- ============================================================
-- 0010 · Phase Two — onboarding progress, structured preferences, safety flags
-- Additive. Sensitive structured data is stored in owner-only tables (RLS in 0013), never on the
-- co-challenger-readable profiles row.

-- profiles: add first name (display-like) used for the personalized greeting.
alter table public.profiles add column if not exists first_name text;

-- Onboarding draft + resume. One row per user; answers is the progressive draft (jsonb).
create table public.onboarding_progress (
  user_id         uuid primary key references public.profiles (id) on delete cascade,
  status          text not null default 'NOT_STARTED'
                    check (status in ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),
  current_step_id text,
  answers         jsonb not null default '{}'::jsonb,
  version         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger set_updated_at before update on public.onboarding_progress
  for each row execute function public.set_updated_at();

-- Household / parent context.
create table public.user_households (
  user_id            uuid primary key references public.profiles (id) on delete cascade,
  is_parent          boolean,
  children_count     integer check (children_count >= 0),
  child_age_bands    text[] not null default '{}',
  parent_season      text,
  cook_for_count     text,
  meal_responsibility text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger set_updated_at before update on public.user_households
  for each row execute function public.set_updated_at();

-- Food preferences (mutable; edits here must NOT change the immutable start snapshot).
create table public.user_food_preferences (
  user_id               uuid primary key references public.profiles (id) on delete cascade,
  loved_foods           text[] not null default '{}',
  disliked_foods        text[] not null default '{}',
  allergies             text[] not null default '{}',
  dietary_restrictions  text[] not null default '{}',
  favorite_cuisines     text[] not null default '{}',
  cook_time_pref        text,
  cost_importance       text,
  eat_out_frequency     text,
  same_meal_for_family  boolean,
  family_adventurousness text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create trigger set_updated_at before update on public.user_food_preferences
  for each row execute function public.set_updated_at();

-- Activity + schedule preferences.
create table public.user_activity_preferences (
  user_id                   uuid primary key references public.profiles (id) on delete cascade,
  activity_level            text,
  time_available            text,
  enjoyed_activities        text[] not null default '{}',
  activity_time_pref        text,
  schedule_unpredictability text[] not null default '{}',
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);
create trigger set_updated_at before update on public.user_activity_preferences
  for each row execute function public.set_updated_at();

-- Health / safety screening. STRICTLY owner-only. Drives target-engine safety routing.
create table public.health_safety_flags (
  user_id                 uuid primary key references public.profiles (id) on delete cascade,
  is_pregnant             boolean not null default false,
  is_recent_postpartum    boolean not null default false,
  is_breastfeeding        boolean not null default false,
  has_health_conditions   boolean not null default false,
  under_medical_care      boolean not null default false,
  eating_disorder_history boolean not null default false,
  safety_status           text not null default 'STANDARD_AUTOMATED_PLAN_ELIGIBLE'
                            check (safety_status in ('STANDARD_AUTOMATED_PLAN_ELIGIBLE', 'SAFE_REVIEW_REQUIRED')),
  flags                   text[] not null default '{}',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create trigger set_updated_at before update on public.health_safety_flags
  for each row execute function public.set_updated_at();
comment on table public.health_safety_flags is
  'Sensitive safety screening. Owner-only RLS. Never used to imply medical clearance.';

-- nutrition_targets: the *current* (mutable) plan target. Extend to hold the full recommendation and
-- allow a null calorie target for SAFE_REVIEW_REQUIRED users (no automated deficit).
alter table public.nutrition_targets
  alter column calorie_target drop not null;
alter table public.nutrition_targets
  drop constraint if exists nutrition_targets_calorie_target_check;
alter table public.nutrition_targets
  add constraint nutrition_targets_calorie_target_check
  check (calorie_target is null or calorie_target >= 1000);
alter table public.nutrition_targets
  alter column protein_target_g drop not null;
alter table public.nutrition_targets
  add column if not exists calorie_target_low integer,
  add column if not exists calorie_target_high integer,
  add column if not exists daily_steps integer,
  add column if not exists sessions_per_week integer,
  add column if not exists target_status text
    check (target_status in ('STANDARD_AUTOMATED_PLAN_ELIGIBLE', 'SAFE_REVIEW_REQUIRED')),
  add column if not exists safety_flags text[] not null default '{}',
  add column if not exists engine_version text;

-- ============================================================
-- migrations/0011_challenge_snapshot_and_pilot.sql
-- ============================================================
-- 0011 · Phase Two — immutable challenge start snapshot + pilot baseline surveys

-- Guard function: block UPDATEs to enforce immutability at the database level.
create or replace function public.raise_immutable()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Row is immutable and cannot be updated (table %).', tg_table_name;
end;
$$;

-- The immutable record written once at enrollment. NEVER mutated by later profile edits.
create table public.challenge_start_snapshots (
  id                      uuid primary key default gen_random_uuid(),
  challenge_id            uuid not null references public.challenges (id) on delete cascade,
  challenge_member_id     uuid not null references public.challenge_members (id) on delete cascade,
  user_id                 uuid not null references public.profiles (id) on delete cascade,

  start_weight_kg         numeric(6, 3) not null,
  long_term_goal_weight_kg numeric(6, 3),
  display_weight_unit     text not null default 'lb' check (display_weight_unit in ('lb', 'kg')),

  target_status           text not null check (target_status in ('STANDARD_AUTOMATED_PLAN_ELIGIBLE', 'SAFE_REVIEW_REQUIRED')),
  safety_flags            text[] not null default '{}',
  calorie_target          integer,
  calorie_target_low      integer,
  calorie_target_high     integer,
  protein_target_g        integer,
  daily_steps             integer not null default 8000,
  sessions_per_week       integer not null default 3,
  weight_loss_low_kg      numeric(5, 2),
  weight_loss_high_kg     numeric(5, 2),

  primary_goal            text not null,
  secondary_goals         text[] not null default '{}',
  primary_motivation      text, -- private; never publicly exposed
  primary_barriers        text[] not null default '{}',
  falloff_triggers        text[] not null default '{}',
  parent_season           text,
  child_age_bands         text[] not null default '{}',
  activity_level          text,
  enjoyed_activities      text[] not null default '{}',

  baseline_confidence           integer check (baseline_confidence between 1 and 10),
  baseline_habit_satisfaction   integer check (baseline_habit_satisfaction between 1 and 10),
  baseline_food_control         integer check (baseline_food_control between 1 and 10),
  baseline_exercise_consistency integer check (baseline_exercise_consistency between 1 and 10),
  baseline_success_definition   text,

  target_engine_version   text not null,
  onboarding_version      text not null,
  challenge_rules_version text not null,

  created_at              timestamptz not null default now(),
  unique (challenge_member_id)
);
create index challenge_start_snapshots_challenge_idx on public.challenge_start_snapshots (challenge_id);
create index challenge_start_snapshots_user_idx on public.challenge_start_snapshots (user_id);

-- Enforce immutability: no updates allowed. (Deletes cascade with the member/challenge.)
create trigger challenge_start_snapshots_no_update
  before update on public.challenge_start_snapshots
  for each row execute function public.raise_immutable();

comment on table public.challenge_start_snapshots is
  'Immutable enrollment snapshot for pilot research + reproducible analytics. UPDATEs are blocked.';

-- Pilot survey system home. Baseline now; weekly-pulse / end-of-challenge tables extend this later.
create table public.pilot_baseline_surveys (
  id                   uuid primary key default gen_random_uuid(),
  challenge_member_id  uuid not null references public.challenge_members (id) on delete cascade,
  user_id              uuid not null references public.profiles (id) on delete cascade,
  confidence           integer check (confidence between 1 and 10),
  habit_satisfaction   integer check (habit_satisfaction between 1 and 10),
  food_control         integer check (food_control between 1 and 10),
  exercise_consistency integer check (exercise_consistency between 1 and 10),
  success_definition   text,
  submitted_at         timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (challenge_member_id)
);
create trigger set_updated_at before update on public.pilot_baseline_surveys
  for each row execute function public.set_updated_at();

-- ============================================================
-- migrations/0012_rls_phase2.sql
-- ============================================================
-- 0012 · Phase Two RLS — owner-only for all new personal/sensitive tables.
-- Continues the deny-by-default posture from 0009. The service role (server/edge) bypasses RLS.

alter table public.onboarding_progress         enable row level security;
alter table public.user_households             enable row level security;
alter table public.user_food_preferences       enable row level security;
alter table public.user_activity_preferences   enable row level security;
alter table public.health_safety_flags         enable row level security;
alter table public.challenge_start_snapshots   enable row level security;
alter table public.pilot_baseline_surveys      enable row level security;

-- Owner-only read/write for onboarding + preferences + safety flags.
create policy onboarding_progress_owner on public.onboarding_progress for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy user_households_owner on public.user_households for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy user_food_preferences_owner on public.user_food_preferences for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy user_activity_preferences_owner on public.user_activity_preferences for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Health/safety is the most sensitive: owner-only, no admin read at the RLS layer.
create policy health_safety_flags_owner on public.health_safety_flags for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Immutable snapshot: owner (and admin) may read; owner may insert once. No update/delete policy
-- exists, so those are denied for clients (updates are also blocked by a DB trigger).
create policy challenge_start_snapshots_select on public.challenge_start_snapshots for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy challenge_start_snapshots_insert on public.challenge_start_snapshots for insert to authenticated
  with check (user_id = auth.uid());

-- Pilot baseline: owner read/write; admin read for research aggregation.
create policy pilot_baseline_select on public.pilot_baseline_surveys for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy pilot_baseline_write on public.pilot_baseline_surveys for insert to authenticated
  with check (user_id = auth.uid());
create policy pilot_baseline_update on public.pilot_baseline_surveys for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- migrations/0013_app_state_and_profile_trigger.sql
-- ============================================================
-- 0013 · Cross-device sync + auto profile on signup
-- Adds a per-user synced app-state document (the pilot sync mechanism) and a trigger that creates a
-- profiles row automatically when a user signs up via Supabase Auth.

-- Auto-create a profile row for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(split_part(new.email, '@', 1), ''), 'Challenger'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Per-user synced app state (profile, onboarding, weight, food, activity as one owner-only document).
-- Interim pilot sync: the normalized tables remain for server-side analytics/leaderboards later.
create table if not exists public.user_app_state (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  state      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_app_state enable row level security;

create policy user_app_state_owner on public.user_app_state for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- migrations/0014_leaderboard_rpc.sql
-- ============================================================
-- 0014 · Leaderboard RPC
--
-- Ranks enrolled challengers by PERCENT of body weight lost (never absolute pounds — the healthy,
-- equal-footing way to compete). This is a SECURITY DEFINER function so it can read across users to
-- build a ranking, but it exposes ONLY non-sensitive, derived fields:
--   • first name (or display name)   • US state (state-level, never a precise location)
--   • % of body weight lost           • whether they were active in the last 24h
-- It never returns exact weight, calories, or anything private. Direct table access between users is
-- still blocked by RLS; this function is the single sanctioned cross-user read.
--
-- Source of truth is the synced app-state document (user_app_state.state->'profile'), which is the
-- freshest copy of each challenger's numbers.

create or replace function public.get_leaderboard()
returns table (
  user_id       uuid,
  display_name  text,
  state         text,
  pct_lost      numeric,
  active_recent boolean
)
language sql
security definer
set search_path = public
stable
as $$
  with base as (
    select
      s.user_id,
      coalesce(
        nullif(s.state -> 'profile' ->> 'firstName', ''),
        nullif(s.state -> 'profile' ->> 'displayName', ''),
        p.display_name,
        'Challenger'
      )                                                        as display_name,
      nullif(s.state -> 'profile' ->> 'state', '')             as state,
      nullif(s.state -> 'profile' ->> 'startWeightKg', '')::numeric  as start_kg,
      nullif(s.state -> 'profile' ->> 'latestWeightKg', '')::numeric as latest_kg,
      s.updated_at
    from public.user_app_state s
    left join public.profiles p on p.id = s.user_id
    where coalesce((s.state -> 'profile' ->> 'enrolled')::boolean, false) = true
  )
  select
    base.user_id,
    base.display_name,
    base.state,
    case
      when base.start_kg is null or base.start_kg <= 0 then 0::numeric
      else round(((base.start_kg - coalesce(base.latest_kg, base.start_kg)) / base.start_kg) * 100, 1)
    end                                                        as pct_lost,
    (base.updated_at > now() - interval '24 hours')            as active_recent
  from base
  order by pct_lost desc, base.updated_at desc;
$$;

grant execute on function public.get_leaderboard() to anon, authenticated;

-- ============================================================
-- migrations/0015_admin_and_allowlist.sql
-- ============================================================
-- 0015 · Admin: invite allowlist + reversible access control
--
-- Adds an admin role and a pilot-friendly access model that needs NO service-role key (so it runs
-- entirely against the public web app):
--   • profiles.is_admin  — who can manage the challenge
--   • profiles.disabled  — reversibly revoke a challenger's access (enforced by the app on launch)
--   • allowlist          — only invited emails may create an account
-- All management happens through admin-only SECURITY DEFINER RPCs; the tables stay locked by RLS.

alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists disabled boolean not null default false;

-- The founding admin (the pilot owner). Promote the existing account if it already exists…
update public.profiles p
set is_admin = true
from auth.users u
where u.id = p.id and lower(u.email) = 'jakemanson5@yahoo.com';

-- …and make sure a fresh signup with that email also lands as admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, is_admin)
  values (
    new.id,
    coalesce(nullif(split_part(new.email, '@', 1), ''), 'Challenger'),
    lower(new.email) = 'jakemanson5@yahoo.com'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Invite allowlist. Only emails present here may create an account.
create table if not exists public.allowlist (
  email      text primary key,
  note       text,
  added_by   uuid references auth.users (id),
  created_at timestamptz not null default now()
);
alter table public.allowlist enable row level security; -- no direct access; RPCs only

insert into public.allowlist (email, note)
values ('jakemanson5@yahoo.com', 'Founding admin')
on conflict (email) do nothing;

-- Is the current caller an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Public pre-check the signup screen calls so it can show a friendly message.
create or replace function public.is_email_allowed(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.allowlist a where lower(a.email) = lower(trim(p_email))
  );
$$;

-- Hard backstop: block any signup whose email isn't invited (defense in depth).
create or replace function public.enforce_allowlist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.allowlist a where lower(a.email) = lower(new.email)) then
    raise exception 'This email has not been invited to the challenge yet.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_allowlist_trg on auth.users;
create trigger enforce_allowlist_trg
  before insert on auth.users
  for each row execute function public.enforce_allowlist();

-- Admin RPCs (every one gated on is_admin()).
create or replace function public.admin_list_members()
returns table (
  user_id uuid, email text, display_name text, state text,
  disabled boolean, is_admin boolean, created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, u.email, p.display_name,
         nullif(s.state -> 'profile' ->> 'state', ''),
         p.disabled, p.is_admin, p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.user_app_state s on s.user_id = p.id
  where public.is_admin()
  order by p.created_at desc;
$$;

create or replace function public.admin_set_disabled(target uuid, val boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  if target = auth.uid() then raise exception 'you cannot disable your own admin account'; end if;
  update public.profiles set disabled = val, updated_at = now() where id = target;
end;
$$;

create or replace function public.admin_list_allowlist()
returns table (email text, note text, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select a.email, a.note, a.created_at
  from public.allowlist a
  where public.is_admin()
  order by a.created_at desc;
$$;

create or replace function public.admin_add_allowlist(p_email text, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  insert into public.allowlist (email, note, added_by)
  values (lower(trim(p_email)), p_note, auth.uid())
  on conflict (email) do update set note = excluded.note;
end;
$$;

create or replace function public.admin_remove_allowlist(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  delete from public.allowlist where email = lower(trim(p_email));
end;
$$;

-- The app calls this on launch: if disabled, it signs the user out.
create or replace function public.my_access()
returns table (disabled boolean, is_admin boolean)
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(p.disabled, false), coalesce(p.is_admin, false)
  from public.profiles p
  where p.id = auth.uid();
$$;

-- Keep disabled challengers off the leaderboard/map too.
create or replace function public.get_leaderboard()
returns table (
  user_id uuid, display_name text, state text, pct_lost numeric, active_recent boolean
)
language sql
security definer
set search_path = public
stable
as $$
  with base as (
    select
      s.user_id,
      coalesce(
        nullif(s.state -> 'profile' ->> 'firstName', ''),
        nullif(s.state -> 'profile' ->> 'displayName', ''),
        p.display_name,
        'Challenger'
      ) as display_name,
      nullif(s.state -> 'profile' ->> 'state', '') as state,
      nullif(s.state -> 'profile' ->> 'startWeightKg', '')::numeric  as start_kg,
      nullif(s.state -> 'profile' ->> 'latestWeightKg', '')::numeric as latest_kg,
      s.updated_at
    from public.user_app_state s
    left join public.profiles p on p.id = s.user_id
    where coalesce((s.state -> 'profile' ->> 'enrolled')::boolean, false) = true
      and coalesce(p.disabled, false) = false
  )
  select
    base.user_id,
    base.display_name,
    base.state,
    case
      when base.start_kg is null or base.start_kg <= 0 then 0::numeric
      else round(((base.start_kg - coalesce(base.latest_kg, base.start_kg)) / base.start_kg) * 100, 1)
    end as pct_lost,
    (base.updated_at > now() - interval '24 hours') as active_recent
  from base
  order by pct_lost desc, base.updated_at desc;
$$;

grant execute on function
  public.is_admin(),
  public.is_email_allowed(text),
  public.admin_list_members(),
  public.admin_set_disabled(uuid, boolean),
  public.admin_list_allowlist(),
  public.admin_add_allowlist(text, text),
  public.admin_remove_allowlist(text),
  public.my_access(),
  public.get_leaderboard()
to authenticated;

-- The signup pre-check must be callable before login.
grant execute on function public.is_email_allowed(text) to anon;

