-- Migration v13: Talent Hub — opt-in public profile cards. Paste into
-- Supabase → SQL Editor → Run.
--
-- Deliberately a separate table from profiles, not new columns on it: this
-- table only ever contains fields the user explicitly chose to publish, so
-- there is no risk of an RLS policy mistake here ever exposing email,
-- credits, plan, banned status, or raw CV text — those columns simply don't
-- exist in this table. A row existing here means its owner opted in; there
-- is no separate "hidden" opt-in flag to get out of sync with visibility.

create table if not exists public.hub_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  title text not null,
  industry text,
  experience_level text,
  skills text[] not null default '{}',
  blurb text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.hub_profiles enable row level security;

drop policy if exists "hub profiles are public" on public.hub_profiles;
create policy "hub profiles are public" on public.hub_profiles
  for select using (true);

drop policy if exists "users insert own hub profile" on public.hub_profiles;
create policy "users insert own hub profile" on public.hub_profiles
  for insert with check (auth.uid() = id);

drop policy if exists "users update own hub profile" on public.hub_profiles;
create policy "users update own hub profile" on public.hub_profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "users delete own hub profile" on public.hub_profiles;
create policy "users delete own hub profile" on public.hub_profiles
  for delete using (auth.uid() = id);
