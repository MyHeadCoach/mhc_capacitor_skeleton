# Capacitor + Ionic + Vue Skeleton

A starting point for cross-platform mobile apps built with [Capacitor](https://capacitorjs.com/), [Ionic Vue](https://ionicframework.com/docs/vue/overview), [Vue 3](https://vuejs.org/), [Pinia](https://pinia.vuejs.org/), and [Tailwind CSS](https://tailwindcss.com/). Wired for a Laravel Sanctum + Reverb backend, but the auth/API patterns are easy to swap.

## What's included

- Bearer-token auth flow with persistent session + biometric quick-login
- Axios client with auth interceptor
- Pinia stores for auth, trades, chat, announcements, sessions, notifications
- Push notification registration via `@capacitor/push-notifications`
- Realtime via `laravel-echo` + `pusher-js` (Reverb-compatible)
- Tab-based navigation, dark theme, responsive layouts

## Quick start

```bash
npm install
cp .env.example .env       # then fill in real values
npm run dev
```

## Going further

See **[skills.md](./skills.md)** for the full onboarding guide — auth, API endpoints, Capacitor commands, adding iOS / Android, FCM setup, and store deployment.
