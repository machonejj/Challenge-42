-- =============================================================================================
-- Challenge42 — Development seed (LOCAL DEV ONLY)
-- =============================================================================================
-- Applied by `supabase db reset`. Everything here is CLEARLY-LABELED DEMO DATA (is_demo = true) and
-- must NEVER run against production. The mobile app's Phase-One "alive" Home screen is powered by an
-- in-app TypeScript mock (apps/mobile/features/**/mock), so this SQL seed is primarily for exercising
-- the real backend once auth is wired (Phase 2+). It stays intentionally small and readable.
--
-- No real people. Names/cities are fictional.
-- =============================================================================================

-- Fixed UUIDs so seed rows are stable across resets.
-- Demo challenge + teams -----------------------------------------------------------------------
insert into public.challenges (id, name, status, start_date, end_date, length_days, timezone, is_demo)
values ('c0000000-0000-4000-a000-000000000001', 'Winter Reset', 'active',
        '2026-01-05', '2026-02-15', 42, 'America/Los_Angeles', true)
on conflict (id) do nothing;

insert into public.teams (id, challenge_id, name, color, member_count)
values
  ('7ea00000-0000-4000-a000-000000000001', 'c0000000-0000-4000-a000-000000000001', 'Team Pine',  '#12382B', 2),
  ('7ea00000-0000-4000-a000-000000000002', 'c0000000-0000-4000-a000-000000000001', 'Team Cedar', '#1C4A38', 2),
  ('7ea00000-0000-4000-a000-000000000003', 'c0000000-0000-4000-a000-000000000001', 'Team Birch', '#C9A65B', 2)
on conflict (id) do nothing;

-- Demo people ----------------------------------------------------------------------------------
-- Creating auth.users + auth.identities is required because profiles.id references auth.users(id).
-- This block is LOCAL-DEV-ONLY and uses the standard Supabase local seed pattern.
do $$
declare
  demo record;
  members text[][] := array[
    -- id, name, city, state, team_id, start_kg, goal_kg
    array['a0000000-0000-4000-a000-000000000001','Jake M.','Palmdale','CA','7ea00000-0000-4000-a000-000000000001','118.4','100.0'],
    array['a0000000-0000-4000-a000-000000000002','Sarah L.','Austin','TX','7ea00000-0000-4000-a000-000000000001','82.1','72.0'],
    array['a0000000-0000-4000-a000-000000000003','Mike R.','Denver','CO','7ea00000-0000-4000-a000-000000000002','104.3','92.0'],
    array['a0000000-0000-4000-a000-000000000004','Jessica P.','Portland','OR','7ea00000-0000-4000-a000-000000000002','76.7','68.0'],
    array['a0000000-0000-4000-a000-000000000005','Anthony D.','Chicago','IL','7ea00000-0000-4000-a000-000000000003','126.9','108.0'],
    array['a0000000-0000-4000-a000-000000000006','Maria G.','Miami','FL','7ea00000-0000-4000-a000-000000000003','71.2','63.0']
  ];
begin
  foreach demo slice 1 in array members loop
    -- auth user (idempotent)
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', demo[1]::uuid, 'authenticated', 'authenticated',
      lower(replace(demo[2], ' ', '.')) || '@demo.challenge42.example',
      crypt('demo-password', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('display_name', demo[2]),
      false, false
    ) on conflict (id) do nothing;

    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      demo[1], demo[1]::uuid, jsonb_build_object('sub', demo[1], 'email',
        lower(replace(demo[2], ' ', '.')) || '@demo.challenge42.example'),
      'email', now(), now(), now()
    ) on conflict (provider, provider_id) do nothing;

    insert into public.profiles (id, display_name, city, state, weight_unit, distance_unit, is_demo)
    values (demo[1]::uuid, demo[2], demo[3], demo[4], 'lb', 'mi', true)
    on conflict (id) do nothing;

    insert into public.challenge_members
      (challenge_id, user_id, team_id, status, start_weight_kg, goal_weight_kg)
    values
      ('c0000000-0000-4000-a000-000000000001', demo[1]::uuid, demo[5]::uuid, 'active',
       demo[6]::numeric, demo[7]::numeric)
    on conflict (challenge_id, user_id) do nothing;

    insert into public.team_members (challenge_id, team_id, user_id)
    values ('c0000000-0000-4000-a000-000000000001', demo[5]::uuid, demo[1]::uuid)
    on conflict (challenge_id, user_id) do nothing;
  end loop;
end $$;

-- Running scores (illustrative; normally computed by the scoring engine). ----------------------
insert into public.challenge_scores
  (challenge_id, challenge_member_id, points, current_streak, longest_streak, consistency_pct, pct_weight_change, rank)
select
  m.challenge_id, m.id,
  (900 - (row_number() over (order by m.created_at)) * 40)::int,           -- descending points
  (14 - (row_number() over (order by m.created_at)))::int,                 -- varied streaks
  16, 0.86, -0.034,
  (row_number() over (order by m.created_at))::int
from public.challenge_members m
where m.challenge_id = 'c0000000-0000-4000-a000-000000000001'
on conflict (challenge_member_id) do nothing;

-- A few curated feed events -------------------------------------------------------------------
insert into public.feed_events (challenge_id, actor_display_name, type, title, detail)
values
  ('c0000000-0000-4000-a000-000000000001', 'Anthony D.', 'milestone', 'hit a 10-pound milestone', null),
  ('c0000000-0000-4000-a000-000000000001', 'Sarah L.', 'activity_completed', 'completed a 3-mile run', 'Morning Run'),
  ('c0000000-0000-4000-a000-000000000001', 'Team Pine', 'team_event', 'moved into first place', null)
on conflict do nothing;

-- Demo recipes (macros are illustrative dev values; real macros come from the verified provider). -
insert into public.recipes (title, cuisine, prep_minutes, servings, calories_per_serving, protein_per_serving_g, is_ai_generated, is_demo)
values
  ('Buffalo Chicken Bowls', 'American', 25, 4, 690, 48, false, true),
  ('Protein Breakfast Burrito', 'Mexican', 15, 2, 480, 38, false, true),
  ('Chicken Caesar Wrap', 'American', 10, 1, 510, 40, false, true),
  ('Greek Yogurt Crunch', 'Mediterranean', 5, 1, 310, 24, false, true)
on conflict do nothing;

-- Badges ---------------------------------------------------------------------------------------
insert into public.badges (slug, name, description)
values
  ('first-weigh-in', 'First Weigh-In', 'Logged your starting weight.'),
  ('7-day-streak', '7-Day Streak', 'Seven consecutive complete days.'),
  ('consistency-champ', 'Consistency Champion', 'Top-tier consistency for the challenge.'),
  ('graduate', 'Graduate', 'Completed a full 42-day challenge.')
on conflict (slug) do nothing;
