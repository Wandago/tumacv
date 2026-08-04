-- Migration v7: privacy policy / terms acceptance tracking.
-- Paste into Supabase → SQL Editor → Run.

alter table public.profiles add column if not exists terms_accepted_at timestamptz;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, terms_accepted_at) values (new.id, new.email, now());
  return new;
end $$;
