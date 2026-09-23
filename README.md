# Pandra

**AI-powered widget studio for iOS and Android.**

Describe what you want in plain language. Pandra builds it as a real home-screen widget, backed by live data — no configuration files, no API docs, no manual setup.

---

## What It Does

You type a prompt. Pandra generates a widget.

- "Bitcoin and Ethereum live price tracker" → a crypto widget pulling live prices
- "Daily water intake counter with 8 glasses goal" → a tap-to-increment counter
- "Production server health checker with ping latency" → a REST API monitor
- "Tokyo weather with temperature and forecast" → a live weather widget

Every widget syncs to your iOS or Android home screen in real time through a native bridge. Widgets are organized into **workspaces** — switch between a work deck, a personal deck, and a travel deck in one tap.

---

## Features

- **AI widget generation** — natural language prompt to fully-formed widget
- **8 widget types** — live weather, REST API fetcher, counter, note, news feed, battery monitor, photo, static metric
- **Native home-screen widgets** — iOS (WidgetKit via expo-widgets) and Android (react-native-android-widget), small and wide variants
- **Workspaces** — multiple widget decks, switch context instantly
- **Draggable grid** — reorder and resize widgets with drag-and-drop
- **Card styles** — glass, solid, gradient, with sparkline patterns and custom colors
- **Cloud sync** — deck state synced to Convex, available across reinstalls
- **Pandra Pro** — monthly, yearly, and lifetime plans via RevenueCat

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo (SDK 57) |
| Navigation | Expo Router |
| UI | Tamagui + Expo UI |
| Animations | React Native Reanimated 4 |
| iOS Widgets | expo-widgets (WidgetKit App Extension) |
| Android Widgets | react-native-android-widget |
| Backend | Convex |
| Auth | Clerk (Google Sign-In) |
| Monetization | RevenueCat |
| State | Zustand |
| Local DB | expo-sqlite |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- For iOS: Xcode 15+ and an Apple developer account
- For Android: Android Studio with SDK 34+

### Installation

```bash
git clone https://github.com/joulessies/pandra.git
cd pandra
npm install
```

### Environment Variables

Copy the example env file and fill in your keys:

```bash
cp .env.example .env
```

Required variables:

```
EXPO_PUBLIC_CONVEX_URL=        # Your Convex deployment URL
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=  # Clerk publishable key
EXPO_PUBLIC_REVENUECAT_IOS_KEY=     # RevenueCat iOS API key
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY= # RevenueCat Android API key
```

### Running Locally

```bash
# Start the dev server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

> **Note:** Home-screen widget functionality requires a native dev build (`expo run:android` or `expo run:ios`). It will not work in Expo Go.

---

## Project Structure

```
pandra/
├── convex/               # Backend — Convex schema and mutations
├── src/
│   ├── app/              # Expo Router screens
│   │   ├── index.tsx     # Main deck screen
│   │   ├── explore.tsx   # Widget studio / builder
│   │   └── (auth)/       # Onboarding and sign-in
│   ├── components/       # UI components and modals
│   ├── services/         # AI synthesizer, API fetcher, native bridge
│   ├── stores/           # Zustand state stores
│   ├── hooks/            # RevenueCat, theme, color scheme hooks
│   ├── types/            # Widget type definitions
│   ├── theme/            # Design tokens
│   └── widgets/          # Android native widget components
├── plugins/              # Custom Expo config plugins
└── assets/               # Icons, splash, widget preview images
```

---

## Building for Production

This project uses EAS Build. See [eas.json](./eas.json) for build profiles.

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production
```

---

## License

MIT — see [LICENSE](./LICENSE) for details.
