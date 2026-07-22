# Challenge42 — Implementation Plan

> **Status:** Living document · **Phase:** 1 in progress
> How we get from an empty repo to the product in [`PRODUCT_SPEC.md`](./PRODUCT_SPEC.md), one
> reviewable vertical slice at a time.

---

## 1. Engineering principles

- **No big-bang.** Ship high-quality vertical slices, not dozens of disconnected placeholders.
- **Feature-based organization** in the mobile app (`features/<domain>/…`), shared logic in
  `packages/*`.
- **Strict TypeScript**, `any` only with written justification. Zod at the edges.
- **Shared code is framework-agnostic** — `packages/domain` runs in RN, Next, and Edge Functions.
- **Document non-obvious decisions** inline and in `docs/`.
- **Never** hardcode fake production stats; seed data is clearly labeled demo data.
- **Never** design scoring that rewards starving, extreme deficits, unsafe loss, or over-exercise.
- **AI is not the source of truth** for nutrition or clinical decisions.

## 2. Monorepo layout

```
challenge42/
├─ apps/
│  ├─ mobile/        Expo + React Native + TypeScript + Expo Router (iPhone-first)
│  └─ admin/         Next.js (App Router) + TypeScript — scaffold only in Phase 1
├─ packages/
│  ├─ config/        Brand + design tokens + challenge constants (framework-agnostic)
│  ├─ types/         Shared domain TypeScript types + enums (mirror the DB)
│  ├─ validation/    Zod schemas + inferred types (form/input/API validation)
│  └─ domain/        Pure business logic: scoring, streaks, weight stats, providers (tested)
├─ supabase/
│  ├─ migrations/    Timestamped, additive SQL migrations
│  ├─ functions/     Edge Functions (stubs in Phase 1)
│  └─ seed.sql       Labeled demo data
└─ docs/             The five architecture docs + README
```

Dependency direction: `apps/* → packages/*`; within packages: `validation → types`,
`domain → types, config`. No cycles. `config` and `types` have no internal deps.

## 3. Package boundaries

| Package                   | Owns                                                                                    | Depends on    |
| ------------------------- | --------------------------------------------------------------------------------------- | ------------- |
| `@challenge42/config`     | brand, tokens (color/space/type/radius/layout), constants                               | (none)        |
| `@challenge42/types`      | domain model types + string-union enums                                                 | (none)        |
| `@challenge42/validation` | Zod schemas for inputs (weigh-in, food, onboarding…)                                    | types         |
| `@challenge42/domain`     | scoring, streaks, weight stats, challenge-day math, nutrition-provider interface + mock | types, config |

Apps import from these via the `@challenge42/*` names (npm workspaces symlink).

## 4. Phase roadmap

| Phase | Theme                                   | Key deliverables                                                                                                                |
| ----- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **1** | **Foundation + Design + Home**          | Monorepo, docs, packages, initial schema+RLS, design tokens, 5-tab shell, **polished Home** on seed data, tests/lint/typecheck. |
| 2     | Auth + Onboarding                       | Supabase Auth, profile creation, preference capture, conservative target calc.                                                  |
| 3     | Weight + Calorie Tracking               | Real weigh-in & food logging, nutrition-provider adapter (USDA), Track screen.                                                  |
| 4     | Challenges + Leaderboards + Teams       | Challenge lifecycle, scoring writes, leaderboards, team normalization, Live/leaderboard.                                        |
| 5     | Realtime Activity Pulse + Workout Timer | Presence, live pulse, workout timer (`started_at`-based), cheers.                                                               |
| 6     | Run/Walk Tracking + Map                 | GPS capture, run sessions, owner-only routes, privacy-safe map.                                                                 |
| 7     | Community + Live Feed                   | Posts/comments/reactions, curated feed events, moderation hooks.                                                                |
| 8     | Meal Plans + AI Personalization         | AI meal-plan generation (ideas), provider-verified macros, Plan screen, swaps.                                                  |
| 9     | Success Gallery + Alumni                | Completion summaries, success stories, per-surface consent, "people like me".                                                   |
| 10    | Admin + Notifications + Analytics       | Admin dashboards, expo-notifications delivery, at-risk detection, analytics.                                                    |
| 11    | Polish + Testing + Production Hardening | E2E, perf, a11y pass, security hardening, store readiness.                                                                      |

