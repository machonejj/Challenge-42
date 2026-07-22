# Challenge42 — Security & Privacy

> **Status:** Living document · **Phase:** 1
> Privacy is a product feature here, not a compliance afterthought. This document defines the rules;
> `supabase/migrations/0009_rls_policies.sql` enforces them; app code must never work around them.

---

## 1. Threat-model summary

We hold sensitive health data (weight, calories, photos) and location. The realistic risks we design
against:

1. **Over-broad reads** — one challenger reading another's private weight/calories/photos/routes.
2. **Location exposure** — precise home/GPS leaking via the map or run tracking.
3. **Credential leakage** — a service-role key shipped in a client bundle.
4. **Consent creep** — content shared for one purpose (in-app) reused for another (public site,
   ads).
5. **Abuse/harassment** — unmoderated community content.

The controls below map to each.

## 2. Privacy defaults (must-hold invariants)

| Data                       | Default visibility | Notes                                                       |
| -------------------------- | ------------------ | ----------------------------------------------------------- |
| Weight & weigh-ins         | **Private**        | Only the owner (and authorized backend) can read.           |
| Calories / food logs       | **Private**        | Same.                                                       |
| Progress photos            | **Private**        | Storage objects are private; access via signed URLs only.   |
| Exact location / GPS route | **Always private** | Never shareable to other challengers by any setting.        |
| Map presence               | **Hidden**         | Opt-in only: `hidden` → `city` → `approximate`.             |
| Display name / avatar      | Challenge-visible  | Shown to co-challengers; not on public web without consent. |

A user only ever _increases_ their exposure by explicit, revocable choice. There is no setting that
exposes exact location.

## 3. Row-Level Security (RLS)

**RLS is enabled on every user-owned table.** Default posture is deny-all; policies grant the minimum.

### 3.1 Building blocks

- `auth.uid()` — the authenticated user id (equals `profiles.id`).
- Helper SQL functions (in `0009_rls_policies.sql`):
  - `is_member_of_challenge(challenge_id)` — true if the caller has a `challenge_members` row.
  - `is_same_challenge_as(target_user_id)` — caller shares any active challenge with the target.
  - `is_admin()` — caller is in `admin_users`.

### 3.2 Policy patterns

- **Owner-only** (weight, food logs, run routes, private settings, push tokens): `using (user_id =
auth.uid())` for select/insert/update/delete.
- **Owner-write / co-challenger-read of non-sensitive fields** (profile display name, avatar):
  readable by co-challengers via `is_same_challenge_as`, writable only by owner.
- **Challenge-scoped read** (leaderboard snapshots, feed events, posts, team standings): readable by
  members of that challenge; writable per resource rules.
- **Author-write** (posts, comments, reactions): insert/update/delete gated to the author; read
  gated to the challenge.
- **Admin override**: staff read/moderation gated by `is_admin()` — and admin is a **separate app**
  using a separate, least-privilege path (see §6).

### 3.3 The route-points rule (hard line)

`run_route_points` has a single select policy: `using (user_id = auth.uid())`. There is **no**
co-challenger read policy, no team policy, no public policy. Raw routes are visible only to the owner
and to trusted backend/edge functions using the service role for legitimate processing (e.g.
computing distance) — never returned to another client.

## 4. Location handling

- The device may capture precise GPS **transiently** during a run. It is used to compute
  distance/pace and, if the user opts to save the route, stored **only** in owner-only
  `run_route_points`.
- The **map** never uses precise coordinates. `user_locations` stores:
  - `visibility` (`hidden` | `city` | `approximate`),
  - a **coarsened** `lat`/`lng` (city centroid or jittered to an approximate area — jitter applied
    server-side/at write, so precise values never reach the row),
  - `city` / `state` strings for `city` mode.
- Presence on the map shows status + coarse position only. Two users at the same address must not be
  distinguishable on the map.

## 5. Secrets & configuration boundaries

- **The Supabase service-role key never ships to a client.** It exists only in server contexts:
  Edge Functions, the admin server, CI. Enforced by convention + `.gitignore` + code review; the
  mobile app only ever receives the **anon** key + URL, and only via `EXPO_PUBLIC_*` vars that are
  understood to be public.
