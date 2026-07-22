-- 0016 · Meal photo board, community stats, and avatars
--
-- Adds the shared meal photo board, a combined community-stats counter, and profile face photos.
-- Photos live in public Storage buckets; only non-sensitive, opt-in content (a meal photo you chose
-- to post, a face photo you chose to upload) is ever shared.

-- ---- Storage buckets (public read; write to your own folder) -------------------------------------
insert into storage.buckets (id, name, public) values ('meal-photos', 'meal-photos', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

do $$
declare b text;
begin
  foreach b in array array['meal-photos', 'avatars'] loop
    execute format('drop policy if exists %I on storage.objects', b || ' public read');
    execute format('drop policy if exists %I on storage.objects', b || ' own write');
    execute format('drop policy if exists %I on storage.objects', b || ' own update');
    execute format('drop policy if exists %I on storage.objects', b || ' own delete');
    execute format(
      'create policy %I on storage.objects for select using (bucket_id = %L)',
      b || ' public read', b);
    execute format(
      'create policy %I on storage.objects for insert to authenticated with check (bucket_id = %L and (storage.foldername(name))[1] = auth.uid()::text)',
      b || ' own write', b);
    execute format(
      'create policy %I on storage.objects for update to authenticated using (bucket_id = %L and owner = auth.uid())',
      b || ' own update', b);
    execute format(
      'create policy %I on storage.objects for delete to authenticated using (bucket_id = %L and owner = auth.uid())',
      b || ' own delete', b);
  end loop;
end $$;

-- ---- Meal photo board ---------------------------------------------------------------------------
create table if not exists public.meal_posts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  image_url     text not null,
  caption       text,
  author_name   text,
  author_avatar text,
  created_at    timestamptz not null default now()
);
alter table public.meal_posts enable row level security;

drop policy if exists meal_posts_read on public.meal_posts;
drop policy if exists meal_posts_insert on public.meal_posts;
drop policy if exists meal_posts_delete on public.meal_posts;
-- Any signed-in challenger can see the board; you can only add/remove your own posts.
create policy meal_posts_read on public.meal_posts for select to authenticated using (true);
create policy meal_posts_insert on public.meal_posts for insert to authenticated
  with check (user_id = auth.uid());
create policy meal_posts_delete on public.meal_posts for delete to authenticated
  using (user_id = auth.uid());

-- ---- Combined community stats (lbs lost together, meals tracked, steps) --------------------------
create or replace function public.community_stats()
returns table (lbs_lost numeric, meals bigint, steps bigint, members bigint)
language sql
stable
security definer
set search_path = public
as $$
  with u as (
    select
      nullif(s.state -> 'profile' ->> 'startWeightKg', '')::numeric  as start_kg,
      nullif(s.state -> 'profile' ->> 'latestWeightKg', '')::numeric as latest_kg,
      coalesce(
        jsonb_array_length(
          case when jsonb_typeof(s.state -> 'food' -> 'entries') = 'array'
               then s.state -> 'food' -> 'entries' else '[]'::jsonb end
        ), 0) as meal_ct,
      coalesce((
        select sum((e ->> 'steps')::bigint)
        from jsonb_array_elements(
          case when jsonb_typeof(s.state -> 'steps' -> 'entries') = 'array'
               then s.state -> 'steps' -> 'entries' else '[]'::jsonb end
        ) e
      ), 0) as step_ct
    from public.user_app_state s
    left join public.profiles p on p.id = s.user_id
    where coalesce(p.disabled, false) = false
  )
  select
    round(coalesce(sum(greatest(coalesce(start_kg, 0) - coalesce(latest_kg, start_kg), 0)), 0) * 2.2046226, 1),
    coalesce(sum(meal_ct), 0)::bigint,
    coalesce(sum(step_ct), 0)::bigint,
    count(*)::bigint
  from u;
$$;

grant execute on function public.community_stats() to authenticated;

-- ---- Leaderboard now carries a face photo -------------------------------------------------------
create or replace function public.get_leaderboard()
returns table (
  user_id uuid, display_name text, state text, avatar_url text,
  pct_lost numeric, active_recent boolean
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
      nullif(s.state -> 'profile' ->> 'avatarUrl', '') as avatar_url,
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
    base.avatar_url,
    case
      when base.start_kg is null or base.start_kg <= 0 then 0::numeric
      else round(((base.start_kg - coalesce(base.latest_kg, base.start_kg)) / base.start_kg) * 100, 1)
    end as pct_lost,
    (base.updated_at > now() - interval '24 hours') as active_recent
  from base
  order by pct_lost desc, base.updated_at desc;
$$;

grant execute on function public.get_leaderboard() to authenticated;
