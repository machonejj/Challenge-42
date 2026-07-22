# Challenge42 — Product Specification

> **Status:** Living document · **Phase:** 1 (Foundation)
> **Working name:** `CHALLENGE42` — branding is data-driven and can be changed in one place
> (`packages/config`). Do not hardcode the product name in UI copy; read it from config.

---

## 1. What this is

Challenge42 is a **mobile-first, 42-day weight-loss and healthy-lifestyle challenge**. It is
built around one belief:

> People follow through when they have a clear personalized plan, accountability, community,
> social proof, skin in the game, friendly competition, and simple daily actions — alongside
> other people on the same journey.

It should feel like **a premium, live sporting event fused with a personal weight-loss journey** —
elegant, editorial, alive, competitive, trustworthy. It must **not** feel like a spreadsheet, a
generic calorie counter, a bodybuilding app, a cheap fitness challenge, or a Facebook group.

The emotional target, in the user's own words:

- "Something is happening here _right now_."
- "I am part of this."
- "People are doing this _with_ me."
- "I know exactly what I need to do today."
- "I don't want to break my streak."
- "My team is counting on me."
- "I can actually finish this."

## 2. The core behavioral loop

Everything in the product exists to serve this loop:

```
OPEN APP → SEE MY PROGRESS → SEE TODAY'S ACTIONS → SEE OTHERS PARTICIPATING
   → COMPLETE A HEALTHY ACTION → MY NUMBERS CHANGE → SCORE/STREAK/TEAM CHANGES
   → COMMUNITY REACTS → I FEEL ACCOMPLISHMENT → I COME BACK TOMORROW
```

Design test for any feature: **does it strengthen this loop?** If not, it waits.

## 3. Non-negotiable product principles

These are guardrails, not preferences. They constrain scoring, copy, and UX everywhere.

