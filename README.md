# Challenge42

> Working name — branding is data-driven (`packages/config`) and can be changed in one place.

A **premium, mobile-first, 42-day weight-loss & healthy-lifestyle challenge** — built to feel like a
live sporting event fused with a personal journey: elegant, competitive, community-driven, and
alive. It rewards **healthy consistency**, never deprivation, and treats **privacy as the default**.

**Phase One (this repo) delivers the foundation:** the monorepo, the five architecture docs, the
shared design system + domain logic, the initial database + RLS strategy, a polished **Home** screen
on seeded demo data, and a Next.js admin scaffold.

---

## What's here

```
challenge42/
├─ apps/
│  ├─ mobile/     Expo + React Native + TypeScript + Expo Router (iPhone-first)
│  └─ admin/      Next.js (App Router) + TypeScript — scaffold only
├─ packages/
│  ├─ config/     Brand + design tokens + product constants (framework-agnostic)
│  ├─ types/      Shared domain types + enums (mirror the DB)
│  ├─ validation/ Zod schemas + inferred types
│  └─ domain/     Pure logic: scoring, streaks, weight stats, nutrition providers (tested)
├─ supabase/
│  ├─ migrations/ 0001–0009: schema + RLS
│  ├─ functions/  Edge Function stubs
│  └─ seed.sql    Labeled demo data
└─ docs/          PRODUCT_SPEC · DATA_MODEL · DESIGN_SYSTEM · SECURITY · IMPLEMENTATION_PLAN
```

Read the docs first — they are the source of truth:

- [Product Spec](docs/PRODUCT_SPEC.md) · [Data Model](docs/DATA_MODEL.md) ·
  [Design System](docs/DESIGN_SYSTEM.md) · [Security & Privacy](docs/SECURITY.md) ·
  [Implementation Plan](docs/IMPLEMENTATION_PLAN.md)

## Prerequisites

- **Node ≥ 20** (`.nvmrc` pins 20) and **npm** (npm workspaces — no pnpm/yarn needed).
- For the mobile app: the **Expo Go** app on a phone, or an iOS/Android simulator.
- Phase One needs **no backend and no secrets** — the mobile app runs on labeled demo data.

## Setup

```bash
git clone <repo> && cd challenge42
npm install            # installs all workspaces
```

## Run

```bash
npm run mobile         # Expo dev server — press i / a / w, or scan the QR in Expo Go
npm run admin          # Next.js admin at http://localhost:3000
```

## Try the Phase Two flow (auth → parent onboarding → plan)

Runs with **zero secrets** on a dev auth mock. In the app: **Get started → Create account**
(any email + an 8+ char password) → answer the one-question-per-screen onboarding → **See my plan**
→ the “Your plan is ready” reveal → **Enter the challenge** → personalized Home. Close the app
mid-onboarding and reopen — it **resumes** where you left off. Open the avatar (top-right of Home)
for **Profile / privacy settings** and **Sign out**. To retest from scratch, sign out (clears the
dev onboarding/profile) or clear the app’s storage. Wiring real Supabase Auth is a matter of setting
`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Target-engine rules live in
[docs/TARGET_ENGINE.md](docs/TARGET_ENGINE.md).

## Quality gates

```bash
npm run typecheck      # tsc across all workspaces
npm run lint           # ESLint (shared packages)
npm run format:check   # Prettier
npm test               # Vitest (domain, validation, mobile data layer)
```

All four pass in this repo. CI runs them on every push/PR (`.github/workflows/ci.yml`).

## Database (optional in Phase One)

The schema + RLS live in `supabase/migrations`. With the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase start         # local Postgres + Auth + Studio
supabase db reset      # applies migrations 0001–0009 and seed.sql (labeled demo data)
```

The mobile app does **not** require this in Phase One; it's for wiring the real backend in Phase 2+.

## Environment & secrets

Copy the `.env.example` files where needed (`apps/mobile`, `apps/admin`, `supabase`). **No secret is
ever committed.** The Supabase **service-role key is server-only** and never reaches a client bundle.
Details in [docs/SECURITY.md](docs/SECURITY.md).

## Status

Phase One complete. Roadmap and phase-by-phase scope in
[docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md). This is a working name; rebrand by editing
`packages/config`.

## A note on health & safety

Challenge42 is a lifestyle and accountability program, **not medical advice**. The scoring engine is
deliberately designed to reward healthy consistency and **never** to reward starvation, extreme
calorie deficits, unsafe rapid weight loss, or excessive exercise (see
`packages/domain/src/scoring.ts` and its tests).
