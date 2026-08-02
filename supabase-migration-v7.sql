-- Migration v7: privacy policy / terms acceptance tracking.
-- Paste into Supabase → SQL Editor → Run.

alter table public.profiles add column if not exists terms_accepted_at timestamptz;

-- Every new signup now goes through a checkbox before the account is created,
-- so we stamp acceptance at the moment the profile row is created — this works
-- even if email confirmation is required (no session exists yet at that point).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, terms_accepted_at) values (new.id, new.email, now());
  return new;
end $$;
