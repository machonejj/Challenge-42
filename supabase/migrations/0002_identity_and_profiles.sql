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
