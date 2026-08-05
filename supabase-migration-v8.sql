-- Migration v8: referral source + lightweight page-view analytics for admin.
-- Paste into Supabase → SQL Editor → Run.

alter table public.profiles add column if not exists referral_source text;

-- Page views: intentionally insert-only for anonymous visitors (no one, not
-- even the visitor, can read this table directly) — only the admin API
-- (service role, bypasses RLS) can read it for the analytics cards.
create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.page_views enable row level security;
drop policy if exists "anyone can log a page view" on public.page_views;
create policy "anyone can log a page view" on public.page_views
  for insert with check (true);
-- Deliberately no select policy — page_views has no public or per-user read
-- access. Only the service-role admin API can read it.
