# DietBuddy

Calorie tracker for iOS and Android. Log a meal by typing, speaking or photographing it. Claude estimates calories and macros; Supabase stores your data.

Stack: Expo (React Native), Supabase (auth, Postgres with RLS, Edge Function), Claude API (server-side only).

## Run locally

```bash
npm install
cp .env.example .env        # public Supabase URL + publishable key
npx expo start              # typing + photos work in Expo Go
```

Voice input uses on-device speech recognition and needs a development build: `eas build --profile development --platform android` (or ios).

## Backend

- `supabase/migrations/` : schema and row level security (already applied to the `dietbuddy` project).
- `supabase/functions/analyze-meal/` : the only place the Anthropic key is used. Deploy with the Supabase CLI or dashboard.
- Set the key as a secret (never in the app): `supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref xqclhdenulebghjdtacs`
- Optional: `CLAUDE_MODEL` secret (default `claude-sonnet-5-5`; a smaller model costs less).
- Limits per user: 6 analyses/minute and 80/day (`consume_ai_quota`).

## Release checklist

1. Supabase dashboard: Authentication > SMTP: add a real email provider (the built-in sender is limited to a few emails per hour). Set the Site URL and customise the confirmation email.
2. Set `ANTHROPIC_API_KEY` as above.
3. Replace the placeholder icon and splash in `assets/images/` with your own artwork (1024x1024 icon).
4. Host a privacy policy page and put its URL in `EXPO_PUBLIC_PRIVACY_URL` (in `eas.json` env) and in both store listings.
5. `eas build --profile production --platform all`, then `eas submit`.
6. Store listings: describe that meal photos and text are sent to an AI service for analysis (App Store privacy labels and Play Data safety form); calorie values are estimates, not medical advice.
