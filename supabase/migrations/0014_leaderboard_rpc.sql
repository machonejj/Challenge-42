-- 0014 · Leaderboard RPC
--
-- Ranks enrolled challengers by PERCENT of body weight lost (never absolute pounds — the healthy,
-- equal-footing way to compete). This is a SECURITY DEFINER function so it can read across users to
-- build a ranking, but it exposes ONLY non-sensitive, derived fields:
--   • first name (or display name)   • US state (state-level, never a precise location)
--   • % of body weight lost           • whether they were active in the last 24h
-- It never returns exact weight, calories, or anything private. Direct table access between users is
-- still blocked by RLS; this function is the single sanctioned cross-user read.
--
-- Source of truth is the synced app-state document (user_app_state.state->'profile'), which is the
-- freshest copy of each challenger's numbers.

create or replace function public.get_leaderboard()
returns table (
  user_id       uuid,
  display_name  text,
  state         text,
  pct_lost      numeric,
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
      coalesce(
        nullif(s.state -> 'profile' ->> 'firstName', ''),
        nullif(s.state -> 'profile' ->> 'displayName', ''),
        p.display_name,
        'Challenger'
      )                                                        as display_name,
      nullif(s.state -> 'profile' ->> 'state', '')             as state,
      nullif(s.state -> 'profile' ->> 'startWeightKg', '')::numeric  as start_kg,
      nullif(s.state -> 'profile' ->> 'latestWeightKg', '')::numeric as latest_kg,
      s.updated_at
    from public.user_app_state s
    left join public.profiles p on p.id = s.user_id
    where coalesce((s.state -> 'profile' ->> 'enrolled')::boolean, false) = true
  )
  select
    base.user_id,
    base.display_name,
    base.state,
    case
      when base.start_kg is null or base.start_kg <= 0 then 0::numeric
      else round(((base.start_kg - coalesce(base.latest_kg, base.start_kg)) / base.start_kg) * 100, 1)
    end                                                        as pct_lost,
    (base.updated_at > now() - interval '24 hours')            as active_recent
  from base
  order by pct_lost desc, base.updated_at desc;
$$;

grant execute on function public.get_leaderboard() to anon, authenticated;
