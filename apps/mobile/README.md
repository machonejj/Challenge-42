# @challenge42/mobile

The Challenge42 iPhone-first app — Expo + React Native + TypeScript + Expo Router.

- **Routes:** `src/app` (Expo Router). Five tabs in `src/app/(tabs)`; profile modal at `src/app/profile.tsx`.
- **Design system:** tokens from `@challenge42/config`, wrapped by `src/theme`.
- **UI primitives:** `src/components/ui`. Home components: `src/components/home`.
- **Data:** `src/features/home` — a mock repository (Phase One) behind an interface the Supabase
  source will implement later. TanStack Query for server state.

## Run

```bash
# from the monorepo root
npm install
npm run mobile            # expo start
# then press i (iOS simulator), a (Android), or w (web), or scan the QR with Expo Go
```

Phase One runs entirely on labeled demo data — **no backend or secrets required**. See the root
[README](../../README.md) and [docs](../../docs).
