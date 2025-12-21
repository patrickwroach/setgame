<!-- Copilot instructions for the Set Game repository -->

# Quick orientation (for AI coding agents)

This repository is a Next.js (app router) + Firebase TypeScript project that implements a daily "Set" puzzle with invitation-controlled signups and admin approval. Use this doc to find the high-level architecture, key files, and project-specific patterns so suggestions and patches stay idiomatic and safe.

- Framework: Next.js (app directory). UI: React + Tailwind CSS (v3.4.1). Backend: Firebase Auth + Firestore + Hosting.
- Runtime note: many UI pieces are client components (look for `"use client"`). Server components may be used in pages under `app/`.

## Big-picture architecture

- Frontend: `app/` contains `components/`, `contexts/`, and `lib/` used by the UI.
  - `app/components/SetGame.tsx`, `SetCard.tsx`, and `Timer.tsx` contain core gameplay UI.
  - `app/components/AuthModal.tsx` is the sign-in / sign-up modal and shows how errors and approval messages are surfaced to users.
- Auth & user flow: `app/contexts/AuthContext.tsx` wires Firebase Auth (client) and exposes `signIn`, `signUp`, `signInWithGoogle`, and invite-based sign-up flows. New accounts write a user document and require an admin toggling `approved: true` in Firestore before full access.
- Firebase helpers: `app/lib/firebase.ts` initializes Firebase (note: it uses `memoryLocalCache()` to avoid IndexedDB issues during static exports). Invite & signup logic lives in `app/lib/inviteCode.ts` and references Firestore collections `invite_codes` and `signup_attempts`.

## Important data shapes & Firestore collections (examples)
- `users/{email}`: { email, uid, approved: boolean, createdAt }
- `daily_completions/{userId}`: per-user completion map keyed by `YYYY-MM-DD` (see `app/lib/dailyCompletions.ts`)
- `invite_codes/current` and `signup_attempts/{fingerprint-YYYY-MM-DD}` — used by `inviteCode.ts` for one-hour codes and rate-limiting.

## Key files to inspect when changing behavior
- Auth flows & UI: `app/contexts/AuthContext.tsx`, `app/components/AuthModal.tsx` (error/success text handling is implemented here).
- Firebase init: `app/lib/firebase.ts` (pay attention to memory-only cache and getApps() guard).
- Invite code & rate limits: `app/lib/inviteCode.ts`.
- Game logic & daily puzzle: `app/lib/setLogic.ts`, `app/lib/dailyPuzzle.ts` (Eastern Time behavior and deterministic daily puzzle generation).
- Firestore rules: top-level `firestore.rules` and variants (`.ALLOWLIST`, `.RECOMMENDED`, `.SIMPLE`) — update/deploy when changing collection security.

## Developer workflows (commands & env)
- Local dev: `npm install` then `npm run dev` (Next dev server on port 3000).
- Build for production: `npm run build` then `firebase deploy` (project uses Firebase Hosting + Firestore).
- Deploy only rules: `firebase deploy --only firestore:rules` (useful after changing security rules).
- Env: copy `.env.local.example` → `.env.local` and set all `NEXT_PUBLIC_FIREBASE_*` vars. These are required at runtime for client Firebase.

## Project-specific patterns and gotchas
- Invite-based sign-ups: sign-up requires validation via `validateInviteCode()` (see `app/lib/inviteCode.ts`). That code does browser fingerprint rate-limiting — be conservative when modifying it.
- Admin approval: sign-up creates a user record with `approved: false`. Admins manually set `approved: true` in Firestore. Many UI flows check this, so changing the `approved` flag name or shape will require changes across `AuthContext` and UI messaging.
- Firebase initialization: `app/lib/firebase.ts` intentionally uses `memoryLocalCache()` and a getApps() guard to avoid IndexedDB-related hangs during SSR/static export — preserve this unless you understand Next.js server/client initialization impacts.
- Client components require `"use client"` — keep sensitive server work in server components or API routes.

## When editing or suggesting changes
- Reference the exact files above in suggestions, include the code-level rationale (e.g., why memoryLocalCache was used), and prefer minimal, targeted edits.
- For auth/Firestore changes: include a brief testing checklist — set up `.env.local`, run `npm run dev`, and test sign-up flows including invite-code rejection and admin approval path.

## Example quick tasks (how to verify)
- Add or modify an invite-code rule: update `app/lib/inviteCode.ts`, run locally and test with the Auth modal (`app/components/AuthModal.tsx`). Verify `signup_attempts` increments in Firestore emulator or console.
- Change daily puzzle date logic: edit `app/lib/dailyPuzzle.ts`, restart dev server, and validate date string logic and puzzle determinism.

If anything here is ambiguous or you'd like instructions tailored to a particular task (e.g., modifying Firestore rules, adding telemetry, or running the Firebase emulator), tell me which area to expand and I will iterate.
