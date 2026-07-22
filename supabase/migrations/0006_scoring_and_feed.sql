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
