-- Migration v6: admin dashboard support.
-- Paste into Supabase → SQL Editor → Run.

alter table public.profiles add column if not exists is_admin boolean not null default false;

-- Make yourself an admin. Replace the email, then run just this line.
-- update public.profiles set is_admin = true where email = 'you@example.com';
