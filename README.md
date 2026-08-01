# TumaCV v2 — full SaaS

Tailored CV + cover letters for Kenyan job seekers, with accounts, credit tiers,
M-Pesa/Airtel/card payments, a dashboard with history, and a free jobs board.

## What's included

- **Accounts** — email + password via Supabase. Every new account gets 2 free applications.
- **Tiers** — Single KES 50 (1 app), Starter KES 200 (30 apps), Pro KES 500 (100 apps),
  Unlimited KES 1,500 (30-day pass). Prices live in `lib/plans.js` — change them there only.
- **Payments** — IntaSend hosted checkout (M-Pesa STK, Airtel Money, Visa/Mastercard) with a
  webhook that credits accounts automatically. Passes are one-off, not auto-renewing
  (recurring billing on mobile money is unreliable; 30-day passes are the honest version).
- **Dashboard** — balance, top-up buttons, and every past CV/letter reopenable and printable.
- **Jobs board** — employers post free (login required, which limits spam); every listing has a
  "Tailor my CV for this job" button that pre-fills the generator. This is the flywheel:
  employers bring seekers, seekers pay per application.
- **AI** — Google Gemini (free tier to start). One file to swap providers later:
  `app/api/generate/route.js`.

## Setup (about 30 minutes, all free)

### 1. Supabase (database + accounts)
1. Create a free project at supabase.com (choose a region, set a strong DB password).
2. Open **SQL Editor**, paste the entire contents of `supabase-schema.sql`, click **Run**.
3. In **Authentication → Providers → Email**: for a smoother beta, turn OFF
   "Confirm email" (turn it back on before public launch).
4. In **Project Settings → API**, copy three values: Project URL, `anon` public key,
   and `service_role` key (keep service_role secret — server only).

### 2. Gemini (AI)
Get a free key at aistudio.google.com → Get API key.
Note: on Gemini's free tier Google may use prompts to improve its models —
acceptable for beta, switch to a paid key before charging the public.

### 3. IntaSend (payments)
1. Sign up at intasend.com. Start in **sandbox** (test mode) — you get test keys immediately;
   live keys require completing their KYC (ID + basic business info, usually ~1 day).
2. Copy your **Publishable key** (starts `ISPubKey_test_` in sandbox).
3. In the IntaSend dashboard, set up a **Webhook**: URL = `https://YOUR-DOMAIN/api/payments/webhook`,
   and set a **challenge** — any secret phrase. The same phrase goes in your env vars.
4. Sandbox lets you simulate successful M-Pesa payments without real money.

### 4. Deploy on Vercel
1. Push this folder to GitHub (GitHub Desktop: commit → push).
2. vercel.com → Add New Project → import the repo.
3. Add ALL environment variables from `.env.example` (with your real values).
   Set `NEXT_PUBLIC_SITE_URL` to your Vercel URL once you know it.
4. Deploy. Then create your own account on the live site, buy a plan with an IntaSend
   sandbox test payment, and confirm credits appear in your dashboard within a minute.

### Going live with real money
- Complete IntaSend KYC → swap `INTASEND_PUBLISHABLE_KEY` to the live key and
  `INTASEND_BASE_URL` to `https://payment.intasend.com`, update the webhook URL if your
  domain changed, and redeploy.
- Switch Gemini to a paid key (or back to Claude) — user CVs shouldn't be on a
  free tier that trains models.
- Vercel Hobby is non-commercial: upgrade to Pro ($20/mo) or move to Cloudflare
  when you start charging.
- Turn email confirmation back on in Supabase.

## Where things live

```
lib/plans.js                     ← pricing (edit here only)
lib/supabaseClient.js            ← browser DB client
lib/supabaseAdmin.js             ← server DB client + auth check
app/page.js                      ← generator
app/login/page.js                ← auth
app/dashboard/page.js            ← balance, top-ups, history
app/jobs/page.js                 ← jobs board
app/api/generate/route.js        ← Gemini + credit enforcement
app/api/checkout/route.js        ← creates IntaSend checkout
app/api/payments/webhook/route.js ← credits accounts after payment
app/api/fetch-jd/route.js        ← reads job URLs
supabase-schema.sql              ← run once in Supabase
```

## Security notes
- Prices are decided server-side (`lib/plans.js` imported by API routes) — the client can't
  pay KES 1 for Unlimited.
- Credits are checked and deducted server-side with the service-role key; row-level security
  means users can only read their own data.
- The webhook rejects calls without your challenge phrase and only fulfills each payment once.
- No secret key ever ships to the browser: only `NEXT_PUBLIC_*` variables are public.

## Update: pricing & LinkedIn (this revision)

**Pricing** now runs KES 1/generation (KES 50 → 50 applications), because the AI model
switched to Gemini Flash-Lite, which costs roughly KES 0.20–0.30 per generation on the
paid tier — leaving healthy margin even at this much lower price. Tiers live in
`lib/plans.js`. `FREE_MODE` there is set back to `false`.

**LinkedIn**: there is no legitimate way for a third-party app to auto-pull someone's
full LinkedIn profile — the official API only exposes name/email/photo, and scraping
violates LinkedIn's terms and carries real legal risk. What's actually implemented:
users export their own profile as a PDF (LinkedIn's native, first-party "Save to PDF"),
upload it, and the app extracts the text client-side (in the browser, via pdfjs-dist —
nothing is sent to LinkedIn or uploaded to any server for this step). Same applies to
LinkedIn *job* links — they sit behind a login wall by design, so those still require
pasting the description text; every other job board (BrighterMonday, Fuzu, MyJobMag,
company career pages) is fetched automatically as before.

**Going to real paid Gemini**: the free aistudio.google.com key works during testing,
but has tight rate limits shared across all users. Before real launch, enable billing
on the Gemini API (console shows a "set up billing" prompt) so the app draws from the
much higher paid-tier limits — the code and pricing model already assume paid-tier cost.
