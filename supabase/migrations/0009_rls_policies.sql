-- 0009 · Row-Level Security
-- Default posture is deny-all: RLS is enabled and policies grant the minimum. The service role
-- (server/edge only) bypasses RLS for computed writes (scores, snapshots, feed events).
-- See docs/SECURITY.md for the full rationale.

-- ---- Helper functions (SECURITY DEFINER to avoid RLS recursion on membership lookups) ----------

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users a where a.user_id = auth.uid());
$$;

create or replace function public.is_member_of_challenge(p_challenge_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.challenge_members m
    where m.challenge_id = p_challenge_id and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_same_challenge_as(p_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.challenge_members me
    join public.challenge_members them on them.challenge_id = me.challenge_id
    where me.user_id = auth.uid() and them.user_id = p_user_id
  );
$$;

-- Enable RLS on every user-facing table. (Reference tables get permissive read policies below.)
alter table public.profiles                       enable row level security;
alter table public.nutrition_targets              enable row level security;
alter table public.activity_privacy_settings      enable row level security;
alter table public.public_profile_preferences     enable row level security;
alter table public.push_tokens                    enable row level security;
alter table public.challenges                      enable row level security;
alter table public.teams                           enable row level security;
alter table public.challenge_members               enable row level security;
alter table public.team_members                    enable row level security;
alter table public.weight_entries                  enable row level security;
alter table public.food_log_entries                enable row level security;
alter table public.food_log_items                  enable row level security;
alter table public.daily_checkins                  enable row level security;
alter table public.recipes                         enable row level security;
alter table public.recipe_ingredients              enable row level security;
alter table public.meal_plans                      enable row level security;
alter table public.meal_plan_days                  enable row level security;
alter table public.meal_plan_meals                 enable row level security;
alter table public.challenge_scores                enable row level security;
alter table public.leaderboard_snapshots           enable row level security;
alter table public.posts                           enable row level security;
alter table public.comments                        enable row level security;
alter table public.reactions                       enable row level security;
alter table public.feed_events                     enable row level security;
alter table public.activity_types                  enable row level security;
alter table public.activity_sessions               enable row level security;
alter table public.workout_templates               enable row level security;
alter table public.workout_template_exercises      enable row level security;
alter table public.workout_session_exercises       enable row level security;
alter table public.run_sessions                    enable row level security;
alter table public.run_route_points                enable row level security;
alter table public.activity_cheers                 enable row level security;
alter table public.user_locations                  enable row level security;
alter table public.challenge_completion_summaries  enable row level security;
alter table public.success_stories                 enable row level security;
alter table public.success_story_media             enable row level security;
alter table public.success_story_consents          enable row level security;
alter table public.badges                          enable row level security;
alter table public.graduate_badges                 enable row level security;
alter table public.user_badges                     enable row level security;
alter table public.notifications                   enable row level security;
alter table public.reports                         enable row level security;
alter table public.admin_users                     enable row level security;

-- ---- Identity ---------------------------------------------------------------------------------

-- Profiles: readable by self, co-challengers, and admins; writable only by self.
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_same_challenge_as(id) or public.is_admin());
create policy profiles_insert on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Owner-only private settings.
create policy nutrition_targets_owner on public.nutrition_targets for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy privacy_settings_owner on public.activity_privacy_settings for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy public_prefs_owner on public.public_profile_preferences for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy push_tokens_owner on public.push_tokens for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- Challenge & teams ------------------------------------------------------------------------

create policy challenges_select on public.challenges for select to authenticated
  using (public.is_member_of_challenge(id) or public.is_admin());

create policy teams_select on public.teams for select to authenticated
  using (public.is_member_of_challenge(challenge_id) or public.is_admin());

create policy challenge_members_select on public.challenge_members for select to authenticated
  using (user_id = auth.uid() or public.is_member_of_challenge(challenge_id) or public.is_admin());
create policy challenge_members_write_own on public.challenge_members for insert to authenticated
  with check (user_id = auth.uid());
create policy challenge_members_update_own on public.challenge_members for update to authenticated
  using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

create policy team_members_select on public.team_members for select to authenticated
  using (public.is_member_of_challenge(challenge_id) or public.is_admin());

