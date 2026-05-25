# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Expo / React Native client for BenchMark. See the repo-root `CLAUDE.md` for the cross-app contract with the Rails API.

## Commands

```bash
npm install
npx expo start          # dev server (also: npm run ios / android / web)
npm run lint            # expo lint
npm run typecheck       # tsc --noEmit
npm test                # jest (npm run test:watch for watch mode)
npx jest __tests__/api.test.ts   # single test file
```

## Architecture

**Routing — Expo Router (file-based, `app/`).** Route groups: `(auth)` for sign-in/sign-up, `(tabs)` for the main app (index feed, explore map, post, profile), plus dynamic detail routes `bench/[id]` and `user/[id]`. `app/_layout.tsx` is the root: it loads Inter fonts, wraps everything in the React Query provider, and calls `loadStoredAuth()` once on mount.

**Auth — Zustand store (`lib/auth.ts`).** `useAuthStore` holds `user`/`token` and exposes `signIn`/`signUp`/`signOut`/`loadStoredAuth`. The JWT is persisted in **`expo-secure-store`** under the key `auth_token` (not AsyncStorage/Zustand persist). On sign-out it clears the React Query cache. `loadStoredAuth` rehydrates the token on launch and re-fetches the user via `authApi.me()`.

**API layer (`lib/api.ts`).** A single axios instance with `baseURL` from `EXPO_PUBLIC_API_URL` (default `http://localhost:3000/api/v1`). A request interceptor injects the Bearer token from secure-store on every call; a response interceptor deletes the stored token on any `401`. All endpoint functions and the TypeScript interfaces live here — **the interfaces are hand-mirrored from the Rails Blueprinter serializers**, so keep them in sync when the API changes.

**Data fetching — React Query** (`lib/queryClient.ts`), with mutations invalidating queries to refresh.

**Images — always resolve them.** Active Storage returns relative URLs; `lib/images.ts` (`resolvePhotoUrl` / `resolvePhotoUrls`) prefixes them with the API host. Use these for any photo/avatar URL — passing a raw API URL to `<Image>` will fail on device. Note Android emulators need `10.0.2.2` instead of `localhost` for the host machine.

**Styling — NativeWind** (Tailwind classes via `className`), configured in `tailwind.config.js` / `global.css`. Design is Notion-inspired with a green/nature palette; body font is Inter.

## Testing

Jest with React Native preset (`jest.config.js`). Component tests in `__tests__/` cover `lib/` helpers (api, auth) and presentational components (`BenchCard`, `RatingStars`).
