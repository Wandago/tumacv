-- Migration v16: Marketing engine — AI-generated social posts, lifecycle
-- DMs (email/WhatsApp/SMS), and an in-app "what's new" feed, all logged to
-- one auditable table. Paste into Supabase → SQL Editor → Run.

alter table public.profiles
  add column if not exists marketing_opt_out boolean not null default false,
  add column if not exists phone text,
  add column if not exists last_marketing_dm_at timestamptz;

create table public.marketing_content (
  id uuid primary key default gen_random_uuid(),
  kind text not null,                -- 'social_post' | 'lifecycle_email' | 'in_app'
  channel text not null,             -- 'x' | 'linkedin' | 'facebook' | 'email' | 'whatsapp' | 'sms' | 'in_app'
  segment text,                      -- for lifecycle_email: which audience this was generated for
  subject text,
  body text not null,
  cta_url text,
  status text not null default 'pending',   -- pending | sent | failed | skipped
  error text,
  recipient_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
alter table public.marketing_content enable row level security;

-- Only the in-app feed is ever readable by ordinary users, and only once it
-- has actually gone out — everything else (social copy, DM audit trail) is
-- admin/service-role only via the default-deny RLS.
create policy "sent in-app content is public" on public.marketing_content
  for select using (kind = 'in_app' and status = 'sent');

create index if not exists marketing_content_status_idx on public.marketing_content(kind, status, created_at desc);
