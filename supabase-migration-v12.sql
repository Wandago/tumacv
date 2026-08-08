-- Migration v12: real support tickets with threaded replies, viewable by
-- the user who filed them. Paste into Supabase → SQL Editor → Run.

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  type text not null default 'other',
  subject text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.support_tickets enable row level security;
drop policy if exists "read own tickets" on public.support_tickets;
create policy "read own tickets" on public.support_tickets
  for select using (auth.uid() = user_id);
-- No insert/update policy for regular users: ticket creation and replies go
-- through /api/support and /api/support/reply (service role), which is what
-- lets anonymous (locked-out) visitors file a ticket at all, and lets the
-- server verify ownership before allowing a reply.

create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender text not null check (sender in ('user', 'admin')),
  message text not null,
  created_at timestamptz not null default now()
);
alter table public.support_ticket_messages enable row level security;
drop policy if exists "read own ticket messages" on public.support_ticket_messages;
create policy "read own ticket messages" on public.support_ticket_messages
  for select using (
    exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid())
  );

-- Carry over anything submitted through the old one-shot contact form, if
-- that table exists on this database. Safe to run even if it doesn't.
do $$
begin
  if exists (select from information_schema.tables where table_schema = 'public' and table_name = 'support_messages') then
    insert into public.support_tickets (id, user_id, email, type, subject, status, created_at, updated_at)
    select id, user_id, email, type, left(message, 60), status, created_at, created_at
    from public.support_messages
    on conflict (id) do nothing;

    insert into public.support_ticket_messages (ticket_id, sender, message, created_at)
    select sm.id, 'user', sm.message, sm.created_at
    from public.support_messages sm
    where not exists (select 1 from public.support_ticket_messages m where m.ticket_id = sm.id);
  end if;
end $$;
