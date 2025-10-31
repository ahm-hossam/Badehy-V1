# Client Web App

A Next.js web application for clients/trainees, designed to match the mobile app experience exactly.

## Setup

1. **Install dependencies:**
   ```bash
   cd client-webapp
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```
   
   The app will run on `http://localhost:3002`

## Features

- ✅ Login with email/password
- ✅ Set password (first login)
- ✅ Home/Dashboard
- ✅ Workout programs
- ✅ Nutrition/Meals
- ✅ Messages/Chat
- ✅ Profile

## Configuration

The app uses the backend API at `http://localhost:4000` (configured in `next.config.ts`).

Set environment variables in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_LOGO_URL=https://your-logo-url.com/logo.png
```

## Development Notes

- Design matches the mobile app exactly
- Uses same backend API endpoints as mobile app
- Token storage uses localStorage (web equivalent of AsyncStorage)
- Bottom navigation tabs match mobile app tabs

## Integration with Shell App

The shell app (React Native WebView wrapper) loads this web app at `http://localhost:3002`.

For production, update the URL in `shell-app/src/App.tsx` to your deployed client web app URL.

