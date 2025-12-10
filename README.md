# Set Game

A daily puzzle game based on the card game Set. Built with Next.js, React, and Firebase.

## Features

- 🎴 Daily puzzle with exactly 4 valid sets (same for everyone each day)
- 🎯 Interactive card selection with visual feedback
- ⏱️ Timer tracking to tenths of a second
- 🔐 Required authentication (Google or Email/Password)
- 📊 Completion tracking per user per day
- 💡 "Show All Sets" feature (marks puzzle as incomplete)
- 🌍 Eastern Time zone for daily puzzle rotation
- 📱 Modern, responsive UI with Tailwind CSS
- ☁️ Deployed on Firebase Hosting (FREE!)

## Live Demo

🌐 **[Play the game here!](https://setsetset-15c23.web.app)**

## Quick Start (Local Development)

1. **Clone and install:**
```bash
git clone <your-repo-url>
cd set
npm install
```

2. **Set up Firebase credentials:**
```bash
cp .env.local.example .env.local
# Edit .env.local with your Firebase credentials
```

3. **Run development server:**
```bash
npm run dev
```

4. **Open [http://localhost:3000](http://localhost:3000)**

---

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** (Email/Password and Google)
4. Create **Firestore Database** (production mode)
5. Copy your Firebase config

### 2. Configure Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Deploy Firestore Rules

The project includes `firestore.rules`. Deploy them:

```bash
firebase deploy --only firestore:rules
```

**Current rules allow:**
- Anyone can read `users` collection (to check approval)
- Authenticated users can create their own user record
- Users can only read/write their own `daily_completions`

### 4. Deploy to Firebase Hosting

**First time:**
```bash
npm install -g firebase-tools
firebase login
firebase init
# Select: Firestore, Hosting
# Build directory: out
# Single-page app: Yes
```

**Every deployment:**
```bash
npm run build
firebase deploy
```

---

## How to Play

1. **Sign in** - Authentication required to play
2. **Select 3 cards** - Click cards to select them
3. **Find all 4 sets** - Timer tracks your completion time
4. **Daily puzzle** - Same puzzle for everyone each day (Eastern Time)
5. **Show All Sets** - If you click this, puzzle is marked as incomplete
6. **Completion tracking** - Your times are saved per day

## Game Rules

Each card has 4 attributes:
- **Number**: 1, 2, or 3 shapes
- **Shape**: Diamond, Oval, or Squiggle
- **Color**: Red, Green, or Purple
- **Shading**: Solid, Striped, or Empty

**A valid set** requires that for each of the 4 attributes, the values are either:
- All the same across the 3 cards, OR
- All different across the 3 cards

---

## Tech Stack

- **Framework:** Next.js 15.5.7
- **UI Library:** React 19.2.1
- **Styling:** Tailwind CSS
- **Backend:** Firebase
  - Authentication (Email/Password, Google)
  - Firestore Database
  - Hosting
- **Language:** TypeScript

---

## Project Structure

```
set/
├── app/
│   ├── components/
│   │   ├── AuthModal.tsx     # Sign in/sign up modal
│   │   ├── SetCard.tsx       # Individual card component
│   │   ├── SetGame.tsx       # Main game logic
│   │   └── Timer.tsx         # Timer component
│   ├── contexts/
│   │   └── AuthContext.tsx   # Firebase auth + user management
│   ├── lib/
│   │   ├── firebase.ts       # Firebase initialization
│   │   ├── setLogic.ts       # Game logic & algorithms
│   │   ├── dailyPuzzle.ts    # Daily puzzle generation (Eastern Time)
│   │   ├── dailyCompletions.ts  # Completion tracking
│   │   └── users.ts          # User management
│   ├── layout.tsx
│   └── page.tsx
├── .env.local                # Firebase credentials (not in git)
├── firestore.rules           # Firestore security rules
├── firebase.json             # Firebase config
└── package.json
```

---

## User Management

### How Authentication Works

1. **Sign Up** - User creates account (Email/Password or Google)
2. **Pending Approval** - User record created in Firestore with `approved: false`
3. **Admin Approval** - You manually set `approved: true` in Firebase Console
4. **Sign In** - User can now sign in and play

### Approving New Users

**View pending users:**
1. Go to Firebase Console → Firestore → `users` collection
2. Look for users with `approved: false`

**Approve a user:**
1. Click on the user's document (email address)
2. Click "Edit field" on the `approved` field
3. Change `false` to `true`
4. Click "Update"
5. User can now sign in and play

**Disable a user:**
1. Find user in `users` collection
2. Set `approved: false`
3. User will be signed out on next auth check

**User data structure:**
```javascript
users/{email}
  - email: string
  - uid: string (Firebase Auth UID)
  - approved: boolean
  - createdAt: timestamp
```

### Completion Tracking

**View completions:**
- Firebase Console → Firestore → `daily_completions` collection

**Completion data structure:**
```javascript
daily_completions/{userId}
  - userId: string
  - completions: {
      "YYYY-MM-DD": {
        date: string
        completionTime: number (seconds with decimal)
        completed: boolean (false if showed all sets)
        showedAllSets: boolean
      }
    }
```

---

## Development Commands

```bash
npm run dev          # Run development server
npm run build        # Build for production
npm run lint         # Lint code
firebase deploy      # Deploy to Firebase
```

## Troubleshooting

**"Permission denied" errors:**
- Check Firestore rules are deployed: `firebase deploy --only firestore:rules`
- Verify user is authenticated

**Google sign-in flashing:**
- Fixed with race condition handling in AuthContext
- User record created before auth state processes

**Daily puzzle not changing:**
- Puzzle changes at midnight Eastern Time
- Check `getTodayDateString()` in `dailyPuzzle.ts`

**User can't sign in:**
- Check user exists in `users` collection with `approved: true`
- Check Firebase Authentication is enabled

---

## License

MIT License
