# Challenge42 — Data Model & Database Architecture

> **Status:** Living document · **Phase:** 1
> Implemented incrementally by `supabase/migrations/*`. This doc is the human-readable companion;
> the SQL is the source of truth. Where they disagree, fix the doc.

---

## 1. Principles

1. **UUID primary keys** everywhere (`gen_random_uuid()`), so ids are non-enumerable and
   client-generatable when useful.
2. **`created_at` / `updated_at`** on every table (`timestamptz`, default `now()`); `updated_at`
   maintained by a shared trigger `set_updated_at()`.
3. **Foreign keys are real and enforced**, with deliberate `on delete` behavior (mostly `cascade`
   for owned rows, `restrict` for reference data).
4. **Constraints encode invariants** — check constraints for enums-as-text, ranges (e.g. weight > 0),
   and uniqueness (one membership per user per challenge).
5. **Separate ephemeral realtime state from persistent history.** Live presence (who is online / working
   out right now) is **not** a table that we hammer with writes — it lives in Supabase Realtime
   Presence. We persist only durable facts (a completed activity session, a milestone feed event).
   See [§7](#7-realtime-ephemeral-vs-persistent).
6. **Normalize by default; denormalize deliberately.** A few read-optimized snapshot/summary tables
   exist for leaderboard and challenge-completion performance; they are clearly named `*_snapshots`
   / `*_summaries` and are derived, not authoritative.
7. **Enums as text + check constraint**, not Postgres `enum` types — text enums are far easier to
   evolve (adding a value doesn't require an `ALTER TYPE` migration dance) and mirror cleanly to
   TypeScript union types in `packages/types`.
8. **Privacy is modeled, not bolted on.** Visibility columns and dedicated consent/visibility tables
   exist from day one. RLS policies (documented in [`SECURITY.md`](./SECURITY.md)) enforce them.

## 2. Naming & conventions

- Tables: `snake_case`, plural (`weight_entries`).
- FK columns: `<singular>_id` (`challenge_id`, `user_id`).
- `user_id` always references `profiles.id` (which equals `auth.users.id`).
- Money in integer **cents**; distances in **meters**; durations in **seconds**; mass stored in a
  canonical unit (**grams** for food, **kilograms** for body weight) with the user's display unit
  kept on the profile. This avoids float unit drift; display conversion happens in
  `packages/domain`.
- Booleans are `is_*` / `has_*`.

## 3. Domain map

Tables grouped by bounded context. (~40 tables total in the target schema; Phase One migrations
create the foundational set and stub the rest as needed.)

### 3.1 Identity & profile

| Table                        | Purpose                                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| `profiles`                   | 1:1 with `auth.users`. Display name, avatar, city/state, units, cooking prefs, defaults. |
| `nutrition_targets`          | Per-user (optionally per-challenge) calorie & protein targets, computed conservatively.  |
| `activity_privacy_settings`  | Per-user toggles: weight/calorie/photo visibility, map visibility mode, route sharing.   |
| `public_profile_preferences` | What a user exposes to other challengers vs. the public site.                            |
| `push_tokens`                | Expo push tokens per device; used by notifications.                                      |

`profiles` never stores raw email/password (Supabase Auth owns those).

### 3.2 Challenge, teams, membership

| Table               | Purpose                                                                    |
| ------------------- | -------------------------------------------------------------------------- |
| `challenges`        | A 42-day cohort: name, start/end dates, status, config (length, timezone). |
| `challenge_members` | Join: user ↔ challenge, start weight, goal weight, join date, status.      |
| `teams`             | Team within a challenge: name, color, crest.                               |
| `team_members`      | Join: user ↔ team (a user is on one team per challenge).                   |

`challenge_members` is the anchor for a user's participation: starting weight, goal weight, and
current standing all hang off it. Unique `(challenge_id, user_id)`.

### 3.3 Tracking (weight & food)

| Table              | Purpose                                                                       |
| ------------------ | ----------------------------------------------------------------------------- |
| `weight_entries`   | One weigh-in: `weight_kg`, `measured_at`, source, note. Private by default.   |
| `food_log_entries` | A meal slot on a day (breakfast/lunch/dinner/snack) for a user.               |
| `food_log_items`   | Line items within an entry, each with provider-verified nutrition + quantity. |
| `daily_checkins`   | One row per user per challenge-day: rolls up which actions were completed.    |

`food_log_items.calories` / `protein_g` are copied from the nutrition provider **at log time**
(point-in-time snapshot) so historical logs don't drift if provider data changes.

### 3.4 Nutrition data, recipes & meal plans

| Table                | Purpose                                                             |
| -------------------- | ------------------------------------------------------------------- |
| `recipes`            | A recipe: title, cuisine, time, difficulty, servings, macros/serv.  |
| `recipe_ingredients` | Ingredient lines for a recipe (quantity, unit, provider food ref).  |
| `meal_plans`         | A user's plan for a challenge/date-range with constraints snapshot. |
| `meal_plan_days`     | A day within a plan.                                                |
| `meal_plan_meals`    | A meal slot on a plan day, referencing a recipe (or ad-hoc).        |

**Nutrition source of truth:** a `nutrition_provider` abstraction (interface in
`packages/domain`, adapters for USDA FoodData Central and a dev/mock provider). Recipes and food
items reference an external `provider_food_id` + cached macros. AI may generate recipe _structure_
and _ideas_ but macros are reconciled against the provider.

### 3.5 Scoring & leaderboards

| Table                   | Purpose                                                                  |
| ----------------------- | ------------------------------------------------------------------------ |
| `challenge_scores`      | Per-user per-challenge running score: points, streak, consistency, rank. |
| `leaderboard_snapshots` | Periodic denormalized ranking rows for fast reads + rank-movement (↑/↓). |

See [§6 Scoring model](#6-scoring-model).

### 3.6 Community & feed

| Table         | Purpose                                                                         |
| ------------- | ------------------------------------------------------------------------------- |
| `posts`       | Community post: author, challenge, section (for-you/wins/…), body, media refs.  |
| `comments`    | Comment on a post.                                                              |
| `reactions`   | Reaction on a post/comment/activity (emoji kind).                               |
| `feed_events` | Persistent, feed-worthy events (milestone, shared meal, completed activity, …). |

`feed_events` is the **curated, persistent** stream (distinct from ephemeral presence). Only
meaningful events are written here — see [`PRODUCT_SPEC.md` §6.4](./PRODUCT_SPEC.md).

### 3.7 Activity, workouts & runs

| Table                        | Purpose                                                                   |
| ---------------------------- | ------------------------------------------------------------------------- |
| `activity_types`             | Reference: run, walk, strength, cycling, yoga, hiit, sports, other.       |
| `activity_sessions`          | A **completed or in-progress** session: `started_at`, `ended_at`, status. |
| `workout_templates`          | Reusable workout definitions (e.g. "Push Day").                           |
| `workout_template_exercises` | Exercises within a template.                                              |
| `workout_session_exercises`  | Actual logged sets/reps for a session.                                    |
| `run_sessions`               | Run/walk specifics: distance_m, duration_s, avg pace.                     |
| `run_route_points`           | Raw GPS points for a run. **Owner-only. Never exposed to others.**        |
| `activity_cheers`            | Cheers (🔥💪👏🚀) sent to an activity session.                            |

`activity_sessions.started_at` is authoritative for the live timer; clients compute elapsed as
`now() - started_at`. We do **not** write elapsed seconds continuously.

### 3.8 Location & map

| Table            | Purpose                                                                           |
| ---------------- | --------------------------------------------------------------------------------- |
| `user_locations` | Coarse, opt-in location for the map: city/state + **fuzzed** lat/lng + precision. |

`user_locations` never stores precise home coordinates. It stores a visibility mode and coordinates
already coarsened to city-level or an approximate area (jittered). Exact GPS lives only transiently
in the run capture and, if persisted, in owner-only `run_route_points`.

### 3.9 Success gallery & alumni

| Table                            | Purpose                                                              |
| -------------------------------- | -------------------------------------------------------------------- |
| `challenge_completion_summaries` | Immutable end-of-challenge rollup per member (derived).              |
| `success_stories`                | A curated alumni story (draft → in-app → public → marketing).        |
| `success_story_media`            | Before/after and progress media for a story.                         |
| `success_story_consents`         | **Separate consent rows per surface** (in-app / public / marketing). |
| `graduate_badges`                | Badges specific to finishing a challenge.                            |

### 3.10 Gamification & system

| Table           | Purpose                                                     |
| --------------- | ----------------------------------------------------------- |
| `badges`        | Badge catalog (name, criteria, art).                        |
| `user_badges`   | Earned badges (user ↔ badge, challenge, earned_at).         |
| `notifications` | In-app notification records (type, payload, read state).    |
| `reports`       | User reports for moderation (subject ref, reason, status).  |
| `admin_users`   | Staff with admin roles (role enum), separate from profiles. |

## 4. Key relationships (text ERD)

```
auth.users 1─1 profiles
profiles 1─* challenge_members *─1 challenges
challenges 1─* teams 1─* team_members *─1 profiles
challenge_members 1─* weight_entries
challenge_members 1─* daily_checkins
profiles 1─* food_log_entries 1─* food_log_items
profiles 1─* meal_plans 1─* meal_plan_days 1─* meal_plan_meals *─1 recipes 1─* recipe_ingredients
challenge_members 1─1 challenge_scores        (running score)
challenges 1─* leaderboard_snapshots
profiles 1─* activity_sessions ─(run)─1 run_sessions 1─* run_route_points   [owner-only]
activity_sessions 1─* activity_cheers
profiles 1─* posts 1─* comments; posts/comments/sessions 1─* reactions
challenges 1─* feed_events
challenge_members 1─1 challenge_completion_summaries 1─* success_stories 1─* success_story_consents
```

## 5. Indexing strategy (initial)

- Every FK column gets an index (Postgres does **not** auto-index FKs).
- Hot read paths:
  - `weight_entries (challenge_member_id, measured_at desc)`
  - `food_log_entries (user_id, log_date)` and `food_log_items (entry_id)`
  - `daily_checkins (challenge_id, checkin_date)` and unique `(challenge_member_id, checkin_date)`
  - `challenge_scores (challenge_id, points desc)` for ranking
  - `leaderboard_snapshots (challenge_id, category, captured_at desc, rank)`
  - `feed_events (challenge_id, created_at desc)`
  - `activity_sessions (challenge_id, status)` partial index `where status = 'in_progress'`
  - `run_route_points (run_session_id, sequence)`
- Uniqueness: `challenge_members (challenge_id, user_id)`, `team_members (challenge_id, user_id)`,
  `daily_checkins (challenge_member_id, checkin_date)`, `user_badges (user_id, badge_id, challenge_id)`.

## 6. Scoring model

The competitive heart of the product. Implemented in `packages/domain/src/scoring.ts` and unit
tested. **The database stores results; the algorithm lives in shared code** so mobile, admin, and
edge functions agree.

### 6.1 Design goals

- Reward **consistency and healthy daily actions**, not deprivation.
- Be **bounded and legible** — a day is scored 0–100; users understand "72/100 today".
- **Never** create incentive to starve, crash-diet, over-exercise, or weigh obsessively.
- Normalize team competition for size.

### 6.2 Daily score (0–100)

A day's score is the sum of capped components. Each component is **binary-ish and satisfiable by a
healthy action** — you cannot earn more by doing something unhealthy.

| Component            | Max pts | Earned by                                                           |
| -------------------- | ------- | ------------------------------------------------------------------- |
| Logged food          | 25      | Logging the day's intake at all (engagement, not amount).           |
| Stayed in range      | 20      | Calories within a **healthy band** around target (not "ate least"). |
| Completed plan meals | 20      | Completing planned meals (up to the day's planned count).           |
| Movement             | 20      | Any qualifying activity session that day (capped — more ≠ more).    |
| Weigh-in cadence     | 5       | A weigh-in when one is **due** (weekly cadence; no daily pressure). |
| Hydration / check-in | 10      | Simple daily check-in completed.                                    |

**"Stayed in range" is symmetric.** Eating far _under_ target scores the same as far over — i.e.
**zero** for that component. Undereating is never rewarded. See `scoring.ts` `caloriesInRange()`.
Movement is capped so a 3-hour workout earns exactly what a solid 30-minute one does.

### 6.3 Running challenge score

`challenge_scores.points` accumulates daily scores. Derived fields:

- `current_streak` — consecutive days with score ≥ a "counts as done" threshold (default 60).
- `consistency_pct` — days-completed / days-elapsed.
- `pct_weight_change` — `(current - start) / start`, for the % leaderboard (loss shows negative).

### 6.4 Leaderboards

- **Overall** and **Consistency** rank on the consistency-weighted score — the default competitive
  ranking.
- **Streak** ranks on `current_streak`.
- **% change** ranks on `pct_weight_change` (secondary; framed as progress, not a race to the bottom
  — UI shows a healthy-range shading and never celebrates extreme values).
- **Total pounds lost is intentionally NOT a leaderboard.**

### 6.5 Team normalization

Team score = **average member score** (per-capita), not sum. A team's standing is its members' mean
consistency score, so a 30-person team and a 6-person team compete fairly. Team goals ("N members
completed movement today") are expressed as fractions of team size.

## 7. Realtime: ephemeral vs. persistent

| Concern                                   | Where it lives                          | Written to Postgres? |
| ----------------------------------------- | --------------------------------------- | -------------------- |
| Who is online / their live activity state | Supabase Realtime **Presence**          | No                   |
| Live timer elapsed seconds                | Computed client-side from `started_at`  | No                   |
| "31 working out right now" counts         | Derived from presence                   | No                   |
| A completed workout/run                   | `activity_sessions` (+ `run_sessions`)  | Yes                  |
| A milestone / shared meal / big win       | `feed_events`                           | Yes                  |
| Cheers on a live activity                 | `activity_cheers` (persist) + broadcast | Yes                  |

Presence payload (conceptual, not a table):

```
{ userId, displayName, avatarUrl, city, state,
  activityStatus: OFFLINE|ONLINE|RUNNING|WALKING|WORKING_OUT|CYCLING|OTHER_ACTIVITY,
  activitySessionId, activityTitle, activityStartedAt }
```

Important-but-not-durable updates (e.g. "Sarah just passed mile 2") use **Realtime broadcast**, not
inserts. Only durable, feed-worthy facts hit `feed_events`.

## 8. Migration plan (Phase One)

Migrations are timestamp-prefixed and additive. Phase One ships:

1. `0001_extensions_and_helpers.sql` — `pgcrypto`, `set_updated_at()` trigger fn, enums-as-check
   helper comments.
2. `0002_identity_and_profiles.sql` — `profiles`, `nutrition_targets`, privacy/preferences,
   `push_tokens`.
3. `0003_challenges_and_teams.sql` — `challenges`, `challenge_members`, `teams`, `team_members`.
4. `0004_tracking.sql` — `weight_entries`, `food_log_entries`, `food_log_items`, `daily_checkins`.
5. `0005_nutrition_and_plans.sql` — `recipes`, `recipe_ingredients`, `meal_plans`, `meal_plan_days`,
   `meal_plan_meals`.
6. `0006_scoring_and_feed.sql` — `challenge_scores`, `leaderboard_snapshots`, `posts`, `comments`,
   `reactions`, `feed_events`.
7. `0007_activity_and_map.sql` — activity/workout/run tables, `activity_cheers`, `user_locations`.
8. `0008_success_and_system.sql` — success gallery, consents, badges, notifications, reports,
   `admin_users`.
9. `0009_rls_policies.sql` — enable RLS on all user-owned tables + policies (see `SECURITY.md`).

`seed.sql` populates clearly-labeled demo data for local dev.

> Phase One goal is a **coherent, reviewable foundation** — not every future column. Later phases add
> columns/tables via new additive migrations rather than rewriting these.

## 9. Migration plan (Phase Two — Auth + Parent Onboarding)

Additive migrations `0010–0012`:

10. `0010_onboarding_and_prefs.sql` — `onboarding_progress` (draft + resume), `user_households`,
    `user_food_preferences`, `user_activity_preferences`, `health_safety_flags` (sensitive,
    owner-only); adds `profiles.first_name`; extends `nutrition_targets` to hold the full current
    recommendation and to allow a **null calorie target** for `SAFE_REVIEW_REQUIRED` users.
11. `0011_challenge_snapshot_and_pilot.sql` — **`challenge_start_snapshots`** (immutable — a DB
    trigger blocks all UPDATEs) and `pilot_baseline_surveys` (the pilot survey system's home).
12. `0012_rls_phase2.sql` — owner-only RLS for all Phase Two tables; the snapshot allows owner+admin
    read and owner insert-once, with no update/delete policy.

**Design notes.** Sensitive body/safety data (sex, height, safety flags) is **not** placed on the
co-challenger-readable `profiles` row — it lives in owner-only tables (`health_safety_flags`) and the
immutable snapshot. `onboarding_progress.answers` is a jsonb draft for fast resume; on completion the
app also writes the normalized `user_*` tables + the immutable snapshot. **Editing current
preferences never mutates a historical `challenge_start_snapshot`** (enforced by the immutability
trigger). Version stamps (`target_engine_version`, `onboarding_version`, `challenge_rules_version`)
make every snapshot reproducible.
