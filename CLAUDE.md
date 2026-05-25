# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

BenchMark — a social app for discovering, posting, and rating public benches ("Strava meets Instagram, for benches"). A monorepo with two independent apps:

- `apps/api` — Ruby on Rails 7 API-only backend (PostgreSQL, Devise + JWT, Active Storage). See `apps/api/CLAUDE.md`.
- `apps/mobile` — Expo / React Native client (Expo Router, NativeWind, React Query, Zustand). See `apps/mobile/CLAUDE.md`.

There is no shared build tooling or workspace root — each app is installed and run from its own directory.

## Running the full stack locally

```bash
# Terminal 1 — backend on localhost:3000
cd apps/api && bundle install && rails db:create db:migrate db:seed && rails server

# Terminal 2 — mobile
cd apps/mobile && npm install && npx expo start
```

The mobile app talks to the API via `EXPO_PUBLIC_API_URL` (default `http://localhost:3000/api/v1`). Env files live per-app: copy the root `.env.example` to `apps/api/.env` and `apps/mobile/.env`.

## The contract between the two apps

The API↔mobile boundary is the thing most likely to break when you change either side:

- All app endpoints are namespaced under `/api/v1`. Auth is JWT in the `Authorization: Bearer <token>` header — there is no session/cookie auth for the API.
- The API serializes responses with Blueprinter (`apps/api/app/serializers/*_blueprint.rb`). The mobile TypeScript interfaces in `apps/mobile/lib/api.ts` are hand-mirrored from these blueprints — change a blueprint field and you must update the matching TS type.
- **Active Storage photo/avatar URLs come back as relative paths** (e.g. `/rails/active_storage/blobs/...`). The mobile app resolves them against the API host in `apps/mobile/lib/images.ts`. Always run image URLs through `resolvePhotoUrl` on the client.

Cross-cutting changes (new endpoint, renamed field, new model attribute exposed to the client) almost always touch: a Rails controller + blueprint, then the mobile `lib/api.ts` type + the React Query hook that calls it.
