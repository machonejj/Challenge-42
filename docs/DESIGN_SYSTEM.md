# Challenge42 — Design System

> **Status:** Living document · **Phase:** 1
> The canonical token **values** live in code: `packages/config/src/tokens.ts`. This doc explains
> intent, usage, and rules. If a value here and in code disagree, code wins — update the doc.

---

## 1. Design intent

Challenge42 should feel like a **premium, live, editorial sporting event** crossed with a calm,
trustworthy personal-health app. The adjectives, in priority order:

**Premium · Editorial · Calm · Alive · Competitive · Trustworthy · Simple.**

We deliberately avoid the visual clichés of consumer fitness apps.

| Avoid                            | Because                                             |
| -------------------------------- | --------------------------------------------------- |
| Neon gradients, glow, "energy"   | Reads cheap; we want premium and calm.              |
| Heavy drop shadows               | Muddy; we use hairline borders + subtle elevation.  |
| Cartoonish gamification          | Undermines trust; competition is elegant, not loud. |
| Dense dashboards, tiny text      | Overwhelms; we lead with a few large numbers.       |
| Everything in rounded pill cards | Generic; we use restrained radii + real hierarchy.  |

Instead: **generous whitespace, a few large numbers, clear type hierarchy, hairline borders,
restrained motion, and a warm, editorial palette.**

## 2. Color

Original identity (not derived from any existing brand). Warm, natural, confident.

### 2.1 Brand palette

| Token           | Hex       | Role                                                         |
| --------------- | --------- | ------------------------------------------------------------ |
| **Deep Pine**   | `#12382B` | Primary brand; headers, primary surfaces, key text on cream. |
| **Warm Cream**  | `#F7F3E8` | Primary app background; the "paper" of the product.          |
| **Soft White**  | `#FCFBF7` | Elevated surfaces / cards on cream.                          |
| **Warm Gold**   | `#C9A65B` | Accent for achievement, rank, premium highlights. Sparingly. |
| **Charcoal**    | `#222822` | Primary text; near-black with a green undertone.             |
| **Live Accent** | `#D74A43` | The "LIVE" / happening-now signal. Reserved for liveness.    |

### 2.2 Derived / semantic tokens

Built from the brand palette (see `tokens.ts` for exact values):

- **Text:** `text.primary` (Charcoal), `text.secondary` (~60% charcoal), `text.tertiary` (~40%),
  `text.onPine` (Cream on Deep Pine), `text.onGold` (Charcoal on Gold).
- **Surface:** `surface.background` (Cream), `surface.card` (Soft White), `surface.pine` (Deep Pine),
  `surface.sunken` (a hair darker than cream for grouped rows).
- **Border:** `border.hairline` (~8% charcoal), `border.strong` (~16%). Borders, not shadows, define
  most edges.
- **Status:** `status.online` = illuminated green (`#3CB371`-family), `status.live` = Live Accent,
  `status.positive` (progress/loss), `status.warning`, `status.danger`.
- **Activity accents:** running / walking / working-out / cycling each map to a restrained hue for
  status dots and pulse rows.

### 2.3 Rules

- **Live Accent is precious.** Only for genuine liveness (LIVE label, active pulse, recording).
  Never a generic call-to-action color.
- **Gold signals earned status** (rank, badges, milestones) — never decoration.
- **Green presence dot = truly online.** Don't fake it in production.
- Contrast: body text meets **WCAG AA** on its background. Large display numbers meet at least AA
  Large. A11y is a gate, not a nicety (see §7).

## 3. Typography

Two roles, deliberately different:

- **Display / Editorial** — big emotional moments and hero numbers ("Day 17 of 42", "251.4",
  "72/100"). Warm, confident, slightly editorial. Phase One uses the platform serif/display stack;
  a licensed display face can be dropped into `tokens.ts` later without touching components.
- **UI / Functional** — everything operational: labels, rows, buttons, body. Highly legible
  humanist sans (system stack in Phase One).

### 3.1 Type scale (pt / RN units)

| Token        | Size | Line | Use                                             |
| ------------ | ---- | ---- | ----------------------------------------------- |
| `display.xl` | 56   | 60   | Hero number (the single biggest number on Home) |
| `display.lg` | 40   | 44   | Big metric values                               |
| `display.md` | 30   | 36   | Section hero numbers                            |
| `title.lg`   | 24   | 30   | Screen titles                                   |
| `title.md`   | 20   | 26   | Card titles                                     |
| `body.lg`    | 17   | 24   | Primary body (iOS default size)                 |
| `body.md`    | 15   | 22   | Secondary body / rows                           |
| `label.md`   | 13   | 16   | Labels under numbers                            |
| `label.sm`   | 11   | 14   | Overline / eyebrow (letter-spaced, uppercase)   |

