-- TumaCV database schema. Paste this whole file into Supabase → SQL Editor → Run.

-- Profiles: one row per user, created automatically on signup with 2 free credits.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  credits int not null default 2,
  plan text not null default 'free',
  plan_expires timestamptz,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Generation history: reopen any past CV/letter from the dashboard.
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

-- Job board: anyone can read, logged-in users can post for free.
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

-- Payments: created server-side, fulfilled by the IntaSend webhook.
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
