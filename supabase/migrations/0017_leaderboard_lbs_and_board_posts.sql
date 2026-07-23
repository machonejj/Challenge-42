-- 0017 · Exact pounds on the leaderboard + text posts on the kitchen-table board
--
-- The owner opted in to showing exact weight lost publicly, so the leaderboard now also returns the
-- pounds lost (still ranked by % of body weight — the fair, healthy metric). The meal board also
-- becomes a full message board: posts can be a photo OR a text tip (meal-prep ideas, instructions,
-- niche things that worked), so image_url is now optional and a `kind` distinguishes them.

-- ---- Leaderboard: add pounds lost ---------------------------------------------------------------
create or replace function public.get_leaderboard()
returns table (
  user_id uuid, display_name text, state text, avatar_url text,
  pct_lost numeric, lbs_lost numeric, active_recent boolean
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
    case
      when base.start_kg is null then 0::numeric
      else round((base.start_kg - coalesce(base.latest_kg, base.start_kg)) * 2.2046226, 1)
    end as lbs_lost,
    (base.updated_at > now() - interval '24 hours') as active_recent
  from base
  order by pct_lost desc, base.updated_at desc;
$$;

grant execute on function public.get_leaderboard() to authenticated;

-- ---- Meal board → message board (photo OR text tip) ---------------------------------------------
alter table public.meal_posts alter column image_url drop not null;
alter table public.meal_posts add column if not exists kind text not null default 'photo';
alter table public.meal_posts drop constraint if exists meal_posts_kind_chk;
alter table public.meal_posts add constraint meal_posts_kind_chk check (kind in ('photo', 'tip'));
-- A post must have an image (photo) or a caption (tip) — never empty.
alter table public.meal_posts drop constraint if exists meal_posts_content_chk;
alter table public.meal_posts add constraint meal_posts_content_chk
  check (image_url is not null or nullif(btrim(caption), '') is not null);