Rules: **every large number has a small label**; never rely on size alone to convey meaning. Minimum
functional text size is **13** (`label.md`); `label.sm` is used only for uppercase eyebrows.

## 4. Spacing, radius, borders, layout

### 4.1 Spacing scale (4-pt base)

`0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64` → tokens `space.xxs … space.5xl`. Screen gutter is
`space.xl` (20). Cards use `space.lg` (16) internal padding. Vertical rhythm between major blocks is
`space.2xl` (24).

### 4.2 Radius

`radius.sm = 8`, `radius.md = 12`, `radius.lg = 16`, `radius.xl = 24`, `radius.pill = 999`.
Cards use `radius.lg`; pills/tags use `radius.pill`; the hero uses `radius.xl`. **Not everything is a
pill** — rows and list items often use hairline separators with no radius at all.

### 4.3 Borders & elevation

- **Hairline borders** (`StyleSheet.hairlineWidth`–1px, `border.hairline`) define most card and row
  edges.
- **Elevation** is used sparingly and softly: a single low-opacity shadow token `elevation.card` for
  the few surfaces that must float (hero, sticky leaderboard row). No stacked/neon shadows.

### 4.4 Layout constants

- Respect **safe areas** on all screens (`react-native-safe-area-context`).
- **Minimum touch target 44×44 pt** (iOS HIG). Quick actions are large (≥ 56 pt tall).
- Content max readable measure is the device width minus `2× gutter`; no desktop assumptions.
- Tab bar height + safe-area inset handled by Expo Router tabs; content adds bottom padding so nothing
  hides behind the bar.

## 5. Component patterns (Phase One)

Reusable, composable, small. Names are guidance; better structure may win.

| Component            | Responsibility                                                               |
| -------------------- | ---------------------------------------------------------------------------- |
| `ChallengeHeader`    | Brand mark, Day X of 42, streak, greeting. Reads brand from config.          |
| `MetricCard`         | One big labeled number with optional delta (↓ 8.6 lbs) and trend color.      |
| `ProgressRing`       | Circular progress (score / calories) — Reanimated, restrained.               |
| `QuickAction`        | Large tappable action (icon + label). ≥ 56 pt tall, haptic on press.         |
| `Section`            | Titled section with optional "eyebrow" + trailing action link.               |
| `RankCard`           | Overall rank, movement (↑8), distance-to-next-target.                        |
| `ActivityPulse`      | "Happening now" counts (active / working out / running / walking).           |
| `LiveActivityRow`    | One live participant row (name, status, elapsed/mileage). No exact location. |
| `TeamStandingCard`   | Team name, standing, online members, today's team-goal progress.             |
| `MealPlanPreview`    | Today's meals with completion checks + View Plan.                            |
| `LeaderboardPreview` | Compact top-N + sticky "you" row (used on Home + Live teaser).               |
| `StatePlaceholder`   | Shared loading / empty / error state (branded, never default).               |
| `Pill` / `Tag`       | Small status/label chips (e.g. HIGH PROTEIN, LIVE).                          |

Each component: typed props, no business logic (logic lives in `packages/domain` / hooks), and
tokens-only styling (no magic numbers).

## 6. Motion

Restrained and meaningful (Reanimated + Expo Haptics).

- **Purposeful only:** progress rings animate on data change; a metric can count-up once on mount;
  the LIVE dot has a slow, subtle pulse. No decorative bouncing.
- **Durations:** micro 120 ms, standard 240 ms, entrance 320 ms; easing `easeOut` for entrances.
- **Haptics:** light impact on quick-action press, success notification on logging a win. Never
  spammy.
- Respect **reduce-motion**: fall back to instant/opacity transitions.

## 7. Accessibility (a gate, not a nice-to-have)

- Text contrast meets **WCAG AA**; large display meets AA Large minimum.
- All interactive elements have accessible labels/roles and ≥ 44 pt targets.
- Support **Dynamic Type** where feasible (scale UI text; hero numbers cap to avoid layout breakage).
- Color is never the only signal — status also uses icon/label/text.
- Honor reduce-motion and reduce-transparency.

## 8. States

Every data surface designs its **loading, empty, and error** states with `StatePlaceholder`:

- **Loading:** calm skeletons matching final layout (no spinners-on-blank).
- **Empty:** encouraging, on-brand, with a clear next action ("Log your first weigh-in").
- **Error:** honest, non-alarming, with retry. Never a raw stack trace.

## 9. Theming & rebranding

All visual decisions resolve to tokens in `packages/config`. Rebranding = editing token values +
the `brand` block (name, tagline, challenge length). Components never hardcode hex, size, or the
product name. Dark mode is **out of scope for Phase One** but the token structure (semantic names,
not literal colors in components) makes it a later additive change, not a rewrite.
