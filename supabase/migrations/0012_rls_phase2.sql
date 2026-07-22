-- 0012 · Phase Two RLS — owner-only for all new personal/sensitive tables.
-- Continues the deny-by-default posture from 0009. The service role (server/edge) bypasses RLS.

alter table public.onboarding_progress         enable row level security;
alter table public.user_households             enable row level security;
alter table public.user_food_preferences       enable row level security;
alter table public.user_activity_preferences   enable row level security;
alter table public.health_safety_flags         enable row level security;
alter table public.challenge_start_snapshots   enable row level security;
alter table public.pilot_baseline_surveys      enable row level security;

-- Owner-only read/write for onboarding + preferences + safety flags.
create policy onboarding_progress_owner on public.onboarding_progress for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy user_households_owner on public.user_households for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy user_food_preferences_owner on public.user_food_preferences for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy user_activity_preferences_owner on public.user_activity_preferences for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Health/safety is the most sensitive: owner-only, no admin read at the RLS layer.
create policy health_safety_flags_owner on public.health_safety_flags for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Immutable snapshot: owner (and admin) may read; owner may insert once. No update/delete policy
-- exists, so those are denied for clients (updates are also blocked by a DB trigger).
create policy challenge_start_snapshots_select on public.challenge_start_snapshots for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy challenge_start_snapshots_insert on public.challenge_start_snapshots for insert to authenticated
  with check (user_id = auth.uid());

-- Pilot baseline: owner read/write; admin read for research aggregation.
create policy pilot_baseline_select on public.pilot_baseline_surveys for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy pilot_baseline_write on public.pilot_baseline_surveys for insert to authenticated
  with check (user_id = auth.uid());
create policy pilot_baseline_update on public.pilot_baseline_surveys for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
