-- 0019 · Leaderboard filters: today's steps + today's workout minutes
--
-- Extends get_leaderboard so the board can be ranked by weight lost, daily steps, or daily workout
-- minutes. "Today" is approximated as the last 24h of each user's synced step/activity entries
-- (avoids per-user timezone math). Still exposes only non-sensitive, derived numbers.

create or replace function public.get_leaderboard()
returns table (
  user_id uuid, display_name text, state text, avatar_url text,
  pct_lost numeric, lbs_lost numeric,
  steps_today bigint, workout_min_today numeric,
  active_recent boolean
)
language sql
security definer
set search_path = public
stable
as $$
  with base as (
    select
      s.user_id,
      s.state as st,
      coalesce(
        nullif(s.state -> 'profile' ->> 'firstName', ''),
        nullif(s.state -> 'profile' ->> 'displayName', ''),
        p.display_name,
        'Challenger'
      ) as display_name,
      nullif(s.state -> 'profile' ->> 'state', '') as us_state,
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
    base.us_state,
    base.avatar_url,
    case
      when base.start_kg is null or base.start_kg <= 0 then 0::numeric
      else round(((base.start_kg - coalesce(base.latest_kg, base.start_kg)) / base.start_kg) * 100, 1)
    end as pct_lost,
    case
      when base.start_kg is null then 0::numeric
      else round((base.start_kg - coalesce(base.latest_kg, base.start_kg)) * 2.2046226, 1)
    end as lbs_lost,
    coalesce((
      select sum((e ->> 'steps')::bigint)
      from jsonb_array_elements(
        case when jsonb_typeof(base.st -> 'steps' -> 'entries') = 'array'
             then base.st -> 'steps' -> 'entries' else '[]'::jsonb end
      ) e
      where (e ->> 'atMs')::numeric > (extract(epoch from now()) * 1000 - 86400000)
    ), 0) as steps_today,
    coalesce((
      select sum((a ->> 'durationMin')::numeric)
      from jsonb_array_elements(
        case when jsonb_typeof(base.st -> 'activity' -> 'sessions') = 'array'
             then base.st -> 'activity' -> 'sessions' else '[]'::jsonb end
      ) a
      where (a ->> 'completedAtMs')::numeric > (extract(epoch from now()) * 1000 - 86400000)
    ), 0) as workout_min_today,
    (base.updated_at > now() - interval '24 hours') as active_recent
  from base
  order by pct_lost desc, base.updated_at desc;
$$;

grant execute on function public.get_leaderboard() to authenticated;
