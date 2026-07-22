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
