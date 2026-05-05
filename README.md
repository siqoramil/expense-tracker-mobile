# Expense Tracker — Mobile

React Native / Expo client for the Expense Tracker app. Tracks income, expenses, wallets, debts, budgets, and recurring transactions, with a multilingual UI (uz / en / ru / es / fr / de) and Google sign-in.

The production app talks to `https://expensetracker.ovrin.uz` (configured in `app.json` → `expo.extra.apiUrl`). Compatible with **server v1.1.0+**.

## Stack

- **Expo SDK 54** with `expo-router` (file-based navigation) and `expo-dev-client`
- **React Native 0.81** + **React 19**
- **TypeScript 5.9**
- **react-native-reanimated 4** + **react-native-worklets** — animations
- **i18next** + **react-i18next** — localization
- **expo-auth-session** — Google OAuth (`useIdTokenAuthRequest`)
- **expo-image-picker** — profile avatar
- **AsyncStorage** — local persistence (auth token, prefs cache)
- **react-native-svg** — icons / charts (Sparkline)
- **EAS Build** — managed cloud builds (see `eas.json`)

## Requirements

- Node.js `>=20`
- Yarn
- Xcode (iOS) / Android Studio (Android) — required only for `expo run:*` and local prebuild
- An [EAS](https://expo.dev) account — required for `eas build` (production / preview / dev client)
- The [server](../server/README.md) running locally, **or** the deployed instance at `https://expensetracker.ovrin.uz`

## Setup

```bash
yarn install
```

Configure `app.json` → `expo.extra` for your environment:

```json
"extra": {
  "apiUrl": "https://expensetracker.ovrin.uz",
  "googleWebClientId": "...",
  "googleIosClientId": "...",
  "googleAndroidClientId": "...",
  "eas": { "projectId": "..." }
}
```

For physical devices on the local network, set `apiUrl` to your machine's LAN IP (e.g. `http://192.168.1.10:3000`).

## Scripts

| Command | Description |
|---|---|
| `yarn start` | Start Metro bundler |
| `yarn android` | `expo run:android` (requires Android SDK + dev client build) |
| `yarn ios` | `expo run:ios` (requires Xcode + dev client build) |
| `yarn web` | Run as a web app |
| `yarn test` | Run the Vitest unit suite (`tests/`) |
| `yarn test:watch` | Vitest in watch mode |

## Tests

Unit tests live under `tests/` and target pure logic in `lib/api.ts` and `lib/store.ts` — the parts that exercise the v1.1.0 server contract (auto-logout on 401, confirm-delete re-auth payload, Google-link flow, email normalisation). They run on Node via Vitest with module aliases for `expo-constants`, `@react-native-async-storage/async-storage`, and `react-i18next` (see `vitest.config.ts` and `tests/__mocks__/`).

Component-level tests are intentionally out of scope here — those would need a heavier setup (React Native testing library + jsdom). The current suite covers the security-sensitive paths added when the server moved to 1.1.0.

## Running the app

**Dev client (recommended — full native modules including Google sign-in):**

```bash
npx expo prebuild --clean
yarn ios       # or: yarn android
```

Rebuild the dev client whenever you add a native module (e.g. `expo-image-picker`, `expo-auth-session`).

**Expo Go (limited — no `expo-auth-session` Google flow):**

```bash
npx expo start --go -c
```

Scan the QR with the Expo Go app.

## EAS builds

`eas.json` defines three profiles:

| Profile | Distribution | Android output |
|---|---|---|
| `development` | internal (dev client) | — |
| `preview` | internal | `apk` |
| `production` | store / sideload | `apk` (auto-incremented version code) |

Common flow:

```bash
eas login
eas build --profile production --platform android
eas build --profile production --platform ios
eas submit --profile production --platform android   # optional
```

### Google sign-in in production builds

Production builds use a different signing keystore than local dev — Google OAuth will reject requests with `Error 400: invalid_request` until the production SHA-1 is registered.

1. Get the EAS-managed SHA-1:

   ```bash
   eas credentials
   # → Android → production → "Keystore: Manage everything..."
   ```

2. Add that SHA-1 to the **Android** OAuth client at https://console.cloud.google.com/apis/credentials (package: `com.ramildeveloper.expensetracker`). Multiple SHA-1s on the same client are allowed.

3. Each client ID in `app.json` → `expo.extra` must be the correct **type** in Google Cloud:
   - `googleAndroidClientId` → "Android" type with package + SHA-1
   - `googleIosClientId` → "iOS" type with bundle ID
   - `googleWebClientId` → "Web application" type

Changes propagate in 5–10 minutes; no rebuild required.

## Project layout

```
app/
├── _layout.tsx         # Expo Router root layout
└── index.tsx           # App shell, navigation stack, screen routing
components/
├── screens/            # Per-screen components
│   ├── HomeScreen.tsx
│   ├── StatsScreen.tsx
│   ├── ReportsScreen.tsx
│   ├── CalendarScreen.tsx
│   ├── AllTxScreen.tsx
│   ├── TxDetail.tsx
│   ├── WalletsScreen.tsx
│   ├── CategoriesScreen.tsx
│   ├── BudgetsScreen.tsx
│   ├── DebtorsScreen.tsx
│   ├── DebtorDetail.tsx
│   ├── RecurringScreen.tsx
│   ├── NotificationsScreen.tsx
│   ├── ProfileScreen.tsx
│   └── SettingsSubs.tsx
├── AccountSheets.tsx   # Forgot password / email change bottom sheets
├── AddSheet.tsx        # Bottom-sheet for new transactions
├── Icon.tsx            # SVG icon set
├── LoginScreen.tsx     # Email + password + Google sign-in
├── Onboarding.tsx
├── Sparkline.tsx       # Mini chart component
├── TabBar.tsx          # Bottom tab bar
└── ui.tsx              # Shared UI primitives
lib/
├── api.ts              # REST client + ApiError class
├── googleAuth.ts       # expo-auth-session wrapper with safe fallback
├── store.ts            # Global state + actions (AsyncStorage-backed)
├── i18n.ts             # tStr(lang, key) helper
├── locales/            # uz, en, ru, es, fr, de
├── tokens.ts           # Theme tokens (light / dark)
├── format.ts           # Currency, date, number formatting
└── toast.ts            # Toast helper
assets/                 # Icons, splash, fonts
constants/              # Static config
android/  ios/          # Generated by `expo prebuild` — do not hand-edit
```

## Server contract (v1.1.0)

The mobile client expects the security model added in server `1.1.0`. Worth knowing:

- **Token revocation.** Resetting the password on the server bumps `passwordChangedAt` and invalidates every previously-issued JWT. The client detects a `401` response and clears the local session via the `setUnauthorizedHandler` wired up in `lib/store.ts:hydrate`. The user is bounced to the login screen automatically.
- **Google linking is no longer automatic.** `POST /auth/google` returns `409 account_link_required` when the email already has a password account. Mapped to a friendly message in `LoginScreen`. The user must sign in with their password first, then call `actions.linkGoogle(idToken)` (wraps `POST /auth/google/link`) to attach a Google identity. The Google ID token's email must match the account email.
- **Account deletion requires re-auth.** `confirmAccountDelete(code, reauth)` now takes a second arg: `{ password }` for password accounts, `{ idToken }` (fresh Google sign-in) for Google-only accounts. `DeleteAccountSheet` picks the right form based on `profile.hasPassword` / `profile.hasGoogle`, both surfaced by the server in `UserDTO`.
- **Strict body validation.** Server v1.1.0 disables Fastify's silent-strip default — sending unknown fields to `PATCH /auth/me` (or any other body) returns `400 bad_request`. `lib/store.ts` only sends whitelisted fields, but be careful when extending API calls.
- **Avatar size cap.** `avatar` is limited to ~600 KB on the server. The image picker uses `quality: 0.3` + `aspect: [1, 1]`, which typically produces 150–300 KB base64, so the cap rarely matters in practice. Migration to a CDN/S3 URL is on the server roadmap.

## Localization

Translations live in `lib/locales/<lang>.json`. Use `tStr(lang, key)` from `lib/i18n.ts` for static text. The current language comes from `store.get().prefs.lang` (`uz` default).

Supported: Uzbek (`uz`), English (`en`), Russian (`ru`), Spanish (`es`), French (`fr`), German (`de`).

## Theming

Tokens are produced by `makeTokens(dark)` in `lib/tokens.ts` and threaded through components as the `t` prop. Dark mode follows `store.get().prefs.dark`.

## Troubleshooting

- **Production APK login fails with "Cannot reach the server"** — verify the device has internet, then check `Constants.expoConfig.extra.apiUrl` was bundled correctly. The API URL is read from `app.json` at build time; changing it requires a new build.
- **Google sign-in "Error 400: invalid_request" in production** — see *Google sign-in in production builds* above. Most common cause: production keystore SHA-1 not registered in Google Cloud Console.
- **`account_link_required` after Google sign-in** — the email already has a password account on the server. Sign in with the password instead, then link Google from the profile.
- **User keeps being kicked back to login** — the JWT is being rejected (`401 token_revoked`). Usually means the password was reset elsewhere; sign in again to get a fresh token.
- **`Old dev client — rebuild required`** — a native module was added since the dev client was built. Run `npx expo prebuild --clean && yarn ios` (or `yarn android`).
- **Metro cache issues** — `npx expo start -c` to clear the cache.
