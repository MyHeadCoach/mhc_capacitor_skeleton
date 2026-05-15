# Agent guide

This repository is a Capacitor + Ionic + Vue mobile app skeleton. **Before making changes, read [`skills.md`](./skills.md)** — it is the canonical onboarding doc for both humans and AI assistants.

## Quick start

```bash
npm install
cp .env.example .env       # then fill in real values
npm run dev                # http://localhost:5173
```

## Conventions you should follow

- **Four-touchpoint pattern.** A feature module lives in exactly four places: `src/pages/<feature>/`, `src/stores/<feature>.ts`, an entry in `src/router/index.ts`, and an entry in `src/layouts/TabsLayout.vue`. See *Adding or removing a feature* in `skills.md`.
- **Auth.** All HTTP goes through the axios instance in `src/services/api.ts`, which attaches the bearer token automatically. Don't bypass the interceptor or re-implement auth.
- **Route auth-gating.** Routes in `src/router/index.ts` are auth-gated by default. To make a route publicly reachable (e.g. login, about, privacy), set `meta: { public: true }` on the route record — the global guard in `router.beforeEach` checks `to.meta.public` to decide whether to allow unauthenticated access. There is no `requiresAuth` flag; the model is allowlist (public), not denylist.
- **State.** One Pinia store per feature in `src/stores/`. Keep stores focused on a single feature module.
- **Realtime.** Subscribe to Reverb channels via the Echo instance in `src/services/echo.ts`. Use `.private()` / `.join()` for anything user-specific; never `.channel()` for sensitive data.
- **Single-tenant per app.** The backend is multi-tenant but the skeleton assumes each tenant ships their own branded app — users belong to one tenant and never pick one. `selectTenant()` exists in `src/services/auth.ts` for the rare admin/support account spanning multiple tenants; do not build a tenant-picker UI for normal end users. See *Multi-tenant model* in `skills.md`.

## Owned by the backend — do not change

These contracts are server-owned. Changing them on the client will desync. See *Owned by the backend* in `skills.md` for the full list.

- API path shapes (`/api/m/...`)
- WebSocket channel names
- Auth token shape (Sanctum bearer)
- Push payload shape

## Where things live

| Path | What |
|---|---|
| `src/services/` | api client, auth, push, realtime |
| `src/stores/` | Pinia state, one per feature |
| `src/pages/` | route-level components |
| `src/composables/` | reusable composables (e.g. biometric login) |
| `src/components/` | shared UI components |
| `src/router/index.ts` | route table + guards |
| `src/layouts/TabsLayout.vue` | tab bar |
| `capacitor.config.ts` | native app config |
| `.env.example` | environment template |
