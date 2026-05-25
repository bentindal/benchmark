# BenchMark

A social media app where users discover, post, and rate public benches. Think Strava meets Instagram — but for benches.

**Design:** Notion-inspired (clean sans-serif, generous whitespace, block-based layout) with a green/nature palette (forest greens, sage, warm off-whites, earthy tones).

## Tech Stack

- **Frontend:** React Native (Expo SDK 51+, Expo Router, NativeWind, React Query)
- **Backend:** Ruby on Rails 7 API-only, PostgreSQL, Active Storage, Devise + JWT

## Repository Structure

```
benchmark/
  apps/
    api/        # Rails API
    mobile/     # Expo React Native app
  docs/
  README.md
```

## Setup

### Backend

```bash
cd apps/api
bundle install
rails db:create db:migrate db:seed
rails server
```

### Mobile

```bash
cd apps/mobile
npm install
npx expo start
```

## Milestones

- [x] M1: Repository bootstrap
- [x] M2: Rails setup (API, CORS, Devise+JWT, Active Storage)
- [x] M3: Migrations + Models
- [x] M4: Controllers + Routes + Serializers
- [x] M5: Seed data
- [x] M6: RSpec tests (80/80 passing)
- [x] M7: Expo project setup (NativeWind, fonts, deps)
- [x] M8: Auth screens (sign-in, sign-up)
- [x] M9: API layer + React Query + Zustand auth
- [x] M10: Feed screen with tab switcher
- [x] M11: Bench detail screen with ratings + comments
- [x] M12: Create bench flow (3-step form)
- [x] M13: Explore map screen with nearby
- [x] M14: Profile screen
- [x] M15: React Native tests (23/23 passing)
- [x] M16: Final verification

## Architecture

- Rails API on `localhost:3000`
- Expo dev server on default Expo port
- `EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1`