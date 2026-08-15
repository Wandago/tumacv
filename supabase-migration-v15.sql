-- Migration v15: Referral program — every user gets a shareable link; when
-- someone signs up through it, both accounts earn bonus credits. Turns the
-- existing free-signup-credits loop into automatic, word-of-mouth marketing.
-- Paste into Supabase → SQL Editor → Run.

alter table public.profiles
  add column if not exists referred_by uuid references public.profiles(id) on delete set null,
  add column if not exists referral_credited boolean not null default false;

create index if not exists profiles_referred_by_idx on public.profiles(referred_by);
