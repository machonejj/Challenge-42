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
