-- Migration v11: support/feedback inbox.
-- Paste into Supabase → SQL Editor → Run.

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  type text not null default 'other',   -- 'bug' | 'suggestion' | 'other'
  message text not null,
  status text not null default 'open',  -- 'open' | 'resolved'
  created_at timestamptz not null default now()
);
alter table public.support_messages enable row level security;
-- No public policies: submissions go through /api/support (service role),
-- which lets it work for both signed-in and logged-out visitors (exactly
-- when someone locked out of their account most needs to reach you) while
-- keeping the inbox itself readable only by admins.
