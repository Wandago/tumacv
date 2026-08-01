-- Migration for an EXISTING TumaCV database (you already ran supabase-schema.sql once).
-- Paste this into Supabase → SQL Editor → Run. Safe to run once.

-- New columns for onboarding: industry, experience level, and a master CV/profile
-- stored on the account itself (not just the browser) so it follows the user
-- across devices.
alter table public.profiles add column if not exists industry text;
alter table public.profiles add column if not exists experience_level text;
alter table public.profiles add column if not exists profile_text text;
alter table public.profiles add column if not exists onboarded boolean not null default false;

-- Bump free signup credits from 2 to 5 for all NEW signups going forward.
alter table public.profiles alter column credits set default 5;

-- Let users update their own profile row (needed so the onboarding page and
-- the "save my profile to my account" feature can write industry/experience/CV text).
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Optional: top up existing users who signed up before this change from 2 to 5 free credits.
-- Only affects accounts that never topped up (plan = 'free', still on their original balance).
-- Comment this out if you'd rather leave existing balances untouched.
update public.profiles set credits = credits + 3 where plan = 'free' and credits <= 2;
