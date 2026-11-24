# DietBuddy

A calorie and macro tracker for iOS and Android. Log a meal by **typing it, saying it, or photographing it**. Claude estimates the calories, protein, carbs and fat, and you decide whether to add it to your day.

Built with Expo (React Native), Supabase and the Claude API.

## Features

- **Three ways to log a meal**
  - Type it: "2 rotis, dal and a bowl of rice"
  - Say it: on-device speech recognition, English or Hindi
  - Photograph it: the photo is resized on the phone before it is sent
- **Review before saving.** Every AI estimate shows calories, macros, a confidence level and a short note. Tap *Add* or *Discard*.
- **Personal targets.** Onboarding asks for goal (cutting, maintain, bulking), sex, age, height, weight and activity, then computes daily calories and macros (Mifflin-St Jeor, with a safety floor).
- **Home.** Today's calories and macros against your targets, plus today's meals.
- **Log.** Day-by-day diary with previous/next day, pull to refresh and delete.
- **History.** 14-day calorie chart with your target line, daily average, and a tap-through to any day.
- **Accounts.** Email and password or Google sign-in, data synced across devices, in-app account deletion.
- **Light and dark theme.**

## How it works

```
 Phone (Expo app)
   |  text / voice transcript / resized photo
   v
 Supabase Edge Function  analyze-meal       <-- ANTHROPIC_API_KEY lives only here
   |  checks the user's JWT, applies a per-user quota
   v
 Claude API  (forced tool call -> strict JSON)
   |
   v
 App shows the estimate  -->  user taps Add  -->  Supabase Postgres (meal_logs, RLS)
```

The app never holds an AI key. It only has the public Supabase URL and publishable key, and row level security keeps every user's data private.

Voice notes are turned into text on the device (iOS Speech / Android SpeechRecognizer), and that text is what Claude receives. Claude does not take raw audio.

## Tech stack

| Area | Choice |
| --- | --- |
| App | Expo SDK 54, React Native 0.81, React 19 |
| Navigation | React Navigation (bottom tabs) |
| State | Zustand |
| Backend | Supabase: Auth, Postgres with RLS, Edge Functions (Deno) |
| AI | Claude via the Anthropic Messages API (tool use for structured output) |
| Voice | `expo-speech-recognition` |
| Photos | `expo-image-picker`, `expo-image-manipulator` |
| Builds | EAS Build and EAS Submit |

## Project structure

```
App.js                       App entry: fonts, error boundary
src/
  navigation/AppNavigator.js Boot, auth and onboarding gates, tab bar
  screens/                   Auth, Onboarding, Home, Log, Add, History, Profile
  components/                BodyForm, MealRow, shared UI (Button, Card, Field, ...)
  services/                  meals.js (queries + AI call), profile.js (profile + account deletion)
  store/useStore.js          Session, profile, theme, today's meals
  lib/                       supabase client, calorie targets, dates, dialogs
  utils/theme.js             Colors, typography, spacing
supabase/
  migrations/                Database schema and policies
  functions/analyze-meal/    Edge Function that calls Claude
eas.json                     EAS build profiles
vercel.json                  Config for the optional web preview
```

## Getting started

Requirements: Node 20+, a phone with Expo Go (or an emulator).

```bash
git clone https://github.com/Manasdangi/DietBuddy-Frontend.git
cd DietBuddy-Frontend
npm install
cp .env.example .env
npx expo start
```

Scan the QR code with Expo Go. In Expo Go, typing and photos work. Voice input needs a development build (below). AI analysis needs the backend key from the next section.

### Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | `.env`, `eas.json` | Supabase project URL (public) |
| `EXPO_PUBLIC_SUPABASE_KEY` | `.env`, `eas.json` | Supabase publishable key (public, protected by RLS) |
| `EXPO_PUBLIC_PRIVACY_URL` | `.env`, `eas.json` | Optional. Shows a Privacy policy row on the Profile screen |
| `ANTHROPIC_API_KEY` | Supabase secret | **Server only.** Never put this in the app |
| `CLAUDE_MODEL` | Supabase secret | Optional. Defaults to `claude-sonnet-5-5` |

### Development build (for voice input)

```bash
npm install -g eas-cli
eas login
eas build --profile development --platform android   # or ios
```

## Backend setup

The schema and the Edge Function are in `supabase/`. To use your own Supabase project:

1. Create a project and run `supabase/migrations/20261124_initial_schema.sql` (SQL editor or `supabase db push`).
2. Deploy the function: `supabase functions deploy analyze-meal --project-ref <ref>`. JWT verification must stay on.
3. Set the AI key: `supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref <ref>`.
4. Put the project URL and publishable key into `.env` and `eas.json`.
5. Google sign-in (optional but enabled in the app):
   - Google Cloud Console > APIs and Services > Credentials > Create OAuth client ID, type **Web application**. Add `https://<ref>.supabase.co/auth/v1/callback` as an authorized redirect URI.
   - Supabase > Authentication > Providers > Google: paste the client ID and secret and enable it.
   - Supabase > Authentication > URL Configuration: add `dietbuddy://**` to Redirect URLs (and `exp://**` while testing in Expo Go, plus your web URL if you host the web preview).
   - App Store note: Apple expects apps that offer Google sign-in to also offer Sign in with Apple (guideline 4.8). Add it before submitting to iOS.
6. Authentication > SMTP: connect a real email provider. The built-in sender allows only a few emails per hour, so sign-up confirmation emails will not reach most users.

### Data model

- `profiles`: one row per user with goal, body details and daily targets.
- `meal_logs`: one row per saved meal (name, calories, protein, carbs, fat, confidence, note, source, time).
- `ai_calls`: server-only log used for rate limiting.

Both user tables have row level security: a user can only read and write their own rows. `consume_ai_quota()` allows 6 analyses per minute and 80 per day per user. `delete_my_account()` removes the user and, by cascade, all their data.

## Release

1. Replace the placeholder icon and splash in `assets/images/` with your own artwork (1024x1024 icon).
2. Host a privacy policy and set `EXPO_PUBLIC_PRIVACY_URL`. Both stores require the URL in the listing.
3. Check the bundle id (`com.manasraj.dietbuddy`) in `app.json`.
4. Build and submit:
   ```bash
   eas build --profile production --platform all
   eas submit --platform all
   ```
5. In the store listings, disclose that meal text and photos are sent to an AI service for analysis (App Store privacy labels, Play Data safety form). State that calorie values are estimates, not medical advice.

## Web preview (testing only)

`npx expo export --platform web` builds a web version, and `vercel.json` is set up to host it. It is meant for quick checks on a phone browser. Voice input is not available on the web.

## Security notes

- The AI key stays in Supabase secrets and is only read by the Edge Function.
- The Edge Function requires a signed-in user, validates input size and type (photos up to about 4.8 MB, text up to 1,000 characters), and treats the meal text as data, not instructions.
- Photos are used for the analysis only. They are not stored.
- Database writes are limited by constraints (for example calories 0 to 10,000) and RLS.

## Known limitations and next steps

- No password reset yet. It needs the Supabase email templates and redirect URL to be configured first.
- No editing of a saved meal (delete and re-add).
- Estimates come from a model, so portions and hidden ingredients can be off. The confidence level and note are shown for that reason.
- Ideas: Sign in with Apple (needed for iOS review alongside Google), saved favourite meals, weight tracking, reminders, barcode scan.

## Disclaimer

DietBuddy gives rough nutrition estimates for general use. It is not medical advice. Talk to a doctor or dietitian before making big changes to your diet.