-- ---- Tracking (PRIVATE by default) ------------------------------------------------------------

create policy weight_entries_owner on public.weight_entries for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy food_log_entries_owner on public.food_log_entries for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy food_log_items_owner on public.food_log_items for all to authenticated
  using (exists (select 1 from public.food_log_entries e where e.id = entry_id and e.user_id = auth.uid()))
  with check (exists (select 1 from public.food_log_entries e where e.id = entry_id and e.user_id = auth.uid()));

create policy daily_checkins_owner on public.daily_checkins for all to authenticated
  using (exists (select 1 from public.challenge_members m where m.id = challenge_member_id and m.user_id = auth.uid()))
  with check (exists (select 1 from public.challenge_members m where m.id = challenge_member_id and m.user_id = auth.uid()));

-- ---- Nutrition & plans ------------------------------------------------------------------------

-- Recipes/ingredients are shared reference content: readable by all authenticated users.
create policy recipes_read on public.recipes for select to authenticated using (true);
create policy recipe_ingredients_read on public.recipe_ingredients for select to authenticated using (true);
create policy activity_types_read on public.activity_types for select to authenticated using (true);
create policy badges_read on public.badges for select to authenticated using (true);
create policy graduate_badges_read on public.graduate_badges for select to authenticated using (true);

create policy meal_plans_owner on public.meal_plans for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy meal_plan_days_owner on public.meal_plan_days for all to authenticated
  using (exists (select 1 from public.meal_plans p where p.id = meal_plan_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.meal_plans p where p.id = meal_plan_id and p.user_id = auth.uid()));
create policy meal_plan_meals_owner on public.meal_plan_meals for all to authenticated
  using (exists (
    select 1 from public.meal_plan_days d
    join public.meal_plans p on p.id = d.meal_plan_id
    where d.id = meal_plan_day_id and p.user_id = auth.uid()))
  with check (exists (
    select 1 from public.meal_plan_days d
    join public.meal_plans p on p.id = d.meal_plan_id
    where d.id = meal_plan_day_id and p.user_id = auth.uid()));

-- ---- Scoring & feed (read within challenge; writes are server/edge via service role) ----------

create policy challenge_scores_select on public.challenge_scores for select to authenticated
  using (public.is_member_of_challenge(challenge_id) or public.is_admin());
create policy leaderboard_snapshots_select on public.leaderboard_snapshots for select to authenticated
  using (public.is_member_of_challenge(challenge_id) or public.is_admin());
create policy feed_events_select on public.feed_events for select to authenticated
  using (public.is_member_of_challenge(challenge_id) or public.is_admin());

-- ---- Community --------------------------------------------------------------------------------

create policy posts_select on public.posts for select to authenticated
  using ((public.is_member_of_challenge(challenge_id) and not is_hidden) or author_id = auth.uid() or public.is_admin());
create policy posts_insert on public.posts for insert to authenticated
  with check (author_id = auth.uid() and public.is_member_of_challenge(challenge_id));
create policy posts_modify on public.posts for update to authenticated
  using (author_id = auth.uid() or public.is_admin()) with check (author_id = auth.uid() or public.is_admin());
create policy posts_delete on public.posts for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

create policy comments_select on public.comments for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id
                 and (public.is_member_of_challenge(p.challenge_id) or public.is_admin()))
         and (not is_hidden or author_id = auth.uid() or public.is_admin()));
create policy comments_insert on public.comments for insert to authenticated
  with check (author_id = auth.uid()
              and exists (select 1 from public.posts p where p.id = post_id and public.is_member_of_challenge(p.challenge_id)));
create policy comments_modify on public.comments for update to authenticated
  using (author_id = auth.uid() or public.is_admin()) with check (author_id = auth.uid() or public.is_admin());
create policy comments_delete on public.comments for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

create policy reactions_select on public.reactions for select to authenticated using (true);
create policy reactions_write_own on public.reactions for insert to authenticated
  with check (user_id = auth.uid());
create policy reactions_delete_own on public.reactions for delete to authenticated
  using (user_id = auth.uid());

-- ---- Activity, workouts, runs -----------------------------------------------------------------

