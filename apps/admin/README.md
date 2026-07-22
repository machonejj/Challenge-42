# @challenge42/admin

The Challenge42 staff console — Next.js (App Router) + TypeScript.

**Phase One is a scaffold only:** a landing page and an auth-gated dashboard placeholder. It shares
`@challenge42/config` (brand + tokens) with the mobile app. Full dashboards arrive in Phase 10.

Security: the admin uses the Supabase **service role in server code only** — never in the browser
bundle. Every privileged action is authorized by `is_admin()` in RLS plus app-level role checks. See
[`docs/SECURITY.md`](../../docs/SECURITY.md).

## Run

```bash
# from the monorepo root
npm install
npm run admin            # next dev  → http://localhost:3000
```
