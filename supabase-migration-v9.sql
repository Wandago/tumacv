-- Migration v9: redeemable promo codes (for TikTok/social giveaways etc).
-- Paste into Supabase → SQL Editor → Run.

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  credits int not null,
  max_redemptions int,               -- null = unlimited
  redemptions_count int not null default 0,
  active boolean not null default true,
  expires_at timestamptz,
  note text,                         -- e.g. "TikTok launch video, Aug 2026"
  created_at timestamptz not null default now()
);
alter table public.promo_codes enable row level security;
-- No public policies at all: only the service-role admin API reads/writes
-- this table directly. Redemption happens through a server route that
-- validates the code, not a client-side query.

create table if not exists public.promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.promo_codes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (code_id, user_id)          -- one redemption per code per account
);
alter table public.promo_redemptions enable row level security;
