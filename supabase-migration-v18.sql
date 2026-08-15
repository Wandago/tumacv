-- Migration v18: Talent Hub services — paid gigs/services members can list
-- alongside their profile (Fiverr-style: title, description, category,
-- price, delivery time), browsable and searchable on /hub.
-- Paste into Supabase → SQL Editor → Run.
--
-- user_id references hub_profiles (not auth.users directly) so a service
-- literally cannot exist without a public profile behind it, and leaving
-- the Talent Hub (deleting your hub_profiles row) cascades to remove your
-- services too — no orphaned listings.
--
-- CHECK constraints enforce sane limits at the database level (same reason
-- as the jobs board constraints in v17): inserts happen directly from the
-- authenticated Supabase client, not through an API route, so client-side
-- validation alone can be bypassed.

create table public.hub_services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.hub_profiles(id) on delete cascade,
  category text not null,
  title text not null,
  description text not null,
  price_kes int not null,
  delivery_days int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hub_services_category_len check (char_length(category) between 1 and 60),
  constraint hub_services_title_len check (char_length(title) between 1 and 100),
  constraint hub_services_description_len check (char_length(description) between 1 and 600),
  constraint hub_services_price_range check (price_kes between 1 and 1000000),
  constraint hub_services_delivery_range check (delivery_days is null or delivery_days between 1 and 90)
);
alter table public.hub_services enable row level security;

create policy "services are public" on public.hub_services
  for select using (true);
create policy "users insert own services" on public.hub_services
  for insert with check (auth.uid() = user_id);
create policy "users update own services" on public.hub_services
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users delete own services" on public.hub_services
  for delete using (auth.uid() = user_id);

create index if not exists hub_services_user_idx on public.hub_services(user_id);
create index if not exists hub_services_category_idx on public.hub_services(category);
