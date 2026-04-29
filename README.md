# Expense Tracker — Mobile

React Native / Expo client for the Expense Tracker app. Tracks income, expenses, wallets, debts, budgets and recurring transactions, with an Uzbek / English UI.

## Stack

- **Expo SDK 54** (`expo-router`, `expo-dev-client`)
- **React Native 0.81** + **React 19**
- **TypeScript**
- **react-native-reanimated** — animations
- **i18next** + **react-i18next** — localization (uz / en)
- **expo-image-picker** — profile avatar
- **AsyncStorage** — local persistence

## Requirements

- Node.js `>=20`
- Yarn
- Xcode (iOS) / Android Studio (Android) — only needed if rebuilding the dev client
- The [server](../server/README.md) running on `http://localhost:3000`

## Setup

```bash
yarn install
```

Configure the API URL in `app.json` under `expo.extra.apiUrl` (default `http://localhost:3000`). For physical devices, replace `localhost` with your machine's LAN IP.

## Scripts

| Command | Description |
|---|---|
| `yarn start` | Start Metro bundler |
| `yarn android` | Open on Android emulator / device |
| `yarn ios` | Open on iOS simulator / device |
| `yarn web` | Run in the browser |

## Running the app

**Expo Go (fastest):**

```bash
npx expo start --go -c
```

Scan the QR with Expo Go.

**Dev client (full native modules):**

```bash
npx expo prebuild --clean
npx expo run:ios       # or run:android
```

Required after adding any native module (e.g. `expo-image-picker`).

## Project layout

```
app/
├── _layout.tsx         # Expo Router root layout
└── index.tsx           # App shell, navigation stack, screen routing
components/
├── screens/            # Per-screen components (Home, Stats, Profile, …)
├── AddSheet.tsx        # Bottom-sheet for new transactions
├── LoginScreen.tsx
├── Onboarding.tsx
├── TabBar.tsx
└── ui.tsx              # Shared UI primitives
lib/
├── api.ts              # Server client
├── store.ts            # Global state + actions
├── i18n.ts             # Localization
├── tokens.ts           # Theme tokens (light / dark)
├── format.ts
└── toast.ts
```

## Localization

Translations live in `lib/locales/`. Use `tStr(lang, key)` from `lib/i18n.ts` for static text.

## Theming

Tokens are produced by `makeTokens(dark)` in `lib/tokens.ts` and threaded through components as the `t` prop. Dark mode follows the user preference in the store.
