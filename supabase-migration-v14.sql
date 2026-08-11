-- Migration v14: Talent Hub — add work experience and education to hub
-- profiles. Paste into Supabase → SQL Editor → Run.
--
-- Kept as jsonb arrays of small, non-sensitive objects (role/company/dates,
-- degree/school/dates) — the app caps how many entries a user can add and
-- how long each field is, so this stays a light public summary rather than
-- a full CV. Existing rows default to empty arrays, so this is safe to run
-- against a table that already has data in it.

alter table public.hub_profiles
  add column if not exists experience jsonb not null default '[]'::jsonb,
  add column if not exists education jsonb not null default '[]'::jsonb;
