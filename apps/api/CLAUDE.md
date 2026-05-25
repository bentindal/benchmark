# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Rails 7.1 API-only backend (Ruby 3.4.2) for BenchMark. See the repo-root `CLAUDE.md` for the cross-app contract.

## Commands

```bash
bundle install
rails db:create db:migrate db:seed   # seeds are idempotent — safe to re-run
rails server                         # localhost:3000

bundle exec rspec                    # full suite
bundle exec rspec spec/requests/api/v1/benches_spec.rb        # one file
bundle exec rspec spec/requests/api/v1/benches_spec.rb:42     # one example by line
```

## Authentication — read this before touching auth

Two parallel auth surfaces exist and they are easy to confuse:

1. **Devise routes** at the root (`/login`, `/logout`, `/signup`) — these are what `devise-jwt` watches to *dispatch* (issue) and *revoke* JWTs. Configured in `config/initializers/devise.rb`. Token expiry is 1 day; the JWT secret falls back to `Rails.application.secret_key_base` if `DEVISE_JWT_SECRET_KEY` is unset.
2. **The `/api/v1` controllers** (`registrations#sign_up`, `sessions#sign_in`, etc.) — these are what the mobile app actually calls.

Revocation uses the JTI matcher strategy (`User` includes `Devise::JWT::RevocationStrategies::JTIMatcher`; the `users.jti` column must exist).

`Api::V1::ApplicationController` does **not** use Devise's `authenticate_user!`. It manually decodes the Bearer token in `set_current_user` via `Warden::JWTAuth::UserDecoder`, leaving `@current_user` nil on failure. Endpoints that require a logged-in user call `require_authentication!` explicitly. So a controller action is **public unless it opts in** — don't assume auth is enforced.

CORS is wide open (`origins "*"`) in `config/initializers/cors.rb` for local dev, and exposes the `Authorization` header.

## Domain model

- `User` has many `benches`, `ratings`, `comments`. Follows are self-referential through the `Follow` join (`given_follows`/`received_follows` → `following`/`followers`).
- `Bench` `has_many_attached :photos` (1–5 photos required on create — see `must_have_at_least_one_photo` and `photos_count_limit`). Computes `average_rating` (a hash of view/comfort/location/overall) and counts on the fly.
- `Rating` enforces one rating per user per bench (uniqueness on `[user_id, bench_id]`). `view_score` and `overall_score` are required (1–5); `comfort_score`/`location_score` are optional. `after_save` touches the bench so caches/`updated_at` move.
- Geo search lives in `Bench.near(lat, lng, radius_km)` — a raw Haversine SQL expression that also selects `distance_km`. This powers `GET /api/v1/benches/nearby`.

## Conventions

- Responses are serialized with **Blueprinter** (`app/serializers/*_blueprint.rb`), not ActiveModel::Serializers or jbuilder. Keep these in sync with the mobile TS types in `apps/mobile/lib/api.ts`.
- Pagination is hand-rolled in `Api::V1::ApplicationController#paginate` / `pagination_params` (`page`/`per_page` params, default 20, max 100, offset-based).
- Tests are RSpec request specs (`spec/requests/api/v1/`) using FactoryBot + Faker. `.rspec` requires `spec_helper`.
