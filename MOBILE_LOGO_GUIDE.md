# Mobile App Logo Change Guide

## Overview

The mobile app logo appears in multiple screens and can be changed easily. The logo system supports both **local files** and **remote URLs**.

## Logo Locations

The logo appears in the following screens:

1. ✅ **Login Screen** (`mobile/app/login.tsx`)
2. ✅ **Set Password Screen** (`mobile/app/set-password.tsx`)
3. ✅ **Program Screen** (`mobile/app/program.tsx`)

## Method 1: Replace Local Logo File (Recommended)

### Quick Steps:

1. **Prepare your logo image:**
   - Format: PNG (with transparent background recommended)
   - Recommended size: 280×80 pixels (or maintain 3.5:1 aspect ratio)
   - Name it: `logo.png`

2. **Replace the file:**
   ```bash
   # Navigate to mobile assets folder
   cd /Users/ahmed.hossam/Documents/Badehy-V1/mobile/assets
   
   # Backup the old logo (optional)
   mv logo.png logo-old.png
   
   # Copy your new logo
   cp /path/to/your/logo.png ./logo.png
   ```

3. **Clear cache and restart:**
   ```bash
   # In the mobile directory
   cd /Users/ahmed.hossam/Documents/Badehy-V1/mobile
   
   # Clear Expo cache
   npx expo start -c
   ```

### File Location:
```
/Users/ahmed.hossam/Documents/Badehy-V1/mobile/assets/logo.png
```

### Sizes Used:

**Login & Set Password Screens:**
- Width: 280px
- Height: 80px
- Resize Mode: contain (maintains aspect ratio)

**Program Screen (Home/Header):**
- Width: 140px
- Height: 36px
- Resize Mode: contain (maintains aspect ratio)

## Method 2: Use Remote Logo URL

If you want to load the logo from a URL (hosted image), you can use environment variables.

### Steps:

1. **Create/Edit `.env` file:**
   ```bash
   cd /Users/ahmed.hossam/Documents/Badehy-V1/mobile
   nano .env
   ```

2. **Add logo URL:**
   ```env
   EXPO_PUBLIC_LOGO_URL=https://your-domain.com/logo.png
   ```

3. **Save and restart:**
   ```bash
   # Restart Expo
   npx expo start -c
   ```

### How It Works:

The app checks for `EXPO_PUBLIC_LOGO_URL` environment variable:
- If URL exists → Loads logo from URL
- If URL doesn't exist → Uses local `assets/logo.png`

## Code Implementation

### Login Screen (`mobile/app/login.tsx`)

```typescript:14-16
const remoteLogo = process.env.EXPO_PUBLIC_LOGO_URL;
const logoSource: any = remoteLogo ? { uri: remoteLogo } : require('../assets/logo.png');
```

```typescript:108
<Image source={logoSource} style={styles.logo} resizeMode="contain" />
```

```typescript:155
logo: { width: 280, height: 80, marginBottom: 8 },
```

### Set Password Screen (`mobile/app/set-password.tsx`)

```typescript:15-16
const remoteLogo = process.env.EXPO_PUBLIC_LOGO_URL;
const logoSource: any = remoteLogo ? { uri: remoteLogo } : require('../assets/logo.png');
```

```typescript:105
<Image source={logoSource} style={styles.logo} resizeMode="contain" />
```

```typescript:146
logo: { width: 280, height: 80, marginBottom: 8 },
```

### Program Screen (`mobile/app/program.tsx`)

```typescript:13-14
const remoteLogo = process.env.EXPO_PUBLIC_LOGO_URL;
const logoSource: any = remoteLogo ? { uri: remoteLogo } : require('../assets/logo.png');
```

```typescript:55
<Image source={logoSource} style={styles.headerLogo} resizeMode="contain" />
```

```typescript:105
headerLogo: { width: 140, height: 36 },
```

## Customization Options

### Change Logo Size

**For Login & Set Password Screens:**

Edit the `logo` style in `styles`:

```typescript
// Current size
logo: { width: 280, height: 80, marginBottom: 8 },

// Custom size example
logo: { width: 320, height: 90, marginBottom: 8 },
```

**For Program Screen (Header):**

Edit the `headerLogo` style:

```typescript
// Current size
headerLogo: { width: 140, height: 36 },

// Custom size example
headerLogo: { width: 160, height: 40 },
```

### Change Logo Position

**Login & Set Password:**

The logo is in the `headerArea` container:

