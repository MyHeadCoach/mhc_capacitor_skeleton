# Skills — Capacitor + Ionic + Vue Skeleton

A condensed onboarding guide for any developer or AI agent picking up this repo. Each section is action-oriented: how to do the thing, and where in the code to look.

This skeleton is wired for a **Laravel Sanctum + Reverb** backend (any compatible backend will work — only the URL and key in `.env` need to change). The web app builds with **Vite** and wraps with **Capacitor** for iOS and Android.

---

## 1. How to auth

The skeleton uses Laravel Sanctum bearer tokens.

- **Token storage:** `localStorage` key `app_auth_token` — see `src/services/api.ts`.
- **Token attached to every request** by an axios request interceptor in `src/services/api.ts`. Header format: `Authorization: Bearer <token>`.
- **User profile cache:** `localStorage` key `app_user_data` for offline-friendly session restore — see `src/services/auth.ts`.

### Login flow

```ts
// src/services/auth.ts:login()
POST {VITE_API_BASE_URL}/api/m/auth/login
Body: { email, password }
→ { token, user }  // or { two_factor: true } if MFA challenge required
```

After a successful login the skeleton calls `setAuthToken(token)`, persists the user, and calls `ensurePushRegistration()` to register the device for push.

### Other auth endpoints

| Action | Method + path | Where called |
|---|---|---|
| Session restore | `GET /api/m/user` | `src/services/auth.ts:checkSession` |
| Switch tenant (admin-only, see below) | `POST /api/m/auth/select-tenant` | `src/services/auth.ts:selectTenant` |
| Logout | `POST /api/m/auth/logout` | `src/services/auth.ts:logout` |

### Multi-tenant model

The backend (`User`, `Trade`, `Community`, `Message`, …) carries a `tenant_id`. The skeleton is built on the assumption that **each tenant ships their own branded app for their own users**, so an end user belongs to exactly one tenant and never picks one.

`selectTenant(tenantId)` in `src/services/auth.ts` exists only for the edge case of a user (typically a back-office admin or cross-tenant support staff on the backend side) whose account is associated with more than one tenant. The default `LoginPage.vue` does **not** call it, and no UI in the skeleton exposes a tenant picker.

What this means in practice:

- **For a normal tenant build:** leave `selectTenant` alone. Do not add a tenant-picker screen, a tenant-switch menu item, or any UI that calls `/api/m/auth/select-tenant`. End users should never see it.
- **Login returns the user's tenant.** The `User` payload from `/api/m/auth/login` already includes `tenant_id`. All subsequent API calls are implicitly scoped by it server-side.
- **If you're building an internal/admin variant** that legitimately needs cross-tenant switching: the function and route are wired up, you just need to add the picker UI and call `selectTenant()` after login.

If your tenant rebrand will never need cross-tenant switching, you can also delete the `selectTenant` export and the `/api/m/auth/select-tenant` row from this doc — neither is referenced by any page in the skeleton.

### Biometric quick-login

`src/composables/useBiometric.ts` uses `@capgo/capacitor-native-biometric` to store credentials in the native keychain (iOS Touch/Face ID, Android fingerprint). After first password login the user is prompted to enable biometrics on `LoginPage.vue`.

### State management

`src/stores/auth.ts` (Pinia) exposes `user`, `requiresTwoFactor`, `isLoading`, `error`, `isInitialized`. Router guards in `src/router/index.ts` initialize the store before protected routes resolve.

---

## 2. API endpoints available

All endpoints are relative to `VITE_API_BASE_URL`. All authed endpoints require the `Authorization: Bearer <token>` header (added automatically by the axios interceptor).

### Auth & user

| Method | Path | Source |
|---|---|---|
| POST | `/api/m/auth/login` | `src/services/auth.ts` |
| POST | `/api/m/auth/select-tenant` | `src/services/auth.ts` |
| POST | `/api/m/auth/logout` | `src/services/auth.ts` |
| GET | `/api/m/user` | `src/services/auth.ts` |
| GET | `/api/m/dashboard` | dashboard store |

