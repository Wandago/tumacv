-- Migration v5: gamification (streaks, badges, hired status), daily insight cache, news articles.
-- Paste into Supabase → SQL Editor → Run.

alter table public.profiles add column if not exists streak_count int not null default 0;
alter table public.profiles add column if not exists longest_streak int not null default 0;
alter table public.profiles add column if not exists last_generation_date date;
alter table public.profiles add column if not exists hired boolean not null default false;
alter table public.profiles add column if not exists hired_at timestamptz;
alter table public.profiles add column if not exists cached_insight text;
alter table public.profiles add column if not exists insight_date date;

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  industry text not null,
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.articles enable row level security;
drop policy if exists "articles are public" on public.articles;
create policy "articles are public" on public.articles
  for select using (true);
