# SiteCommand Mobile

React Native + Expo iOS app for SiteCommand — built for field workers.

## Setup

1. **Install dependencies**
   ```bash
   cd mobile
   npm install
   ```

2. **Configure API URL**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and set EXPO_PUBLIC_API_URL to your deployed SiteCommand URL
   ```

3. **Run on iOS simulator**
   ```bash
   npx expo start --ios
   ```

4. **Run on physical device**
   - Install [Expo Go](https://apps.apple.com/app/expo-go/id982107779) on your iPhone
   - Run `npx expo start` and scan the QR code

## Building for App Store

```bash
npx eas build --platform ios --profile production
```

## Architecture

```
mobile/
├── app/                    # Expo Router file-based navigation
│   ├── (auth)/             # Login & signup screens
│   └── (app)/              # Authenticated app
│       ├── index.tsx       # Projects dashboard
│       ├── my-items.tsx    # My open RFIs & tasks
│       ├── profile.tsx     # Profile & settings
│       └── projects/[id]/  # Per-project screens
│           ├── index.tsx   # Project overview
│           ├── rfis/       # RFI list + detail
│           ├── tasks/      # Task list + detail
│           ├── submittals  # Submittals list
│           ├── daily-log   # Daily log entries
│           ├── budget      # Budget line items
│           ├── photos      # Photo gallery
│           └── directory   # Project contacts
├── components/ui/          # Shared UI primitives
├── context/AuthContext.tsx # Auth state & JWT management
├── lib/api.ts              # API client (calls Next.js backend)
├── lib/storage.ts          # SecureStore helpers
├── types/index.ts          # TypeScript interfaces
└── constants/colors.ts     # Design tokens
```

## Auth Flow

The mobile app calls the same Next.js API as the web app. On login:
1. POST to `/api/auth/login`
2. JWT extracted from `Set-Cookie` response header
3. Token stored in `expo-secure-store`
4. Subsequent requests send `Cookie: token=<jwt>` header

## User Roles

All 5 roles are supported:
- **Site Command Admin** — platform super admin
- **Company Super Admin** — manages subscription & seats
- **Company Admin** — manages users & projects
- **Company Member** — project access only
- **External Collaborator** — project-scoped access (RFIs, submittals they're tagged on)
