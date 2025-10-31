# Unified Client App

This folder contains both the web app and the native shell wrapper in one place.

## Structure

```
unified-client-app/
├── web/           # Next.js web app (the actual app with all features)
└── native/        # React Native shell (WebView wrapper for iOS/Android)
```

## Quick Start

### 1. Start the Web App
```bash
cd web
npm install
npm run dev
```
Runs on `http://localhost:3002`

### 2. Start the Native Shell (iOS/Android)
```bash
cd native
npm install

# For iOS
cd ios && pod install && cd ..
npm run ios

# For Android
npm run android
```

The native app will automatically load the web app from `http://localhost:3002`

## How It Works

- **web/** = The actual client application (all features, pages, logic)
- **native/** = Empty shell that displays the web app in a WebView

The native app just wraps the web app for App Store/Play Store distribution.

