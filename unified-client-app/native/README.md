# Badehy Shell App

A React Native shell application that displays the Badehy web application in a full-screen WebView.

## Overview

This is a minimal React Native wrapper that loads and displays the Badehy web application. All functionality is handled by the web app, and this native shell provides:

- Full-screen WebView display
- Mobile-optimized viewport settings
- Loading and error states
- iOS and Android support

## Prerequisites

- Node.js >= 18
- React Native development environment set up
  - iOS: Xcode (for macOS only)
  - Android: Android Studio

## Setup

1. **Install dependencies:**
   ```bash
   cd shell-app
   npm install
   ```

2. **For iOS, install CocoaPods:**
   ```bash
   cd ios
   pod install
   cd ..
   ```

3. **Configure the web app URL:**

   The app will try to load the web app from:
   - Development: `http://localhost:3001` (default)
   - Production: Update in `src/App.tsx` or use environment variables

   **Option 1: Update directly in code**
   
   Edit `src/App.tsx` and modify the `getWebAppUrl()` function:
   ```typescript
   return __DEV__ ? 'http://YOUR_LOCAL_IP:3001' : 'https://your-production-url.com';
   ```

   **Option 2: Use environment variables (iOS)**
   
   Edit `ios/BadehyShell/Info.plist` and add:
   ```xml
   <key>WEB_APP_URL</key>
   <string>https://your-production-url.com</string>
   ```
   
   Then read it in `App.tsx` using `NativeModules` or `react-native-config`.

   **Option 3: Use environment variables (Android)**
   
   Edit `android/app/build.gradle` and add:
   ```gradle
   buildConfigField "String", "WEB_APP_URL", '"https://your-production-url.com"'
   ```

## Running the App

### iOS

```bash
npm run ios
```

Or open `ios/BadehyShell.xcworkspace` in Xcode and run from there.

### Android

```bash
npm run android
```

Make sure you have an Android emulator running or a device connected.

## Development Notes

### Local Development

When running the web app locally (e.g., `npm run dev` in the `frontend` folder), you need to:

1. **Use your local network IP** instead of `localhost` on iOS/Android devices:
   - Find your local IP (e.g., `192.168.1.100`)
   - Update `WEB_APP_URL` to `http://192.168.1.100:3001`

2. **For iOS Simulator**, you can use `localhost` or `127.0.0.1`.

3. **For Android Emulator**, use `10.0.2.2` instead of `localhost` (Android emulator special IP).

### Production Deployment

Before building for production:

1. Update the `WEB_APP_URL` in `src/App.tsx` to your production URL
2. Build the app:
   ```bash
   # iOS
   cd ios && xcodebuild -workspace BadehyShell.xcworkspace -scheme BadehyShell -configuration Release
   
   # Android
   cd android && ./gradlew assembleRelease
   ```

## Features

- **Full-screen WebView**: No native UI, everything is handled by the web app
- **Mobile Optimized**: Viewport meta tags and scaling configured for mobile devices
- **Error Handling**: Displays user-friendly error messages if the web app fails to load
- **Loading States**: Shows a loading indicator while the web app is loading
- **Platform-specific User Agents**: Identifies as mobile device for better web app compatibility

## File Structure

```
shell-app/
├── src/
│   └── App.tsx          # Main WebView component
├── ios/                  # iOS native project
├── android/              # Android native project
├── package.json
├── tsconfig.json
└── README.md
```

## Troubleshooting

### WebView not loading

1. Check if the web app URL is accessible from your device/emulator
2. For local development, ensure both devices are on the same network
3. Check the console logs for any errors

### CORS Issues

If you encounter CORS errors, ensure your web app (Next.js) allows requests from the mobile app. Update `next.config.ts`:

```typescript
headers: async () => [
  {
    source: '/:path*',
    headers: [
      { key: 'Access-Control-Allow-Origin', value: '*' },
    ],
  },
],
```

### iOS Build Issues

- Ensure CocoaPods are installed: `sudo gem install cocoapods`
- Run `pod install` in the `ios` directory
- Clean build folder in Xcode: Product → Clean Build Folder

### Android Build Issues

- Ensure Android SDK is properly installed
- Check `android/local.properties` has correct SDK path
- Run `cd android && ./gradlew clean`

## License

Private - Badehy Platform

