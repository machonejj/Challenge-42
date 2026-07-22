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
