# Arel Math Project Memory

Last verified: 2026-09-03

## Repository

- GitHub: https://github.com/turkeryuksel/arel-math
- Remote: `origin`
- Main branch: `main`
- Latest verified commit: `123d11e fix: persist training results and separate practice topics`
- Local branch is synchronized with `origin/main`.
- `.env.local` is ignored and must never be committed.

## Purpose

Arel Deniz için günlük, adaptif ve oyunlaştırılmış matematik antrenmanı. Uygulama 3. ve 4. sınıf seviyelerine göre zihinden matematik, dört işlem, günlük problemler ve beyin jimnastiği çalışmaları üretir.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- Firebase Authentication
- Cloud Firestore
- Cloud Firestore as the sole persistent data source
- Recharts
- Lucide React
- Vitest
- Vercel deployment

## Important Commands

```bash
npm install
npm run dev
npm test
npm run build
npm start
vercel --prod --yes
```

## Main Routes

- `/login`: email/password login
- `/`: dashboard and daily plan
- `/training`: daily training session
- `/mental-math`: independent mental math practice
- `/operations`: independent four-operation practice
- `/problems`: themed word-problem practice
- `/brain`: independent logic practice
- `/stats`: development and statistics
- `/badges`: badges
- `/parent`: admin/parent management panel
- `/admin`: admin route

## Source Layout

- `src/app/`: pages and route entry points
- `src/components/dashboard/`: dashboard widgets
- `src/components/layout/`: shell, navigation and auth guard
- `src/components/training/`: question card, keypad, completion and solution popups
- `src/lib/questions/`: question generators and shared question engine
- `src/lib/daily-session/`: deterministic daily session generation
- `src/lib/firebase/`: Firebase client, auth and storage provider
- `src/lib/adaptive/`: XP, difficulty, streak and badge logic
- `src/lib/analytics.ts`: shared real-data analytics calculations
- `src/data/`: static question and badge data
- `src/test/`: Vitest tests

## Question Generation

- `mentalMath.ts`: 20 mental calculation patterns with strategy-specific titles.
- `operations.ts`: addition, subtraction, multiplication and division.
- `wordProblems.ts`: themed Turkish word-problem templates.
- `logic.ts`: pyramids, missing numbers, sequences, comparisons and chains.
- `multiplicationTable.ts`: multiplication table practice.
- `engine.ts`: category selection, seeded generation and recent-signature filtering.

Problem themes are filtered by template groups in `wordProblems.ts`:

- Yuzme ve Spor
- Kitap ve Kutuphane
- Lego ve Oyuncaklar
- Cikartma Koleksiyonu
- Kirtasiye ve Okul
- Kumbaram ve Harlik

Use Turkish UI labels in the application; the list above is written without Turkish diacritics only where ASCII documentation is useful.

## Daily vs Extra Practice

- Daily plan links use `mode=daily` and read the deterministic cached daily session.
- Independent category links create a fresh practice session with a new seed.
- Daily and extra practice do not overwrite each other's session state.
- Recent signatures are used to avoid repeated questions during a practice run.
- The daily session seed is based on profile id and Istanbul date, so refreshing the daily page preserves that day's questions.

## Data Flow

- `AppStorage` reads and writes profile, session, attempt and custom-question data in Firestore.
- Legacy browser-local Arel data is merged into Firestore once after a successful login, then removed only after the remote write succeeds.
- Profiles are stored at `users/{profileId}`.
- Daily sessions are stored at `users/{profileId}/dailySessions/{date}`.
- Attempts are stored at `users/{profileId}/attempts/{attemptId}`.
- On Firebase login, `AuthProvider` hydrates the profile, daily sessions, attempts and custom questions from Firestore before protected screens render.
- Dashboard and statistics re-read data after auth profile hydration.
- Every recorded answer updates XP, session counts, skill statistics and attempt history.

## Firebase Configuration

Expected public environment variables are documented in `.env.example`:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_APP_TIMEZONE`

Firebase web config values are public client configuration, but credentials and private tokens must not be placed in this file.

## Roles and Rules

- Admin email is defined in `src/lib/firebase/config.ts`.
- Arel email is defined in the same file.
- Firestore rules are in `firestore.rules`.
- The client UI role must not be treated as a replacement for Firestore rules; Firestore remains the server-side authorization boundary.

## Fresh Start

- `FRESH_START_MIGRATION_KEY` is currently `arel_math_fresh_start_v2`.
- The one-time migration resets Arel's profile to zero XP, level 1, zero streak, zero completed sessions and no badges.
- It removes all cached daily sessions and local attempts for the fresh start.
- The migration preserves other student profiles in the local student list.
- Manual reset behavior is available from the parent panel.

## Analytics

- Dashboard growth summary, weekly calendar and `/stats` use `src/lib/analytics.ts`.
- Analytics are calculated from real attempts and completed daily sessions for the last seven days.
- Topic accuracy is calculated from the attempt `skill` field.
- Weekly target is `profile.targetMinutes * 7`.
- No hard-coded demo metrics should be reintroduced.

## UI Behavior

- Completion and solution-review popups have visible close controls.
- Escape and backdrop clicks close the relevant popup where supported.
- Training can be exited through `Vazgec ve Cik`.
- Numeric keypad and large touch targets are important because the primary device is a tablet.

## Deployment

- Vercel project: `taximact/arel-math`
- Production alias: https://arel-math.vercel.app
- Firebase deployment files: `firebase.json`, `firestore.rules`, `firestore.indexes.json`
- Latest verified production deployment was ready after commit `123d11e`.

## Verification Checklist

1. Run `npm test`.
2. Run `npm run build`.
3. Check `git diff --check`.
4. Commit focused changes to `main`.
5. Push with `git push origin main`.
6. Deploy with `vercel --prod --yes`.
7. Verify the production URL returns HTTP 200.

## Known Maintenance Notes

- Keep `PROJECT_MEMORY.md` and this file consistent if architecture or authentication behavior changes.
- Do not reintroduce the old PIN-based parent access model.
- When changing daily target minutes, invalidate the cached current-day session so its estimated duration is regenerated.
- When adding a new question theme, update both the UI theme list and the generator's theme range map.
- When changing Firestore paths, update `firestore.rules` and verify both read and write paths.
