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
