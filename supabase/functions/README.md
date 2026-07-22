# Supabase Edge Functions

Server-side functions (Deno). They exist so that **third-party keys never reach the client** and so
that privileged work (verified-nutrition lookups, AI meal-plan generation, signed-URL minting,
score recomputation) runs in a trusted context.

Phase One ships **stubs only** — the boundaries and contracts, not the integrations.

| Function             | Phase | Purpose                                                                  |
| -------------------- | ----- | ------------------------------------------------------------------------ |
| `nutrition-search`   | 3     | Proxy to the verified nutrition provider (USDA). Client never holds key. |
| `generate-meal-plan` | 8     | AI generates meal _ideas_; macros reconciled against the provider.       |
| `recompute-scores`   | 4     | Recompute `challenge_scores` / `leaderboard_snapshots` via service role. |

Rules:

- Secrets come from `supabase/.env` (git-ignored) / dashboard secrets — never committed.
- AI output is **never** the source of nutrition numbers.
- Functions using the service role must authenticate the caller and authorize the action.