```typescript
headerArea: { 
  paddingHorizontal: 16, 
  paddingTop: 48, 
  paddingBottom: 16, 
  alignItems: 'center'  // Change to 'flex-start' for left align
}
```

**Program Screen:**

The logo is in the header with absolute positioning.

## Image Format Recommendations

### Best Practices:

1. **Format**: PNG with transparent background
2. **Resolution**: 2x or 3x for retina displays
   - @2x: 560×160 pixels
   - @3x: 840×240 pixels
3. **File Size**: Keep under 100KB
4. **Color Mode**: RGB (not CMYK)
5. **Aspect Ratio**: 3.5:1 (width:height)

### File Naming (for multiple resolutions):

If you want to support multiple resolutions:

```
mobile/assets/
  ├── logo.png        (1x - 280×80)
  ├── logo@2x.png     (2x - 560×160)
  └── logo@3x.png     (3x - 840×240)
```

React Native automatically picks the right resolution.

## Add Logo to More Screens

If you want to add the logo to other screens:

### Example: Add to Profile Screen

1. **Import Image component:**
   ```typescript
   import { Image } from 'react-native';
   ```

2. **Add logo source:**
   ```typescript
   const remoteLogo = process.env.EXPO_PUBLIC_LOGO_URL;
   const logoSource: any = remoteLogo ? { uri: remoteLogo } : require('../assets/logo.png');
   ```

3. **Add Image in JSX:**
   ```typescript
   <Image source={logoSource} style={styles.logo} resizeMode="contain" />
   ```

4. **Add style:**
   ```typescript
   logo: { 
     width: 280, 
     height: 80, 
     marginBottom: 8 
   },
   ```

## Troubleshooting

### Logo Not Updating After Replacing File

**Solution:**
```bash
# Clear Expo cache
cd mobile
npx expo start -c

# Or clear React Native cache
watchman watch-del-all
rm -rf node_modules
npm install
npx expo start -c
```

### Logo Looks Blurry

**Causes:**
- Image resolution too low
- Image being stretched

**Solutions:**
1. Use higher resolution image (2x or 3x)
2. Adjust `resizeMode`:
   - `contain` - fits entire image (default, recommended)
   - `cover` - fills entire space (may crop)
   - `center` - centers image without scaling

### Logo Not Loading from URL

**Check:**
1. ✅ URL is correct and accessible
2. ✅ Image format is supported (PNG, JPG, WebP)
3. ✅ CORS is enabled on the server
4. ✅ Environment variable is set correctly

**Test URL:**
```bash
curl -I https://your-domain.com/logo.png
```

### Logo Position is Wrong

**Adjust container styles:**

For centering:
```typescript
headerArea: { 
  alignItems: 'center',
  justifyContent: 'center'
}
```

For left alignment:
```typescript
headerArea: { 
  alignItems: 'flex-start'
}
```

For right alignment:
```typescript
headerArea: { 
  alignItems: 'flex-end'
}
```

## Quick Reference

### Files to Edit:

| Screen | File Path | Line Numbers |
|--------|-----------|--------------|
| Login | `mobile/app/login.tsx` | 14-15 (source), 108 (component), 155 (style) |
| Set Password | `mobile/app/set-password.tsx` | 15-16 (source), 105 (component), 146 (style) |
| Program/Home | `mobile/app/program.tsx` | 13-14 (source), 55 (component), 105 (style) |

### Logo File Location:
```
mobile/assets/logo.png
```

### Environment Variable:
```env
EXPO_PUBLIC_LOGO_URL=https://your-domain.com/logo.png
```

## Example: Complete Logo Change

### Scenario: Replace with company logo

1. **Save your logo as `logo.png`** (280×80 pixels)

2. **Replace the file:**
   ```bash
   cp ~/Downloads/my-company-logo.png \
      /Users/ahmed.hossam/Documents/Badehy-V1/mobile/assets/logo.png
   ```

3. **Clear cache and restart:**
   ```bash
   cd /Users/ahmed.hossam/Documents/Badehy-V1/mobile
   npx expo start -c
   ```

4. **Done!** Logo will appear in:
   - Login screen
   - Set Password screen
   - Program screen header

## Dashboard Logo

**Note:** The dashboard (web frontend) has a separate logo configuration.

**Dashboard Logo Location:**
```
frontend/public/logo.svg
```

To change the dashboard logo, replace the SVG file in the `public` folder.

---

**Last Updated**: October 21, 2025
**Mobile App Version**: 1.0

