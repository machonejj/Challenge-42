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
