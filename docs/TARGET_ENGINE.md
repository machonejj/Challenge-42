# Challenge42 — Target Recommendation Engine

> **Status:** Living document · **Phase:** 2
> The canonical implementation is `packages/domain/src/target/targetEngine.ts` (deterministic, pure,
> unit-tested). This doc explains the formulas, guardrails, and safety routing. Code wins on conflict.

---

## 1. Principles

1. **Deterministic, never AI.** Targets come from documented formulas with configurable constants
   (`packages/config` → `TARGET_ENGINE`). No model call decides calories.
2. **Conservative by design.** Small deficits, hard calorie floors, capped weekly loss. We would
   rather under-prescribe a deficit than push anyone toward unsafe restriction.
3. **Estimates are estimates.** Output is framed as an estimate for a general population — **not**
   individualized medical advice. The UI says so.
4. **Safety first.** Certain circumstances (pregnancy, recent postpartum, breastfeeding, clinical
   care, eating-disorder history) return **`SAFE_REVIEW_REQUIRED`** and get **no automated
   weight-loss target** — only gentle, non-deficit guidance and a route to human review later.
5. **Versioned.** Every recommendation stamps `engineVersion` so historical snapshots are
   reproducible and auditable.

## 2. Inputs

```
age (years), heightCm, currentWeightKg, goalWeightKg?, sex ('male'|'female'|'unspecified'),
activityLevel ('sedentary'|'light'|'moderate'|'very_active'),
primaryGoal ('lose_weight'|'build_habits'|'feel_in_control'|'get_back_to_exercise'|'improve_energy'|'build_consistency'),
timeAvailableMinutes?, safetyFlags: SafetyFlag[]
```

Sex is collected **only** because it materially changes the validated BMR formula; it is optional and
defaults to a neutral estimate.

## 3. Formulas

### 3.1 BMR — Mifflin-St Jeor (validated, widely used)

```
male:        BMR = 10·kg + 6.25·cm − 5·age + 5
female:      BMR = 10·kg + 6.25·cm − 5·age − 161
unspecified: BMR = 10·kg + 6.25·cm − 5·age − 78   (average of the male/female constants)
```

### 3.2 TDEE (maintenance)

`TDEE = BMR × activityFactor`, with conservative factors:

| Activity level | Factor |
| -------------- | ------ |
| sedentary      | 1.20   |
| light          | 1.375  |
| moderate       | 1.55   |
| very_active    | 1.725  |

Maintenance is presented as a **range**: `[TDEE − 100, TDEE + 100]`, rounded to the nearest 25 kcal.

### 3.3 Calorie target

- **Non-weight-loss goals** (build habits, energy, consistency, control, back-to-exercise):
  target = maintenance (no deficit). We do not create a deficit a user didn't ask for.
- **Weight-loss goal:** apply a **conservative deficit**:
  `deficit = min(deficitCapKcal (500), TDEE × maxDeficitFraction (0.20))`.
  `target = TDEE − deficit`.
- **Hard floor:** `target = max(target, floorForSex)` where floors are **male 1500 / female 1200 /
  unspecified 1300** kcal, and never below the global `minCalorieTargetFloor` (1200). If the floor
  binds, the effective deficit shrinks (documented in `assumptions`).
- Presented as a **range** `[target − 100, target + 100]` (nearest 25 kcal); `calorieTarget` is the
  midpoint.

### 3.4 Protein target

`protein_g = clamp(round5(1.6 × referenceKg), 90, 200)` where `referenceKg = min(currentWeightKg,
125)` (cap avoids over-prescribing at high body weights). 1.6 g/kg supports satiety and lean-mass
retention in a modest deficit. Framed in the UI as “Xg+”.

### 3.5 Movement

- `dailySteps = 8000` (a sustainable default, deliberately not 10k).
- `sessionsPerWeek = 2` for sedentary starters, else `3`. Never scaled up for “more is better”.

### 3.6 42-day progress range (weight-loss goal only, eligible users)

A safe, non-promissory range over the 6-week challenge:

```
lowKg  = currentWeightKg × weeklyLossFractionLow (0.004) × 6
highKg = currentWeightKg × weeklyLossFractionHigh (0.0075) × 6
```

≈ 0.4 %–0.75 % of body weight per week. Framed as a **suggested progress range**, never a promise.
The **42-day focus** is always **consistency (build 90 %+)**, not the number.

### 3.7 Goal weight sanity

A user’s long-term `goalWeightKg` is accepted as a **long-term** aspiration and stored separately
from the 42-day range. We never accept an unrealistic “lose N lbs in 42 days” input; the 42-day range
is computed, not user-entered. Goal weights implying > ~1 %/week are still stored as long-term but the
42-day range stays conservative.

## 4. Safety routing

`deriveSafetyStatus(flags)`: if **any** of these flags is set, status is `SAFE_REVIEW_REQUIRED`:

| Flag                          | Meaning                                                   |
| ----------------------------- | --------------------------------------------------------- |
| `PREGNANT`                    | Currently pregnant                                        |
| `RECENT_POSTPARTUM`           | Gave birth recently                                       |
| `BREASTFEEDING`               | Currently breastfeeding                                   |
| `CLINICAL_REVIEW_RECOMMENDED` | Health condition / under professional care                |
| `EATING_DISORDER_SAFETY_FLAG` | History making calorie/weight tracking potentially unsafe |

Otherwise status is `STANDARD_AUTOMATED_PLAN_ELIGIBLE`.

For `SAFE_REVIEW_REQUIRED`:

- **No** calorie deficit, **no** weight-loss range, **no** aggressive target.
- Return gentle guidance (maintenance-oriented, movement, protein for general health) and the
  message: _“Your situation deserves a more personalized approach. We’ll help you continue, but we
  won’t automatically generate a weight-loss target until the appropriate safety review is
  complete.”_
- Architecture leaves room for professional review later (a `safety_review` status the admin/clinical
  workflow can act on). **We never imply medical clearance.**

The eating-disorder flag additionally suppresses numeric calorie framing in the reveal (focus shifts
entirely to consistency + gentle habits).

## 5. Output shape

```ts
interface TargetRecommendation {
  status: 'STANDARD_AUTOMATED_PLAN_ELIGIBLE' | 'SAFE_REVIEW_REQUIRED';
  safetyFlags: SafetyFlag[];
  maintenanceRangeKcal: { low: number; high: number };
  calorieTarget: number | null; // null when SAFE_REVIEW_REQUIRED
  calorieTargetRangeKcal: { low: number; high: number } | null;
  proteinTargetG: number | null;
  movement: { dailySteps: number; sessionsPerWeek: number };
  weightLossRangeKg: { low: number; high: number } | null;
  primaryFocus: string; // always consistency-first
  explanation: string;
  assumptions: string[];
  engineVersion: string;
}
```

## 6. Constants & versioning

All tunables live in `packages/config` → `TARGET_ENGINE` and `HEALTH_GUARDRAILS`. The version string
`TARGET_ENGINE_VERSION` is bumped on any formula/guardrail change and stamped into every
`challenge_start_snapshot` so historical plans remain reproducible.

## 7. What this is not

Not a medical device, not a diagnosis, not clearance to exercise or diet. Copy consistently frames
numbers as **estimates** and routes special circumstances to individualized care.