### Trading

| Method | Path | Notes |
|---|---|---|
| GET | `/api/m/trading/trades` | Paginated. Query: `page`, `per_page`, `trades_filter` (`mine`/`coaches`/`all`), `status`, `search`, `instrument_type`, `trading_style`, `strategy_tag`, `date_from`, `date_to`, `sort`, `sort_dir`. Source: `src/stores/trades.ts` |
| POST | `/api/m/trading/trades/{tradeId}/copy` | Body: `{ entry_price, entry_time, position_size, entry_fees?, entry_notes? }` |

### Communities & chat

| Method | Path | Notes |
|---|---|---|
| GET | `/api/m/my-communities` | User's community memberships. Source: `src/stores/chat.ts` |
| POST | `/api/m/my-communities/{roomId}/toggle-favorite` | Pin/unpin |
| GET | `/api/m/communities/{communityId}/feed` | Query: `per_page`. Source: `src/stores/chat.ts`, `src/stores/announcements.ts` |
| POST | `/api/m/communities/{communityId}/feed` | Body: `{ content }` |
| POST | `/api/m/communities/{communityId}/feed/{messageId}/like` | Toggle like on a feed post |
| GET | `/api/m/dm` | DM conversation list |
| POST | `/api/m/dm` | Create or fetch a DM room. Body: `{ recipient_id }` |
| GET | `/api/m/dm/{roomId}/messages` | DM thread. Query: `before_id` for cursor pagination |
| POST | `/api/m/dm/{roomId}/messages` | Body: `{ message, type: 'text', reply_to_id? }` |
| POST | `/api/m/dm/{roomId}/messages/{messageId}/react` | Body: `{ emoji }`. Triggers the `chat.reaction.updated` Echo event |
| POST | `/api/m/dm/{roomId}/read` | Mark all messages in room as read (clears `unread_count`) |

### Events & push

| Method | Path | Notes |
|---|---|---|
| GET | `/api/m/events?filter=upcoming` | Source: `src/stores/sessions.ts` |
| POST | `/api/m/mobile/push-tokens` | Body: `{ token, platform, appVersion }`. Source: `src/services/notifications.ts` |
| POST | `/api/m/broadcasting/auth` | Reverb/Echo channel auth. Source: `src/services/echo.ts` |

### Response envelope

Most endpoints return one of: a raw object, `{ data }`, `{ data: { data: [] } }`, or `{ <entity>: { data: [] } }`. Stores include defensive parsing for these shapes — copy that pattern if you add endpoints.

### Realtime

Laravel Reverb over the Pusher protocol via `laravel-echo` + `pusher-js`. Connection setup in `src/services/echo.ts`. `Echo.private(name)` adds the `private-` wire prefix automatically — the constants in code are unprefixed.

**Channels** (from `echoChannels` in `src/services/echo.ts`):

| Helper | Name | Used for |
|---|---|---|
| `echoChannels.chatRoom(id)` | `chat.room.{id}` | Community room messages |
| `echoChannels.dm(id)` | `chat.room.{id}` | DMs (same broadcast namespace as community rooms) |
| `echoChannels.userNotifications(id)` | `user.{id}` | Per-user notification events |

**Events** (from `echoEvents` in the same file):

| Constant | Wire name | Trigger |
|---|---|---|
| `messageSent` | `message.sent` | New message in a chat room or DM |
| `reactionUpdated` | `chat.reaction.updated` | A reaction was added or removed |
| `messageRead` | `message.read` | Read receipt |
| `userOnlineStatus` | `user.online.status` | Presence change |
| `userTyping` | `user.typing` | Typing indicator |
| `notificationCreated` | `notification.created` | New in-app notification |
| `meetingStarted` / `meetingEnded` | `meeting.started` / `meeting.ended` | Live meeting lifecycle |
| `sessionEnded` | `coaching.session.ended` | Coaching session ended |

