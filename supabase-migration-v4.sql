-- Migration v4: accounts get 5 free credits + onboarding profile fields.
-- Paste into Supabase → SQL Editor → Run. Safe to run once on an existing DB.

alter table public.profiles add column if not exists industry text;
alter table public.profiles add column if not exists experience_level text;
alter table public.profiles add column if not exists profile_text text;
alter table public.profiles add column if not exists onboarded boolean not null default false;
alter table public.profiles alter column credits set default 5;

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

update public.profiles set credits = credits + 3 where plan = 'free' and credits <= 2;