1. **Reward healthy consistency, never deprivation.** The primary competitive score rewards
   showing up and doing simple healthy actions. It must **never** reward starving, extreme
   calorie deficits, unsafe rapid weight loss, or excessive exercise. See
   [`DATA_MODEL.md` → Scoring](./DATA_MODEL.md#scoring-model) and
   `packages/domain/src/scoring.ts`.
2. **Total pounds lost is never the primary leaderboard.** Ranking on absolute pounds punishes
   smaller people and rewards the largest. We rank on a **normalized consistency score** and,
   secondarily, **percentage** change.
3. **Privacy is the default, not a setting to discover.** Weight, calories, and progress photos
   default to private. Exact location is _always_ private. Raw GPS routes are never shown to other
   challengers. See [`SECURITY.md`](./SECURITY.md).
4. **AI generates ideas, not truth.** AI proposes meals and structure; **verified nutrition
   providers** (USDA FoodData Central or equivalent) are the source of nutrition numbers. Nutrition
   providers sit behind an abstraction (`packages/domain` interface + adapters).
5. **The app must feel alive without lying.** Development seed data is clearly labeled demo data.
   We never present seeded numbers as real production statistics.
6. **No clinical claims, no medical decisions.** We are an accountability & lifestyle product, not
   a medical device. Copy never diagnoses, prescribes, or promises outcomes.

## 4. Personas (Phase One design targets)

- **The Returner** — has tried and stalled before; needs to believe "someone like me finished
  this." Success Gallery + "people like me" filtering serve this persona.
- **The Busy Parent / Professional** — low time, needs one-tap actions, family-friendly meal
  plans, and quick logging.
- **The Competitor** — motivated by rank, streak, and team standings.

Home must serve all three in the first screen.

## 5. Navigation

Five bottom tabs. Profile/settings live behind an avatar control in the header — never a sixth tab.

| Tab           | One-line job                                                         | Phase 1 depth           |
| ------------- | -------------------------------------------------------------------- | ----------------------- |
| **Home**      | How am I doing, what do I do today, what's happening, what do I eat? | **Fully implemented**   |
| **Live**      | Leaderboard · Map · Live Feed                                        | Intentional placeholder |
| **Track**     | Weight · Calories · Daily consistency grid                           | Intentional placeholder |
| **Plan**      | Personalized daily nutrition plan                                    | Intentional placeholder |
| **Community** | For You · Wins · Meal Ideas · Questions · My Team · Recipes          | Intentional placeholder |

Placeholder tabs are **polished and explain the upcoming functionality** — never a blank "coming
soon." They preview the feature with real design-system components and seeded context.

## 6. Feature catalog (target state)

This is the full product we are architecting toward. Phase mapping is in
[`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md).

### 6.1 Weight tracking

Enter weigh-ins; see starting / current / goal weight, total change, % change, trend, weekly
averages. Weigh-ins are **weekly-cadence-friendly** — we never nudge daily weigh-ins (unhealthy
fixation). Weight is private by default.

### 6.2 Calorie / food tracking

Log calories, foods, meals; quick-add calories; one-tap "log planned meal"; see target / consumed /
remaining. Nutrition numbers come from a verified provider via adapter; AI never sets them.

### 6.3 Personalized meal plans

Plans tailored to calorie & protein targets, food likes/dislikes, allergies, dietary restrictions,
cooking ability & time, budget, family size, cuisines, meal frequency, lifestyle. Eventually
conversational ("five dinners under 650 cal my kids will eat", "plan a $200 Costco run"). Plans
include breakfast/lunch/dinner/snacks with calories, protein, ingredients, instructions, grocery
lists, and swaps. **AI drafts; provider verifies nutrition.**

### 6.4 Live challenge experience & Activity Pulse

The product constantly, honestly communicates that others are participating. The **Activity Pulse**
is the named concept for "what's happening across the challenge right now":

```
HAPPENING NOW
87 challengers active · 31 working out · 12 running · 19 walking
27 planned meals completed in the last hour
"Sarah is 2.4 miles into her run" · "Mike started Push Day"
```

Not every micro-action is feed-worthy (logging 13 almonds is not). Feed-worthy nutrition events:
completed planned meal, shared meal/recipe, hit a meaningful nutrition goal, completed a full day.

### 6.5 Leaderboards

Categories: Overall Challenge Score, Consistency, Streak, % body-weight change, Team standings.
**Total pounds lost is never the primary ranking.** Current user gets a sticky row and a
"distance to next meaningful target" nudge.

### 6.6 Community

Post updates, share wins/meals/recipes/progress, comment, react, cheer. Sections (target): For You,
Wins, Meal Ideas, Questions, My Team, Recipes.

### 6.7 Live activity & workout timer

Start an activity (Run, Walk, Strength, Cycling, Yoga/Mobility, HIIT, Sports, Other). A workout
starts a timer; the user appears to eligible members as **"Working Out Now"** with title and elapsed
time. Others send lightweight cheers (🔥 💪 👏 🚀). **Timer seconds are never written continuously to
the DB** — we persist `started_at` and clients compute elapsed. Completed sessions are persisted
separately as history.

### 6.8 Run / walk tracking

Time, distance, average pace, private route, completion. **Exact GPS routes are never shown to other
challengers** — owner + authorized backend only.

### 6.9 Live map

Approximate geographic distribution of participants. Opt-in visibility: `Hidden` · `City only` ·
`Approximate area`. Online users show an illuminated green presence indicator; active users show a
status icon (🏃 running, 💪 working out, 🚶 walking, 🟢 online). **Never exact addresses or precise
GPS.** Public coordinates are city-level or deliberately fuzzed.

### 6.10 Success Gallery & Alumni

Not a generic testimonial strip. Categories: Featured Stories, Transformations, Consistency
Champions, Goal Achievers, Life-Changing Stories, Graduates. A consenting profile may show
before/after, first name, challenge, start/end weight, % change, consistency, streak, progress
chart, story, favorite meals, helpful habits, badges. Filter for **"people like me"** (age range,
broad starting-weight band, parent, busy professional, beginner, similar goal).

**Three separate consent models** — in-app gallery, public website, paid marketing. Consent for one
**never** implies another. See [`SECURITY.md` → Consent](./SECURITY.md#consent-model).

### 6.11 Teams

Team name, score, standings, members, online members, activity, wins, feed. **Team competition
normalizes for team size** — a bigger team must not automatically win (per-capita / average scoring).

## 7. Screen specs (Phase One focus)

### 7.1 Home (fully built in Phase One)

Home is the most important screen. It answers, in order: _How am I doing? What do I do today?
What's happening? What should I eat?_

Content blocks (order is intentional, top to bottom):

1. **Challenge header** — brand mark, "Day X of 42", 🔥 streak, greeting by name.
2. **Today** — three big metrics: Calories (consumed/target + remaining), Weight (current + total
   change), Today's Score (0–100). Large editorial numbers.
3. **Quick actions** — Log Food · Weigh In · Start Activity (large touch targets).
4. **Your challenge** — overall rank, rank movement (↑8), "N points from Top 25".
5. **Happening now (Activity Pulse)** — active / working out / running / walking counts + 2–3 live
   rows.
6. **Team summary** — team name, standing, online members, today's team goal progress.
7. **Today's plan** — breakfast/lunch/dinner/snack with completion checks + View Plan.

Rules: don't overload; prioritize clarity; large numbers; generous whitespace; every number has a
label; loading/empty/error states are designed, not default.

### 7.2 Live / Track / Plan / Community (Phase One placeholders)

Each renders a branded, on-design "preview" screen describing what's coming, using seeded context so
it still feels alive (e.g. Track shows the week consistency grid concept; Live shows a leaderboard
teaser). No lorem ipsum, no default RN styling.

## 8. Content & tone

Editorial, warm, confident, calm. Big moments get large serif/display type; functional data gets
highly legible UI type. Never hype, never shame, never medical claims. Copy about others is factual
("Mike started Push Day"), never fabricated drama.

## 9. Out of scope for Phase One

Auth, onboarding, real backend writes, AI generation, GPS capture, real realtime presence, admin
dashboard internals, notifications delivery. All are **architected for** (types, tables, adapters,
placeholders) but not implemented. See [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md).

## 10. Success criteria for Phase One

The app runs, the five tabs work, Home looks polished and communicates the vision, seeded data makes
it feel alive, the design system and initial DB architecture exist, security is documented, and
typecheck / lint / tests pass. Detailed DoD in [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md).