Order may shift when technical dependencies justify it (documented when it happens).

## 5. Phase One — task breakdown

1. ✅ Monorepo skeleton + root tooling (npm workspaces, TS, ESLint, Prettier, Vitest).
2. ✅ Five architecture docs.
3. **Packages**: `config` (tokens/brand/constants), `types`, `validation`, `domain` (scoring +
   streaks + weight stats + provider interface + mock), with **unit tests** for domain.
4. **Supabase**: additive migrations `0001–0009` (schema + RLS) + labeled `seed.sql`. Function
   stubs.
5. **Mobile app**: Expo Router 5-tab shell; design-token theme; **Home fully built** from a seeded
   local dev store; Live/Track/Plan/Community as polished, on-design placeholders; reusable
   components; loading/empty/error states.
6. **Admin app**: Next.js App Router scaffold — landing + auth-gated placeholder, shared config;
   no dashboards yet.
7. **Quality gates**: typecheck, lint, format check, and domain tests all pass. CI workflow added.
8. **README** with local setup; engineering report.

## 6. Testing strategy

- **Phase One focus:** `packages/domain` is the correctness-critical code (scoring must be right and
  safe), so it gets thorough **Vitest** unit tests — including explicit tests that undereating and
  over-exercising do **not** score higher.
- Types/validation are exercised by compilation + a few schema tests.
- UI: component/interaction tests (React Native Testing Library) arrive with the features that use
  them in later phases; Phase One keeps a smoke test and relies on strict typing + the shared,
  tested domain layer.
- Quality gates run in CI (`.github/workflows/ci.yml`): install → typecheck (packages) → lint →
  test.

## 7. Environments & secrets

- Phase One runs with **zero secrets**. Mobile uses a `dev` data source (seeded/mock) selected by
  `APP_ENV`. Supabase URL/anon key are optional and only used when a real backend is wired in
  Phase 2+.
- All secret boundaries are documented in [`SECURITY.md` §5](./SECURITY.md#5-secrets--configuration-boundaries)
  with `.env.example` files per app.

## 8. Definition of Done — Phase One

- [ ] Monorepo properly organized; npm workspaces resolve.
- [ ] Expo mobile app runs (`npm run mobile`).
- [ ] Next.js admin scaffold runs (`npm run admin`).
- [ ] Five-tab navigation works.
- [ ] Home screen is polished and communicates the product vision.
- [ ] Seeded challenge data makes the app feel alive (clearly labeled demo).
- [ ] Shared design-token system exists and is consumed by the app.
- [ ] Initial DB architecture (migrations) + documented RLS/security strategy exist.
- [ ] The five docs exist and are coherent.
- [ ] Typecheck passes (packages; apps typecheck when their toolchains are installed).
- [ ] Lint passes; format check passes.
- [ ] Domain unit tests pass.
- [ ] README has clear local-setup instructions.

## 9. Known constraints & honesty notes

- Native builds (iOS/Android binaries) and on-device screenshots are **not** produced in this
  environment; the app is verified by typecheck/lint/tests and is runnable via Expo on a dev machine.
- Verified-nutrition and AI providers are behind interfaces with **mock** implementations in Phase
  One; real adapters land in Phases 3 and 8.
- Realtime presence, GPS, auth, and admin dashboards are architected (types/tables/placeholders) but
  intentionally not implemented in Phase One.

## 10. Recommended Phase Two scope (preview)

Auth + onboarding + conservative target calculation, wiring the mobile `dev` data source to a real
Supabase `live` source behind the same interfaces, and turning the Track screen into a real logging
surface. Details finalized at the end of Phase One.
