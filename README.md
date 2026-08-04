# TumaCV

Tailored CV + cover letters for Kenyan job seekers — accounts, credits, tiers,
M-Pesa/Airtel/card payments, a dashboard with gamification, a jobs board,
an AI-written industry news section, and an admin panel.

## Setup

1. **Supabase**: create a project → SQL Editor → paste `supabase-schema.sql` → Run.
   Copy Project URL, anon key, service_role key into your env vars.
2. **Gemini**: get a free key at aistudio.google.com.
3. **IntaSend**: sandbox.intasend.com for testing; payment.intasend.com once KYC'd.
4. **Resend + Supabase SMTP**: for real confirmation emails (see below).
5. Deploy on Vercel, add all variables from `.env.example`, deploy.
6. Make yourself an admin: Supabase SQL Editor →
   `update public.profiles set is_admin = true where email = 'you@example.com';`

## Email verification

Supabase's built-in email sender has a tight rate limit meant for development.
Before turning on "Confirm email" in Authentication settings, connect Resend
(free, 3,000/month) as custom SMTP in Supabase → Project Settings → Authentication
→ SMTP Settings. Then install the branded templates from `email-templates/`
into Supabase → Authentication → Emails.

## Privacy fix (important context for future edits)

Profile drafts are stored in the browser scoped **per account** via
`lib/storage.js` (`tumacv-profile-<user-id>`), not a single shared key. This
was a real bug fixed after a report: a second account created on the same
browser was seeing the first account's saved CV. Never reintroduce a shared
unscoped localStorage key for profile data — always go through
`getSavedProfile(userId)` / `setSavedProfile(userId, text)`.

## Where things live

```
lib/plans.js                     Pricing (edit here only)
lib/storage.js                   Per-account localStorage — the privacy fix
lib/gemini.js                    Shared AI caller with model-fallback
lib/gamification.js              Badges + industries list
app/page.js                      Generator (homepage)
app/onboarding/page.js           First-run onboarding AND "Edit profile" (dual purpose)
app/dashboard/page.js            Credits, streak, badges, insight, history
app/admin/page.js                Admin panel (Overview/Users/Jobs/Payments/Articles)
app/api/generate/route.js        Gemini + credits + streak tracking
app/api/cron/generate-articles   Daily AI news articles (2/day, random industry)
supabase-schema.sql              Fresh-install schema (final state)
supabase-migration-v4..v7.sql    Incremental migrations, run in order on an existing DB
```

## Model fallback

`lib/gemini.js` tries `gemini-2.5-flash-lite` → `gemini-3.5-flash-lite` →
`gemini-3.6-flash` in that order (cheapest first), only falling forward on a
404 (model retired/renamed) — Google has renamed models mid-project before,
so this absorbs the next rename without a code change.