-- Live activity is visible to co-challengers; owner can write.
create policy activity_sessions_select on public.activity_sessions for select to authenticated
  using (user_id = auth.uid() or public.is_same_challenge_as(user_id) or public.is_admin());
create policy activity_sessions_write on public.activity_sessions for insert to authenticated
  with check (user_id = auth.uid());
create policy activity_sessions_update on public.activity_sessions for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy workout_templates_rw on public.workout_templates for all to authenticated
  using (owner_id = auth.uid() or is_demo) with check (owner_id = auth.uid());
create policy wte_rw on public.workout_template_exercises for all to authenticated
  using (exists (select 1 from public.workout_templates t where t.id = template_id and (t.owner_id = auth.uid() or t.is_demo)))
  with check (exists (select 1 from public.workout_templates t where t.id = template_id and t.owner_id = auth.uid()));
create policy wse_owner on public.workout_session_exercises for all to authenticated
  using (exists (select 1 from public.activity_sessions s where s.id = session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.activity_sessions s where s.id = session_id and s.user_id = auth.uid()));

create policy run_sessions_select on public.run_sessions for select to authenticated
  using (exists (select 1 from public.activity_sessions s where s.id = activity_session_id
                 and (s.user_id = auth.uid() or public.is_same_challenge_as(s.user_id))));
create policy run_sessions_write on public.run_sessions for all to authenticated
  using (exists (select 1 from public.activity_sessions s where s.id = activity_session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.activity_sessions s where s.id = activity_session_id and s.user_id = auth.uid()));

-- THE HARD LINE: raw GPS routes are OWNER-ONLY. No co-challenger/team/public read policy exists.
create policy run_route_points_owner_only on public.run_route_points for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy activity_cheers_select on public.activity_cheers for select to authenticated
  using (exists (select 1 from public.activity_sessions s where s.id = activity_session_id
                 and (s.user_id = auth.uid() or public.is_same_challenge_as(s.user_id))));
create policy activity_cheers_write on public.activity_cheers for insert to authenticated
  with check (sender_id = auth.uid());

-- ---- Map location: coarse, opt-in read by co-challengers; owner writes ------------------------

create policy user_locations_select on public.user_locations for select to authenticated
  using (user_id = auth.uid()
         or (visibility <> 'hidden' and public.is_same_challenge_as(user_id))
         or public.is_admin());
create policy user_locations_write on public.user_locations for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- Success gallery (surface consent enforced at query/edge layer; RLS gives the floor) ------

create policy completion_summaries_select on public.challenge_completion_summaries for select to authenticated
  using (exists (select 1 from public.challenge_members m where m.id = challenge_member_id
                 and (m.user_id = auth.uid() or public.is_member_of_challenge(m.challenge_id)))
         or public.is_admin());

create policy success_stories_select on public.success_stories for select to authenticated
  using (status = 'published' or profile_id = auth.uid() or public.is_admin());
create policy success_stories_write on public.success_stories for all to authenticated
  using (profile_id = auth.uid() or public.is_admin()) with check (profile_id = auth.uid() or public.is_admin());

create policy success_media_owner on public.success_story_media for all to authenticated
  using (exists (select 1 from public.success_stories s where s.id = success_story_id
                 and (s.profile_id = auth.uid() or public.is_admin())))
  with check (exists (select 1 from public.success_stories s where s.id = success_story_id and s.profile_id = auth.uid()));

create policy success_consents_owner on public.success_story_consents for all to authenticated
  using (exists (select 1 from public.success_stories s where s.id = success_story_id
                 and (s.profile_id = auth.uid() or public.is_admin())))
  with check (exists (select 1 from public.success_stories s where s.id = success_story_id and s.profile_id = auth.uid()));

-- ---- Badges, notifications, reports, admin ----------------------------------------------------

create policy user_badges_select on public.user_badges for select to authenticated
  using (user_id = auth.uid() or public.is_same_challenge_as(user_id) or public.is_admin());

create policy notifications_owner on public.notifications for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy reports_insert on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());
create policy reports_select on public.reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());

create policy admin_users_select on public.admin_users for select to authenticated
  using (public.is_admin());
