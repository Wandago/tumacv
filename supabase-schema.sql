-- TumaCV database schema (consolidated, final state as of this build).
-- For a BRAND NEW Supabase project: paste this whole file into SQL Editor → Run.
-- If you already have a TumaCV database, do NOT run this — use the numbered
-- migration files instead (supabase-migration-v4.sql through v7.sql), in order.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  credits int not null default 5,
  plan text not null default 'free',
  plan_expires timestamptz,
  industry text,
  experience_level text,
  profile_text text,
  onboarded boolean not null default false,
  streak_count int not null default 0,
  longest_streak int not null default 0,
  last_generation_date date,
  hired boolean not null default false,
  hired_at timestamptz,
  cached_insight text,
  insight_date date,
  is_admin boolean not null default false,
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "update own profile" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, terms_accepted_at) values (new.id, new.email, now());
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_title text,
  template text,
  result jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.generations enable row level security;
create policy "read own generations" on public.generations
  for select using (auth.uid() = user_id);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  company text not null,
  location text,
  job_type text,
  description text not null,
  how_to_apply text not null,
  created_at timestamptz not null default now()
);
alter table public.jobs enable row level security;
create policy "jobs are public" on public.jobs
  for select using (true);
create policy "logged in users can post jobs" on public.jobs
  for insert with check (auth.uid() = user_id);
create policy "posters can delete own jobs" on public.jobs
  for delete using (auth.uid() = user_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null,
  amount int not null,
  status text not null default 'pending',
  provider_ref text,
  created_at timestamptz not null default now()
);
alter table public.payments enable row level security;
create policy "read own payments" on public.payments
  for select using (auth.uid() = user_id);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  industry text not null,
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.articles enable row level security;
create policy "articles are public" on public.articles
  for select using (true);