- Env boundaries:
  - `apps/mobile/.env` → `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (public by
    design; RLS is the real guard).
  - `apps/admin/.env.local` → anon key for browser + **server-only** `SUPABASE_SERVICE_ROLE_KEY`
    (never `NEXT_PUBLIC_`).
  - `supabase/.env` → local dev + function secrets, provider API keys (USDA, AI). Git-ignored.
- **No secret is ever committed.** Only `.env.example` files, with placeholder values, are tracked.
- Nutrition/AI provider keys live server-side (Edge Functions). Clients call our function, not the
  provider, so third-party keys never reach devices.

## 6. Admin & privileged access

- Admin is a **separate Next.js app** with its own auth and role checks (`admin_users.role`).
- Admin uses the service role **only in server code** (route handlers / server actions), never in the
  browser bundle.
- Every privileged action is authorized by `is_admin()` in RLS **and** app-level role checks
  (defense in depth). Destructive/moderation actions should be auditable (future: `admin_audit_log`).

## 7. Consent model

Success stories and any outward-facing use of a member's data require **explicit, surface-specific,
revocable** consent. Modeled as separate rows in `success_story_consents`:

| Surface                      | Separate consent | Meaning                                            |
| ---------------------------- | ---------------- | -------------------------------------------------- |
| **In-app success gallery**   | `in_app`         | Show my story to other challengers inside the app. |
| **Public marketing website** | `public_web`     | Show my story on the public website.               |
| **Paid advertising / ads**   | `marketing`      | Use my story/photos in paid marketing.             |

**Consent for one surface never implies another.** Each is granted, timestamped, versioned, and
**revocable**; revocation removes the content from that surface. Media inherits the most restrictive
applicable consent. Before any before/after or story appears anywhere, the code checks the matching
active consent row.

## 7b. Phase Two additions (auth, onboarding, health data)

- **Auth behind an adapter.** `AuthService` has a dev/mock implementation (in-memory + AsyncStorage)
  and a `SupabaseAuthService` selected only when `EXPO_PUBLIC_SUPABASE_URL/ANON_KEY` are set, so dev
  needs no secrets. Only the **anon** key ever reaches the client; sessions persist in AsyncStorage.
  **Raw provider errors are never shown** — they map to friendly `AuthErrorCode`s.
- **Health/safety data is the most sensitive tier.** `health_safety_flags` is **owner-only** at the
  RLS layer (no co-challenger and no admin read policy), and sensitive body facts (sex, height) are
  kept **off** the co-challenger-readable `profiles` row.
- **Motivation & free-text answers are private** — stored in the owner-only draft / immutable
  snapshot and **never** publicly exposed.
- **Immutable snapshot.** `challenge_start_snapshots` blocks UPDATEs via a DB trigger; later profile
  edits cannot rewrite research history.
- **Analytics is separated from health data.** `AnalyticsService` payloads are typed to carry only
  coarse product signals (step index, day number, booleans) — **never** weight, calories, motivation
  text, or safety details. Product analytics and the primary health DB are distinct systems.
- **No medical claims / no clearance.** Safety routing returns `SAFE_REVIEW_REQUIRED` and withholds
  automated weight-loss targets; copy never implies medical clearance (see `docs/TARGET_ENGINE.md`).

## 8. Data-subject controls (designed for, phased in)

- **Export**: a user can request their data (weights, logs, posts).
- **Delete**: account deletion cascades owned rows (FKs `on delete cascade`) and purges storage
  objects; derived aggregates are anonymized.
- **Visibility**: `activity_privacy_settings` + `public_profile_preferences` let users change
  exposure at any time; changes take effect immediately (RLS reads current settings).

## 9. Community safety

- `reports` table + moderation queue (admin). Posts/comments can be hidden pending review.
- Rate limiting and content checks are enforced in Edge Functions (future phase), not the client.
- No unmoderated public broadcast surfaces in Phase One.

## 10. Storage

- Buckets are **private by default**. Progress photos and success media use signed, short-lived URLs
  minted server-side after an RLS/consent check. No public bucket holds sensitive media.

## 11. What Phase One actually implements vs. documents

- **Implemented now:** the schema with privacy columns/tables, the RLS policy migration, env
  boundaries + `.env.example` files, mock adapters that require **no** secrets, and privacy defaults
  encoded in defaults/constraints.
- **Documented, phased later:** live auth wiring, signed-URL minting, export/delete tooling, admin
  audit log, rate limiting, provider key management. None of these are worked around — they are
  stubbed behind clean boundaries so Phase One runs with zero secrets and no privacy shortcuts.
