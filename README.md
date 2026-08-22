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
lib/referral.js                  Referral-link localStorage + link builder
lib/gemini.js                    Shared AI caller with model-fallback
lib/gamification.js              Badges + industries list
app/page.js                      Generator (homepage)
app/onboarding/page.js           First-run onboarding AND "Edit profile" (dual purpose)
app/dashboard/page.js            Credits, streak, badges, insight, history
app/admin/page.js                Admin panel (Overview/Users/Jobs/Payments/Articles)
app/api/generate/route.js        Gemini + credits + streak tracking
app/api/cron/generate-articles   Daily AI news articles (2/day, random industry)
app/api/account/[action]/route.js  redeem-code / apply-referral / referral-stats, one function
components/ReferralCapture.js    Reads ?ref= on any page, remembers it pre-signup
components/ReferralCard.js       Dashboard "invite friends" card
lib/marketingEngine.js           Generates + sends all marketing content (see below)
lib/marketingChannels.js         Which channels are live, based on env vars present
lib/channels/*.js                One file per channel's send/post API call
components/InAppMarketingBanner.js  Dashboard "what's new" banner
components/MyServices.js         Dashboard: manage your own Talent Hub service listings
lib/serviceCategories.js         Categories for Talent Hub services
supabase-schema.sql              Fresh-install schema (final state)
supabase-migration-v4..v19.sql   Incremental migrations, run in order on an existing DB
```

## A note on Vercel's Hobby plan limits

This project deploys on Vercel's free Hobby tier, which caps both the number
of Serverless Functions per deployment and how many Cron Jobs a project can
have. Every file under `app/api/**/route.js` is a separate function — **before
adding a new one, check if it can be a new `action`/`type` inside an existing
dynamic route** (`app/api/admin/[action]/route.js`, `app/api/account/[action]/route.js`,
`app/api/payments/[provider]/route.js`, `app/api/support/[[...slug]]/route.js`)
instead. Same discipline applies to `vercel.json`'s `crons` array — new
scheduled work should usually be a new branch inside `runMarketingCron` or the
articles cron, not a third cron entry.

## Referral program

Every account has a permanent link — `https://tumacv.vercel.app/?ref=<user-id>` —
shown on the dashboard's "Invite friends, earn credits" card. `ReferralCapture`
remembers a `?ref=` code in localStorage the moment anyone lands on any page
with one (job posting, article, homepage — doesn't matter which), and
onboarding applies it once the account exists via `/api/account/apply-referral`,
which credits both the new signup and the referrer `REFERRAL_CREDITS` (see
`lib/plans.js`) each. The claim is race-safe (conditional update on
`referred_by is null`) and one-shot per account — this is the app's own
built-in, self-serve growth loop, no ad spend required.

## Marketing engine

`vercel.json` runs `/api/admin/cron-marketing` once a day (`runMarketingCron`
in `lib/marketingEngine.js`), which:

1. **Writes a social post** with Gemini — about today's new AI news article
   if one exists, otherwise a general pitch — in one call that returns
   platform-specific copy for X, LinkedIn, Facebook, and a one-line in-app
   banner. Posts it to whichever of those channels are configured; the
   in-app banner always "posts" since it needs no external account.
2. **Writes and sends lifecycle emails** to two segments: accounts inactive
   7+ days ("winback"), and accounts down to their last application or two
   ("low_credits", skipped while `FREE_MODE` is on). One AI-written template
   per segment per day, sent to up to 25 eligible users per run (capped to
   respect Vercel's function timeout and provider rate limits), then mirrored
   to WhatsApp/SMS for anyone who's given a phone number, if those channels
   are configured. Respects `profiles.marketing_opt_out` (toggle in
   onboarding → "Edit profile") and a 14-day cooldown per user so nobody gets
   messaged every single day.

Every attempt — sent, failed, or skipped because a channel isn't
configured — is logged to `marketing_content`, visible in Admin → Marketing,
which also has a "Run now" button that calls the same function directly
(no need to wait for the cron).

**Channels and what they need:**

| Channel | Env vars | Get it from |
|---|---|---|
| Email | `RESEND_API_KEY`, `MARKETING_FROM_EMAIL` | resend.com — same account as the SMTP setup above |
| WhatsApp | `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | Meta's WhatsApp Cloud API, via a Meta developer app |
| SMS | `AFRICASTALKING_API_KEY`, `AFRICASTALKING_USERNAME` | africastalking.com (use `"sandbox"` as the username to test) |
| X | `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET` | developer.x.com — a Project/App with write access, OAuth 1.0a tokens |
| LinkedIn | `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_ORG_URN` | a LinkedIn app with `w_organization_social`, tied to your Company Page. Tokens expire (~60 days) and need manual rotation. |
| Facebook | `FACEBOOK_PAGE_ID`, `FACEBOOK_PAGE_ACCESS_TOKEN` | a long-lived Page access token from a Meta developer app |

Every channel is optional — the engine checks which env vars are present
(`lib/marketingChannels.js`) and just skips (logged, not silently) whatever
isn't configured. Add credentials for one and it starts working on the next
run, no code change.

**Instagram, TikTok and Snapchat are deliberately not wired up.** None of
them can accept a simple server-to-server text post the way X/LinkedIn/Facebook
can: Instagram's API requires an image or video asset, TikTok's Content
Posting API requires video plus a separate app-review process, and Snapchat
has no public API for organic posting from a regular account at all (only
paid ads). Wiring these up for real would mean building an image/video
generation pipeline first — a much bigger project than adding an API key.

## Talent Hub services (marketplace)

Members who've opted into the Talent Hub (`hub_profiles`) can also list paid
services — a CV rewrite, a logo design, a tutoring session — in
`hub_services`: category, title, description, price in KES, optional
delivery time. Managed from the dashboard (`components/MyServices.js`,
rendered inside `TalentHubCard`), browsable and searchable on `/hub` under
the "Services" tab (keyword search, category filter, sort by price).

`hub_services.user_id` references `hub_profiles(id)` (not `auth.users`
directly) with `on delete cascade` — a service can't exist without a public
profile behind it, and leaving the Talent Hub removes your listings too, no
orphaned rows. Like the jobs board (see `supabase-migration-v17.sql`),
inserts happen directly from the authenticated Supabase client with no API
route in between, so length/price bounds are enforced with CHECK
constraints at the database level (`supabase-migration-v18.sql`), not just
client-side.

## Model fallback

`lib/gemini.js` tries `gemini-2.5-flash-lite` → `gemini-3.5-flash-lite` →
`gemini-3.6-flash` in that order (cheapest first), only falling forward on a
404 (model retired/renamed) — Google has renamed models mid-project before,
so this absorbs the next rename without a code change.
