# Debug Guide: Token Persistence

## How to Check Console Logs

### Option 1: Native App Debug Panel (Easiest)
1. Open the app
2. Look for the **🐛 Debug** button in the top-right corner
3. Tap it to see real-time debug logs
4. This shows:
   - Token loading from AsyncStorage
   - Token saving from WebView
   - Token injection attempts
   - Current token status

### Option 2: Web Debug Page
1. Navigate to `/debug` in the web app
2. This page shows:
   - WebView detection
   - Token in localStorage
   - Real-time logs of token operations
   - Buttons to manually check/request tokens

### Option 3: Native Console Logs

#### iOS (Xcode):
1. Open Xcode
2. Run the app from Xcode (not just launch it)
3. Open **View > Debug Area > Show Debug Area** (or press Cmd+Shift+Y)
4. Look for logs prefixed with `[Native]`

#### Android (Android Studio):
1. Open Android Studio
2. Connect device or start emulator
3. Run the app from Android Studio
4. Open **View > Tool Windows > Logcat**
5. Filter by tag: `ReactNativeJS`
6. Look for logs prefixed with `[Native]`

#### React Native CLI:
```bash
cd unified-client-app/native
npx react-native log-ios    # For iOS
npx react-native log-android # For Android
```

### Option 4: WebView Console (Safari Web Inspector - iOS only)

#### Enable Web Inspector in iOS:
1. On your iPhone/iPad: Settings > Safari > Advanced > Web Inspector (ON)
2. Connect device to Mac
3. On Mac: Safari > Develop > [Your Device] > [Your App]
4. This opens Safari Web Inspector showing WebView console

#### Or use Chrome DevTools (Android):
1. On Android device: Settings > Developer Options > Enable USB Debugging
2. Connect to computer
3. Open Chrome on computer: `chrome://inspect`
4. Find your app and click "inspect"

## What to Look For

### On Login:
- `[Storage] Token sync message sent to native app`
- `[Native] Received SAVE_TOKEN from WebView`
- `[Native] ✓ Saved token to AsyncStorage`
- `[Native] ✓ Token verified in AsyncStorage`

### On App Reopen:
- `[Native] Starting token load from AsyncStorage...`
- `[Native] ✓ Loaded token from AsyncStorage`
- `[WebView] Token injected BEFORE page load`
- `[Root Page] Token found, redirecting to /home`

### If Still Logging Out:
Check if you see:
- `[Native] ✗ No token in AsyncStorage` → Token not being saved
- `[Native] ✗ Token verification FAILED!` → AsyncStorage issue
- `[Root Page] Max attempts reached, no token found` → Injection not working

## Quick Test Steps

1. **Log in to the app**
2. **Check debug panel** - Should see token saved
3. **Fully close app** (swipe away from background)
4. **Reopen app**
5. **Check debug panel immediately** - Should see token loaded

If token is not there after reopening, the issue is with AsyncStorage persistence or the app is clearing storage on close.

