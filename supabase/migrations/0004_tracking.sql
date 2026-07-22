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
