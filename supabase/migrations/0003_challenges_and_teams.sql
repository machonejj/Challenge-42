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
