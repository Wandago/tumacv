-- Migration v17: Security hardening for the public jobs board.
-- Paste into Supabase → SQL Editor → Run.
--
-- Job postings are inserted directly by authenticated users via the
-- Supabase client (RLS: "logged in users can post jobs"), not through an
-- API route — so JobsClient.js's client-side checks are the only guard
-- today, and anyone can bypass them by calling Supabase directly. These
-- CHECK constraints enforce sane length limits at the database level,
-- where they can't be bypassed. If this fails because existing rows
-- already exceed a limit, trim those rows first or raise the number below.

alter table public.jobs
  add constraint jobs_title_len check (char_length(title) between 1 and 150),
  add constraint jobs_company_len check (char_length(company) between 1 and 150),
  add constraint jobs_location_len check (location is null or char_length(location) <= 150),
  add constraint jobs_job_type_len check (job_type is null or char_length(job_type) <= 50),
  add constraint jobs_description_len check (char_length(description) between 1 and 8000),
  add constraint jobs_how_to_apply_len check (char_length(how_to_apply) between 1 and 500);
