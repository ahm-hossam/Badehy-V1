# Quick Start Guide

## Initial Setup

1. **Install dependencies:**
   ```bash
   cd shell-app
   npm install
   ```

2. **Setup iOS CocoaPods:**
   ```bash
   cd ios
   pod install
   cd ..
   ```

3. **Configure Web App URL:**
   
   Edit `src/App.tsx` and update the `getWebAppUrl()` function:
   
   ```typescript
   return __DEV__ ? 'http://YOUR_LOCAL_IP:3001' : 'https://your-production-url.com';
   ```
   
   Replace `YOUR_LOCAL_IP` with your computer's local network IP address (e.g., `192.168.1.100`).
   
   For iOS Simulator, you can use `localhost`.
   For Android Emulator, use `10.0.2.2` instead of `localhost`.

## Running the App

### iOS
```bash
npm run ios
```

### Android
```bash
# Make sure Android emulator is running
npm run android
```

## Development Tips

- **Finding your local IP:**
  - macOS/Linux: `ifconfig | grep "inet " | grep -v 127.0.0.1`
  - Windows: `ipconfig | findstr IPv4`

- **Testing with local web app:**
  1. Start your Next.js frontend: `cd frontend && npm run dev`
  2. Note the local IP and port (e.g., `http://192.168.1.100:3001`)
  3. Update `WEB_APP_URL` in `src/App.tsx`
  4. Run the shell app

- **Production build:**
  - Update `WEB_APP_URL` to your production URL
  - Build using standard React Native build commands

## Troubleshooting

- **WebView not loading:** Check that both devices are on the same network
- **iOS build fails:** Run `cd ios && pod install` again
- **Android build fails:** Check that Android SDK is properly configured

