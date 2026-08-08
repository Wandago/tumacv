-- Migration v10: account banning, for manually-caught abuse (multi-accounts,
-- promo code farming, etc). No automated multi-account detection exists —
-- this is the lever you use once you've spotted a real pattern in the admin panel.
-- Paste into Supabase → SQL Editor → Run.

alter table public.profiles add column if not exists banned boolean not null default false;
