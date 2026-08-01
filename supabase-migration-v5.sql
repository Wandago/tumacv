-- Migration v5: gamification (streaks, hired status), cached daily insight,
-- and the AI-generated industry news/articles feature.
-- Paste into Supabase → SQL Editor → Run. Safe to run once.

alter table public.profiles add column if not exists streak_count int not null default 0;
alter table public.profiles add column if not exists last_generation_date date;
alter table public.profiles add column if not exists hired boolean not null default false;
alter table public.profiles add column if not exists hired_at timestamptz;
alter table public.profiles add column if not exists cached_insight text;
alter table public.profiles add column if not exists cached_insight_date date;

-- Articles: AI-written, one per industry per day, publicly readable.
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
-- No insert/update policy for public users — only the server (using the
-- service-role key, which bypasses RLS) writes articles, via the cron route.

create index if not exists articles_industry_created_idx
  on public.articles (industry, created_at desc);
