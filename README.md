<div align="center">

# 💸 ExTracker Mobile

### *Track every coin. Own your finances.*

[![Expo](https://img.shields.io/badge/Expo-~54.0.34-000020?logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?logo=react&logoColor=white)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-~5.9.2-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![expo-router](https://img.shields.io/badge/expo--router-~6.0.23-000020?logo=expo&logoColor=white)](https://expo.github.io/router)
[![License](https://img.shields.io/badge/License-Private-red)](./package.json)

</div>

---

## ✨ Features

- 💰 **Transactions** — add income and expenses with category, wallet, note, and date
- 👛 **Wallets** — multiple wallets, each with its own balance, icon, and color
- 🤝 **Debts & Lending** — track money you owe and money owed to you, with payment history
- 📊 **Budgets** — per-category monthly spending caps with real-time progress
- 🔁 **Recurring** — weekly/monthly repeating transactions with auto-scheduling
- 🏷️ **Categories** — fully customizable income, expense, and subscription categories
- 📅 **Calendar** — monthly heat-map view of daily income and expense activity
- 📈 **Statistics** — 6-month bar chart, category breakdown, and income-vs-expense totals
- 📋 **Reports** — detailed filtered transaction lists and export-ready summaries
- 🔔 **Notifications** — overdue debt alerts, budget warnings, and upcoming bill reminders
- 🌙 **Dark mode** — system-aware, toggleable, themed via `lib/tokens.ts`
- 🍎 **Native iOS Liquid Glass tab bar** — uses `expo-router` unstable-native-tabs on iOS 26+ for Apple's real Liquid Glass material
- 🤖 **Android custom FAB tab bar** — floating curved bar with SVG notch, animated Liquid Glass pill, and ripple-pulse FAB
- 🔐 **Google Sign-In** — one-tap login/signup via `@react-native-google-signin/google-signin`
- 📧 **Email + password auth** — with email-code password reset
- 🌍 **6-language i18n** — English, Uzbek, Russian, German, French, Spanish
- 🔒 **Hide balance** — banking-style toggle to mask all amounts across the app
- ☁️ **Offline-first sync** — optimistic local writes, server sync per data type (wallets, categories, transactions, debts, budgets, recurring, notifications)

---

## 🧱 Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Expo (managed + dev client) | ~54.0.34 |
| UI runtime | React Native | 0.81.5 |
| Language | TypeScript | ~5.9.2 |
| Navigation | expo-router (file-based) | ~6.0.23 |
| State | Custom store with AsyncStorage | — |
| Animations | react-native-reanimated + worklets | ~4.1.1 / 0.5.1 |
| i18n | i18next + react-i18next | ^26.0.7 / ^17.0.4 |
| Auth — Google | @react-native-google-signin/google-signin | ^16.1.2 |
| Auth — OAuth helper | expo-auth-session | ~7.0.11 |
| Secure token storage | expo-secure-store | ~15.0.8 |
| Glass effects | expo-glass-effect | ~0.1.10 |
| Charts / icons | react-native-svg | 15.12.1 |
| Keyboard handling | react-native-keyboard-controller | 1.18.5 |
| Image picking | expo-image-picker | ~17.0.11 |
| Build & delivery | EAS Build / EAS Submit | eas.json |
| Tests | Vitest | ^2.1.8 |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** `>=20`
- **npm** (bundled with Node)
- **Xcode** — required for `npm run ios` and local iOS prebuild
- **Android Studio + SDK** — required for `npm run android` and local Android prebuild
- **EAS CLI** — `npm install -g eas-cli` for cloud builds

### Install

```bash
cd mobile
npm install
```

### Run in Expo Go (quick start — limited native modules)

```bash
npx expo start
```

Scan the QR with the Expo Go app. Note: Google Sign-In will not work in Expo Go — it requires a dev client build.

### Run with dev client (recommended — full native modules)

Build the dev client once (or after adding a new native module):

```bash
npx expo prebuild --clean
npm run ios       # or: npm run android
```

The dev client is required for Google Sign-In, `expo-glass-effect`, `expo-secure-store`, and `expo-navigation-bar`.

---

## ⚙️ Configuration

All runtime config lives in `app.json` under `expo.extra`:

```json
"extra": {
  "apiUrl": "https://expensetracker.ovrin.uz",
  "googleWebClientId": "<WEB_CLIENT_ID>",
  "googleIosClientId": "<IOS_CLIENT_ID>",
  "googleAndroidClientId": "<ANDROID_CLIENT_ID>",
  "eas": { "projectId": "<EAS_PROJECT_ID>" }
}
```

| Key | Description |
|---|---|
| `apiUrl` | Backend base URL. Change to your LAN IP (e.g. `http://192.168.1.10:3000`) for local dev. Read at build time — changes require a new build. |
| `googleWebClientId` | "Web application" type client in Google Cloud Console |
| `googleIosClientId` | "iOS" type client (bundle ID: `com.siqoramil.extracker`) |
| `googleAndroidClientId` | "Android" type client (package + SHA-1). Production builds need the EAS keystore SHA-1 registered — run `eas credentials` to get it. |

---

## 📜 Scripts

| Script | Command | Description |
|---|---|---|
| Start Metro | `npm run start` | Start the Metro bundler (Expo Go) |
| Run iOS | `npm run ios` | `expo run:ios` — requires Xcode + dev client prebuild |
| Run Android | `npm run android` | `expo run:android` — requires Android SDK + dev client prebuild |
| Run Web | `npm run web` | Start with Metro web bundler |
| Test | `npm test` | Run Vitest unit suite once |
| Test watch | `npm run test:watch` | Vitest in interactive watch mode |
| Lint | `npm run lint` | ESLint check |
| Lint fix | `npm run lint:fix` | ESLint auto-fix |
| Format | `npm run format` | Prettier write |
| Format check | `npm run format:check` | Prettier dry-run check |

---

## 📁 Project Structure

```
mobile/
├── app/                          # expo-router file-based routes
│   ├── _layout.tsx               # Root layout (auth gate, sync bootstrap)
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab bar layout (iOS NativeTabs / Android FAB)
│   │   ├── index.tsx             # Home tab
│   │   ├── stats.tsx             # Statistics tab
│   │   ├── debtors.tsx           # Debtors tab
│   │   └── profile.tsx           # Profile tab
│   ├── add.tsx                   # Add transaction sheet
│   ├── all-tx.tsx                # All transactions list
│   ├── budgets.tsx               # Budgets management
│   ├── calendar.tsx              # Calendar heat-map
│   ├── categories.tsx            # Category management
│   ├── currency.tsx              # Currency picker
│   ├── language.tsx              # Language picker
│   ├── notifications.tsx         # Notifications list
│   ├── recurring.tsx             # Recurring transactions
│   ├── reports.tsx               # Reports screen
│   ├── wallets.tsx               # Wallets management
│   ├── debtor/[id].tsx           # Debtor detail
│   └── tx/[id].tsx               # Transaction detail
│
├── components/
│   ├── screens/                  # Full-screen component implementations
│   │   ├── HomeScreen.tsx
│   │   ├── StatsScreen.tsx
│   │   ├── ReportsScreen.tsx
│   │   ├── CalendarScreen.tsx
│   │   ├── AllTxScreen.tsx
│   │   ├── TxDetail.tsx
│   │   ├── WalletsScreen.tsx
│   │   ├── CategoriesScreen.tsx
│   │   ├── BudgetsScreen.tsx
│   │   ├── DebtorsScreen.tsx
│   │   ├── DebtorDetail.tsx
│   │   ├── RecurringScreen.tsx
│   │   ├── NotificationsScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── SettingsSubs.tsx
│   ├── AccountSheets.tsx         # Forgot-password / email-change bottom sheets
│   ├── ActionSheet.tsx           # Generic action sheet
│   ├── AddSheet.tsx              # New transaction bottom sheet
│   ├── AppTextInput.tsx          # Themed text input
│   ├── Glass.tsx                 # Liquid Glass wrapper component
│   ├── Icon.tsx                  # SVG icon set
│   ├── KeyboardAvoider.tsx       # Keyboard-aware wrapper
│   ├── LoginScreen.tsx           # Email/password + Google Sign-In
│   ├── Onboarding.tsx            # First-run onboarding flow
│   ├── ServerUnreachable.tsx     # Network/server-down global UI
│   ├── Sparkline.tsx             # Mini inline chart
│   ├── TabBar.tsx                # Android custom FAB tab bar
│   ├── TabHeader.tsx             # Screen header with tab title
│   ├── TabSafeArea.tsx           # Safe-area wrapper for tab screens
│   └── ui.tsx                   # Shared primitives (Card, TxRow, CatIcon, …)
│
├── lib/
│   ├── api.ts                    # HTTP client, ApiError, setUnauthorizedHandler
│   ├── dataApi.ts                # Typed server endpoints
│   ├── errors.ts                 # Server error code → i18n key mapping
│   ├── format.ts                 # Currency, date, number formatters
│   ├── googleAuth.ts             # Google Sign-In wrapper
│   ├── i18n.ts                   # tStr(lang, key) helper
│   ├── store.ts                  # Global state + actions (AsyncStorage-backed)
│   ├── tokens.ts                 # Light/dark theme tokens
│   ├── toast.ts                  # Toast helper
│   └── locales/                  # Translation files
│       ├── en.json               # English (canonical)
│       ├── uz.json               # Uzbek
│       ├── ru.json               # Russian
│       ├── de.json               # German
│       ├── fr.json               # French
│       └── es.json               # Spanish
│   └── sync/                     # Per-entity optimistic sync modules
│       ├── index.ts
│       ├── types.ts
│       ├── idmap.ts
│       ├── transactions.ts
│       ├── wallets.ts
│       ├── categories.ts
│       ├── budgets.ts
│       ├── debts.ts
│       ├── recurring.ts
│       └── notifications.ts
│
├── assets/                       # Images, icons, splash, fonts
├── app.json                      # Expo config (version, bundle IDs, extra)
├── eas.json                      # EAS Build profiles
├── tsconfig.json
└── package.json
```

---

## 🌍 Internationalization

Translations live in `lib/locales/<lang>.json`. `en.json` is the canonical source — all other files mirror its keys.

| Code | Language |
|---|---|
| `en` | English |
| `uz` | Uzbek |
| `ru` | Russian |
| `de` | German |
| `fr` | French |
| `es` | Spanish |

Use `tStr(lang, key)` from `lib/i18n.ts` for static strings. The active language is stored in `store.get().prefs.lang` (default: `uz`). When adding new user-facing strings, add the key to `en.json` first, then propagate to all other locales.

---

## 🔐 Authentication

| Method | Details |
|---|---|
| Email + password | Registration, login, email-code password reset |
| Google Sign-In | One-tap signup/login via `@react-native-google-signin/google-signin`; native on both platforms |
| Token storage | JWT stored in `expo-secure-store` (Keychain on iOS, EncryptedSharedPreferences on Android) |
| 401 handling | Any `401` response triggers a global logout via `setUnauthorizedHandler` in `lib/api.ts` — never bypassed |
| Google linking | If an email already has a password account, Google sign-in returns `409 account_link_required`. Sign in with password first, then link Google from profile settings. |

---

## 🚢 EAS Builds

`eas.json` defines three build profiles:

| Profile | Distribution | Android output | Notes |
|---|---|---|---|
| `development` | Internal (dev client) | — | Full native module access for local dev |
| `preview` | Internal | APK | Shareable test builds |
| `production` | Store | AAB (auto-incremented version) | Submitted to Play Store internal track |

```bash
eas login
eas build --profile production --platform android
eas build --profile production --platform ios
eas submit --profile production --platform android
```

> **Google Sign-In in production**: the EAS-managed signing keystore has a different SHA-1 from your local keystore. Register it in [Google Cloud Console](https://console.cloud.google.com/apis/credentials) under the Android OAuth client. Get the SHA-1 via `eas credentials`.

---

## 🧪 Testing

Tests run on Node via **Vitest** with module aliases for Expo and React Native packages.

```bash
npm test            # run once
npm run test:watch  # interactive watch mode
```

The suite covers security-sensitive paths in `lib/api.ts` and `lib/store.ts`: auto-logout on 401, Google link flow, email normalization, and server contract expectations. Component-level tests are out of scope and require React Native Testing Library + jsdom.

---

## 🛠️ Troubleshooting

| Symptom | Fix |
|---|---|
| "Cannot reach the server" on production APK | Verify `Constants.expoConfig.extra.apiUrl` was bundled correctly. The API URL is read from `app.json` at build time — changing it requires a new build. |
| Google Sign-In "Error 400: invalid_request" in production | Production keystore SHA-1 not registered in Google Cloud Console. Run `eas credentials` and add it. |
| `account_link_required` after Google sign-in | Email already has a password account. Sign in with password, then link Google from profile. |
| User repeatedly bounced to login | JWT rejected with `401 token_revoked` — password was reset elsewhere. Sign in again. |
| "Old dev client — rebuild required" | A native module was added since the dev client was built. Run `npx expo prebuild --clean && npm run ios` (or `npm run android`). |
| Metro cache issues | Run `npx expo start -c` to clear the cache. |

---

## 🤝 Contributing

1. Branch from `main`.
2. `npx tsc --noEmit` must pass before opening a PR.
3. No `console.log` in committed code.
4. New user-facing strings: add to `lib/locales/en.json` first, then propagate to all six locales.
5. Server error codes are `snake_case` and must be mapped in `lib/errors.ts`.