Private-channel authentication goes through `POST /api/m/broadcasting/auth` (configured via Echo's `authEndpoint`).

### Error responses

All endpoints return Laravel-standard error shapes:

| Status | Body | Notes |
|---|---|---|
| 401 Unauthorized | `{ "message": "Unauthenticated." }` | The axios response interceptor in `src/services/api.ts` clears the token and redirects to `/login` automatically |
| 403 Forbidden | `{ "message": "This action is unauthorized." }` | |
| 404 Not Found | `{ "message": "..." }` | |
| 422 Validation Error | `{ "message": "...", "errors": { "field": ["message"] } }` | Surface `errors[field][0]` next to the form field |

When adding new API calls, 401 is handled globally — you don't need a per-call redirect. Handle 422 explicitly where forms are involved.

---

## 3. How to install npm dependencies

```bash
npm install
cp .env.example .env       # then fill in real values
npm run dev                # web dev server on http://localhost:5173
```

- **Package manager:** npm (lockfile is `package-lock.json` v3). Do not switch to yarn / pnpm / bun without regenerating the lockfile.
- **Node:** 18+ recommended.
- **Scripts:** `npm run dev` (Vite dev server), `npm run build` (typecheck + Vite build → `dist/`), `npm run preview`, `npm run test:unit` (Vitest), `npm run test:e2e` (Cypress), `npm run lint` (ESLint).

---

## 4. `npx cap *` commands to know

| Command | When to use |
|---|---|
| `npx cap add ios` | One-time: initialize iOS platform |
| `npx cap add android` | One-time: initialize Android platform |
| `npx cap sync` | After every `npm run build` — copies `dist/` to native projects **and** updates native deps (Pods / Gradle) |
| `npx cap copy` | Web assets only, skip native dep refresh |
| `npx cap open ios` | Open the Xcode workspace |
| `npx cap open android` | Open the Android Studio project |
| `npx cap run ios` | Build + launch on simulator or device |
| `npx cap run android` | Build + launch on emulator or device |

**Typical dev loop:**

```bash
npm run build && npx cap sync && npx cap open ios
```

Configuration lives in `capacitor.config.ts`:

```ts
appId: 'com.example.capacitorskeleton'
appName: 'CapacitorSkeleton'
webDir: 'dist'
```

Change `appId` and `appName` to your own before adding platforms. Also update `SERVER_ID` in `src/composables/useBiometric.ts` to match — it's the Keychain/Keystore service identifier for biometric credentials and must be unique per tenant.

---

## 5. How to add Android / iOS

This skeleton ships **web-only** — there is no `ios/` or `android/` folder. Add the platforms yourself.

### Add iOS

```bash
npm run build
npx cap add ios
npx cap open ios
```

In Xcode:
1. Select the `App` target → **Signing & Capabilities** → set your Team and Bundle Identifier (must match `appId` in `capacitor.config.ts`).
2. Add the **Push Notifications** capability if you plan to use FCM (§6).
3. Drop in `GoogleService-Info.plist` if you use Firebase (§6).
4. Build to a simulator or device.

### Add Android

```bash
npm run build
npx cap add android
npx cap open android
```

In Android Studio:
1. Verify `applicationId` in `android/app/build.gradle` matches `appId` in `capacitor.config.ts`.
2. Place `google-services.json` at `android/app/google-services.json` if you use Firebase (§6).
3. Create a release keystore via Build → Generate Signed Bundle/APK when you're ready to ship.

After any web change: `npm run build && npx cap sync`.

---

## 6. How to configure FCM (push notifications)

The skeleton uses `@capacitor/push-notifications` and already implements device-token registration end-to-end. The only per-tenant work is dropping in two Firebase config files and turning on the iOS push capability.

### V1 push model — hosted Firebase project

For V1, every tenant app is registered as a separate iOS / Android app inside a **single shared Firebase project** owned by the platform admin (us). This keeps onboarding light: you (the tenant) don't need a Firebase account, and the backend doesn't need a per-tenant credential registry. A future "bring your own Firebase" mode is possible — see the note at the end of this section — but it is **not** part of V1.

Why this works: the FCM HTTP v1 endpoint `https://fcm.googleapis.com/v1/projects/{projectId}/messages:send` is project-scoped, not app-scoped. The FCM token issued to a device encodes which iOS bundle / Android package it belongs to, so one service account and one URL route correctly to every tenant app in the project. The backend's `SendPushNotificationJob` works unchanged as new tenants onboard.

### What you (the tenant) provide to the platform admin, once

Email these during onboarding:

| Item | Where to find it | Why we need it |
|---|---|---|
| iOS Bundle ID | Whatever you set in `capacitor.config.ts` → `appId` | Registered as a new iOS app in the shared Firebase project |
| Android package name | Same `appId` | Registered as a new Android app in the shared Firebase project |
| Apple Team ID | Apple Developer → Membership → 10-char Team ID | Required so Firebase routes APNs auth to the right Apple team |
| APNs Authentication Key (`.p8`) | Apple Developer → Keys → create a new APNs key | We upload it under your Team ID in the shared Firebase project so iOS pushes can be signed |
| APNs Key ID | 10-char ID shown next to the .p8 in Apple Developer | Pairs with the .p8 |

Note on the .p8: an APNs auth key authorises push for **every app under that Apple Team**, not just the white-label one. If that's a concern, generate a dedicated APNs key for the white-label app rather than reusing one you already use elsewhere.

### What the platform admin hands back to you

Two config files, generated by Firebase from your bundle ID / package name:

| File | Where it goes | Notes |
|---|---|---|
| `GoogleService-Info.plist` | Drag into Xcode `App/App/` group with "Copy items if needed" checked | The `BUNDLE_ID` field inside must match `capacitor.config.ts` → `appId` |
| `google-services.json` | `android/app/google-services.json` | The `package_name` field inside must match the Android `applicationId` |

Neither file contains a server secret — the API keys inside them are *client* identifiers and are bundled into every published app. They're safe to commit alongside the rest of your repo.

### What the skeleton already does

`src/services/notifications.ts` implements the full client-side flow:

- Requests push permission on first call to `ensurePushRegistration()` (invoked after login and after biometric session restore).
- Registers listeners for `registration`, `registrationError`, `pushNotificationReceived`, and `pushNotificationActionPerformed`.
- On token receipt: `POST /api/m/mobile/push-tokens` with `{ token, platform, appVersion }`, caching the payload in `localStorage` (`app_push_device_token`) to skip re-uploading unchanged tokens.
- On logout: clears the cache via `resetPushRegistrationState()`.

You do **not** need to write any push code to get the basic flow working. The only TODO inside the skeleton is the deep-link handler in `pushNotificationActionPerformed` — wire that to `router.push(...)` based on the notification's `data.route` once your routes exist.

### What the backend does (no changes needed per tenant)

`POST /api/m/mobile/push-tokens` stores the token against the authenticated user (and their tenant). `SendPushNotificationJob` posts to FCM with the project's shared service account; FCM routes by token. Adding a new tenant requires:

- Firebase console clicks: ~5 minutes (add iOS app, add Android app, upload .p8 if a new Apple Team)
- Backend code changes: **none**
- Mobile code changes: just dropping in the two config files below

### Per-tenant build checklist

1. Set `appId` and `appName` in `capacitor.config.ts` (and update `SERVER_ID` in `src/composables/useBiometric.ts` to match — see §4).
2. `npm run build && npx cap add ios && npx cap add android` if platforms aren't added yet.
3. Send the platform admin the items in the table above; receive the two config files.
4. Drop `GoogleService-Info.plist` into the iOS project (Xcode → `App/App/` group, "Copy items if needed").
5. Drop `google-services.json` into `android/app/`.
6. Xcode → `App` target → **Signing & Capabilities** → set Team to your Apple Developer account → **+ Capability → Push Notifications**.
7. `npx cap sync`.
8. Run on a **physical device** (iOS Simulator does not deliver push). Log in once to trigger `ensurePushRegistration()`.
9. Confirm the token landed in `device_push_tokens` on the backend, then ask the platform admin to fire a test push.

### Future: bring-your-own Firebase (not V1)

If a tenant later wants their own Firebase project (typically driven by wanting their own Crashlytics/Analytics, or once the shared project's blast radius starts to matter at scale), the migration is: tenant creates a Firebase project, generates their own service account JSON, the backend grows a per-tenant credential registry, and the send job loads creds dynamically. **None of this is part of V1.** It's mentioned here only so nothing in the V1 design blocks the path.

---

## 7. How to deploy to App Store and Play Store

No CI/CD is included. These are manual workflows.

### Pre-flight (both platforms)

```bash
npm run build && npx cap sync
```

Bump version in three places to keep them aligned:
- `package.json` → `version`
- iOS `Info.plist` → `CFBundleShortVersionString` and `CFBundleVersion`
- Android `app/build.gradle` → `versionName` and `versionCode`

### App Store (iOS)

1. `npx cap open ios`
2. In Xcode select **Any iOS Device (arm64)** as the run destination.
3. Product → **Archive**.
4. In the Organizer window: **Distribute App** → **App Store Connect** → upload.
5. In App Store Connect: complete metadata (description, keywords, age rating, privacy details), upload screenshots (one set per device family), set a 1024×1024 app icon, attach a privacy policy URL, submit for review.

Requirements: paid Apple Developer account, signing team configured in Xcode, push notification entitlement (if used).

### Play Store (Android)

1. `npx cap open android`
2. Build → **Generate Signed Bundle/APK** → **Android App Bundle (.aab)** → release variant.
3. Sign with your keystore (create one on first release; store it securely — losing it means you cannot update the listing).
4. Play Console → your app → Releases → create a new release (Internal Testing first is recommended) → upload `.aab`.
5. Complete the Play Console questionnaires (content rating, data safety, target audience), add store listing assets, submit for review.

### CI/CD

This skeleton ships **without** GitHub Actions, fastlane, or EAS. Add what fits your team.

---

## 8. Adding or removing a feature

Every feature module in this skeleton lives in exactly four places. Toggling a feature means hitting all four — miss one and you get a runtime error or a dead tab.

1. **Page components** — `src/pages/<feature>/` (e.g. `src/pages/trades/`)
2. **Pinia store** — `src/stores/<feature>.ts`
3. **Route entries** — `src/router/index.ts`
4. **Tab bar entry** — `src/layouts/TabsLayout.vue`

### Adding a feature called `myfeature`

- Create `src/pages/myfeature/MyFeaturePage.vue` (and any sub-pages).
- Create `src/stores/myfeature.ts` with the Pinia store and the API calls the feature needs.
- Register the route(s) in `src/router/index.ts`. Use `meta: { requiresAuth: true }` for any view that should be auth-gated.
- Add the tab in `src/layouts/TabsLayout.vue` with an icon, label, and the route path.

### Removing a feature (e.g. `sessions`)

- Delete `src/pages/sessions/`.
- Delete `src/stores/sessions.ts`.
- Remove the route(s) from `src/router/index.ts`.
- Remove the tab entry from `src/layouts/TabsLayout.vue`.
- Search for stray imports: `grep -r "from '@/stores/sessions'" src/` and `grep -r "from '@/pages/sessions'" src/`.

The pattern is deliberately symmetric. If you find yourself touching files outside these four locations to enable or disable a feature, you've found a leak — fix the leak rather than working around it.

---

## 9. Adding a standalone page (no backend integration)

Sometimes you just need a static page — About, FAQ, Help, Privacy Policy, a custom welcome screen, a marketing screen for a specific tenant — that doesn't talk to the backend at all. The four-touchpoint pattern in §8 is overkill for this. Use the three-step shortcut below.

### 1. Create the page

For a single page, a flat `.vue` file under `src/pages/` is fine. For anything with sub-pages, use a folder.

```vue
<!-- src/pages/AboutPage.vue -->
<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>About</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent class="bg-slate-900">
      <div class="px-4 py-6 space-y-4">
        <h1 class="text-2xl font-bold text-white">About this app</h1>
        <p class="text-slate-300">Your static content goes here.</p>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue';
</script>
```

Match the styling pattern of the other pages (Tailwind on the dark slate background). Reuse `AppButton`, `MenuSection`, `MenuItem`, etc. from `src/components/` to keep visual consistency.

### 2. Register the route

In `src/router/index.ts`:

```ts
{
  path: '/about',
  name: 'about',
  component: () => import('@/pages/AboutPage.vue'),
  meta: { public: true },  // bypass the auth guard; omit `meta` (or set `public: false`) to auth-gate the page
},
```

Use the lazy `() => import(...)` form so the page is split out of the initial bundle.

### 3. Make it reachable — pick one

- **Menu link (most common).** Drop a `MenuItem` into an existing `MenuSection`. The Profile page's menu blocks are the natural home for About / Help / Privacy entries.
- **Tab bar entry (rare for static pages).** Add to `src/layouts/TabsLayout.vue` with an icon and label — but be cautious about cluttering the tab bar; most static pages don't warrant a tab.
- **Inline link or button anywhere.** `router.push('/about')` from a click handler, or `<router-link to="/about">` in a template.

### What you don't need

- **No Pinia store.** Static pages have no shared state.
- **No `src/services/` calls.** No backend means no axios, no Echo subscription, nothing in `services/`.
- **No backend coordination.** Anything that lives entirely inside the bundle is yours to add, change, or remove without touching the API.

If the page later grows to need server data, graduate it to the full four-touchpoint pattern in §8.

---

## 10. Customizing the look and feel

The skeleton ships a dark-slate UI with emerald primary. Three layers control everything visual; change them in this order to rebrand the app.

### Layer 1 — Ionic design tokens (`src/theme/variables.css`)

Ionic CSS custom properties for primary / secondary / tertiary / success / warning / danger, plus background, text, card, toolbar, and item colors. Editing these cascades through all `Ion*` components (alerts, tab bar, native form controls, etc.) automatically.

```css
:root {
  --ion-color-primary: #10b981;          /* change this */
  --ion-color-primary-rgb: 16, 185, 129;  /* and this (rgb form is required) */
  --ion-color-primary-shade: #0ea472;
  --ion-color-primary-tint: #28c08e;
  --ion-background-color: #0f172a;        /* base background */
  /* ...etc */
}
```

Each named color needs all four variants (`-rgb`, `-shade`, `-tint`, `-contrast`) — Ionic uses them internally for hover, active, and contrast states.

### Layer 2 — Global element overrides (`src/style.css`)

Where the dark background (`#0f172a`) and toolbar styling are hardcoded as element selectors:

```css
ion-header  { background: #0f172a; border: none; }
ion-toolbar { --background: transparent; --border-width: 0; padding: 24px 16px 12px; }
ion-content { --background: #0f172a; }
```

This is also where Tailwind is imported (`@import "tailwindcss"`). Edit the colors here if you want a different base, or add `@font-face` rules for custom fonts.

### Layer 3 — Tailwind utilities (in each `.vue` file)

Most pages style themselves with Tailwind classes (`bg-slate-900`, `text-slate-300`, `rounded-2xl`). To swap the neutral palette, find-and-replace `slate-` across `src/` with your chosen Tailwind palette (`zinc`, `gray`, `neutral`, `stone`, or your custom one).

### Gotcha — `AppButton.vue` has its own color table

`src/components/AppButton.vue` hardcodes RGB values per variant inside a `variantStyles` constant (lines 41–72). It **does not** read from Ionic CSS variables. To restyle buttons you must edit this file directly:

```ts
const variantStyles: Record<ButtonVariant, Record<string, string>> = {
  primary: {
    backgroundColor: 'rgb(6 78 59)',     // change these
    borderColor: 'rgb(5 150 105)',
    color: 'rgb(110 231 183)',
  },
  // ...
};
```

`AppBadge.vue` is the opposite — it uses Tailwind classes (`bg-emerald-500/20 text-emerald-400 ...`), so a palette find-and-replace at Layer 3 covers it. Most other components (`AppHeader`, `MenuItem`, `MenuSection`, `TradeCard`, `MessageBubble`, etc.) are Tailwind-only and pick up palette changes automatically.

### App icon and splash screen

Source SVGs live in `resources/`:

- `resources/icon.svg`
- `resources/splash.svg`

Replace them with your own, then generate platform-specific assets at every required size:

```bash
npm install --save-dev @capacitor/assets
npx @capacitor/assets generate
```

This writes iOS icon sets, Android mipmaps, and splash screens into the native platform folders. Re-run after any visual change to the source SVGs.

### Fonts

The skeleton uses the system font stack (Tailwind's `font-sans` default). To use a custom font, either add `@font-face` rules in `src/style.css` and extend Tailwind's `theme.fontFamily`, or `@import` a hosted font (Google Fonts, etc.) at the top of `src/style.css`.

### Light mode

To add a light theme: gate hardcoded dark backgrounds behind Tailwind's `dark:` variant (`bg-white dark:bg-slate-900`), toggle a `dark` class on `<html>` from a composable, and add a `@media (prefers-color-scheme: light)` block in `variables.css` for the Ionic side.

### Per-tenant rebrand checklist

For a full brand swap, touch these in order:

1. `src/theme/variables.css` — Ionic color tokens (all four variants per color).
2. `src/style.css` — global element backgrounds (`#0f172a`) and the Tailwind import.
3. `src/components/AppButton.vue` — `variantStyles` table.
4. Find-and-replace Tailwind palette across `src/` (e.g. `slate-` → `zinc-`, `emerald-` → `indigo-`).
5. `resources/icon.svg` and `resources/splash.svg` → re-run `npx @capacitor/assets generate`.
6. `capacitor.config.ts` — `appName` (the home-screen label).
7. `index.html` — `<title>` and `<meta name="apple-mobile-web-app-title">`.
8. `src/composables/useBiometric.ts` — `SERVER_ID` constant. This is the iOS Keychain / Android Keystore service identifier used to store biometric credentials. Must match your `appId` (or at least be unique per tenant), otherwise two apps derived from this skeleton share a keychain namespace and read each other's stored credentials.

---

## 11. Owned by the backend — do not change

These contracts are owned by the backend (Laravel + Sanctum + Reverb). The mobile app must conform to them; the reverse is not true. Changes here require backend coordination, not a local edit:

- **API path shapes.** The `/api/m/...` routes in §2. Renaming or restructuring them on the client desyncs immediately.
- **WebSocket channel names.** `chat.room.{roomId}`, `user.{userId}`, etc. — defined by the server's broadcast events. The client subscribes to whatever the server publishes; don't rename on the way in.
- **Auth token shape.** Sanctum bearer string, attached as `Authorization: Bearer <token>`. Do not wrap, re-encode, or split it.
- **Push payload shape.** Outgoing token registration is `{ token, platform, appVersion }` to `/api/m/mobile/push-tokens`. Incoming notifications carry whatever the backend's FCM dispatcher sends — read those keys, don't normalize them away.

Rule of thumb: if a contract is awkward to consume on the client, file an issue against the backend rather than patching around it locally.

---

## Project layout reference

```
src/
├── components/        # Reusable Vue components (AppHeader, AppButton, etc.)
├── composables/       # Vue composables (useBiometric, etc.)
├── pages/             # Route-level pages (LoginPage, ProfilePage, etc.)
├── router/            # vue-router config + guards
├── services/          # api (axios), auth, notifications, echo
├── stores/            # Pinia stores (auth, trades, chat, sessions, ...)
├── theme/             # Ionic theme variables + Tailwind globals
└── types/             # Shared TypeScript types
capacitor.config.ts    # Capacitor app config
vite.config.ts         # Vite config (dev proxy points at http://localhost:8000)
.env.example           # Copy to .env and fill in
```
