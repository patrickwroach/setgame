# Simple Authentication System

## Overview
Clean, minimal authentication with manual approval workflow.

## How It Works

### Sign Up
1. User signs up with email/password or Google
2. Firestore record created with `approved: false`
3. User immediately signed out
4. Shows "Wait for approval" message

### Sign In
1. User signs in with email/password or Google
2. System checks Firestore for `approved: true`
3. If approved → user can access app
4. If not approved → signed out automatically

### Manual Approval
1. Go to Firebase Console → Firestore
2. Find user in `users` collection
3. Set `approved: true`
4. User can now sign in

## Files Created

- `app/contexts/AuthContext.SIMPLE.tsx` - Clean auth logic
- `app/components/AuthModal.SIMPLE.tsx` - Sign in/up modal
- `firestore.rules.SIMPLE` - Secure rules

## To Apply

```bash
# Replace current files
cp app/contexts/AuthContext.SIMPLE.tsx app/contexts/AuthContext.tsx
cp app/components/AuthModal.SIMPLE.tsx app/components/AuthModal.tsx  
cp firestore.rules.SIMPLE firestore.rules

# Deploy
firebase deploy --only firestore:rules
npm run build
firebase deploy --only hosting
```

## Security Features

✅ Users can only create their own records
✅ Users can't approve themselves
✅ Users can't modify uid or approval status
✅ Unapproved users auto-signed out
✅ Input sanitization for display names
✅ Email enumeration prevention

## What's Different from Before

- **Removed**: Complex logging, timeouts, audit system
- **Kept**: Memory cache (fixes static export issue)
- **Simplified**: One auth flow, clear error messages
- **Added**: Proper sign-in after approval
