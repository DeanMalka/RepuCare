-- RepuCare — Supabase schema (multi-tenant, RLS-secured)
-- Run in Supabase: SQL Editor → paste → Run. Safe to re-run (IF NOT EXISTS / DROP POLICY guards).

create extension if not exists pgcrypto;

-- 1) Owners (1:1 with auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz default now()
);

-- 2) Businesses (a tenant). business_type drives the "vertical pack".
create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  city text,
  business_type text not null default 'dental',   -- dental|salon|dog|garage|play|event|aesthetic
  google_review_url text,
  message_template text,
  channels jsonb not null default '{"email":true,"sms":false,"gate":true}',
  rating_token uuid not null default gen_random_uuid() unique,  -- public /r/[token]
  created_at timestamptz default now()
);
create index if not exists idx_businesses_owner on businesses(owner_id);

-- 3) Review requests (one per customer ask)
create table if not exists review_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  customer_name text,
  contact text,                      -- phone/email (minimal PII)
  channel text default 'sms',        -- sms|email|whatsapp|qr
  token uuid not null default gen_random_uuid() unique,
  status text not null default 'sent', -- sent|opened|review|feedback
  created_at timestamptz default now(),
  responded_at timestamptz
);
create index if not exists idx_requests_business on review_requests(business_id);

-- 4) Private feedback (1-3 stars, caught before public)
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  request_id uuid references review_requests(id) on delete set null,
  rating int check (rating between 1 and 5),
  body text,
  status text not null default 'new', -- new|handled
  created_at timestamptz default now()
);
create index if not exists idx_feedback_business on feedback(business_id);

-- 5) Reviews tracked (for the dashboard/monitoring; phase 1 = Google)
create table if not exists reviews_tracked (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  source text default 'google',
  reviewer text,
  rating int,
  body text,
  external_date text,
  created_at timestamptz default now()
);
create index if not exists idx_reviews_business on reviews_tracked(business_id);

-- 6) Subscriptions (Stripe)
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text,                       -- trialing|active|past_due|canceled
  trial_end timestamptz,
  current_period_end timestamptz,
  updated_at timestamptz default now()
);
create unique index if not exists idx_sub_business on subscriptions(business_id);

-- 7) Event log (audit)
create table if not exists events_log (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  type text,
  meta jsonb,
  created_at timestamptz default now()
);

-- ---------- Row Level Security ----------
alter table profiles        enable row level security;
alter table businesses      enable row level security;
alter table review_requests enable row level security;
alter table feedback        enable row level security;
alter table reviews_tracked enable row level security;
alter table subscriptions   enable row level security;
alter table events_log      enable row level security;

-- profiles: a user sees only their own row
drop policy if exists p_profiles on profiles;
create policy p_profiles on profiles for all
  using (id = auth.uid()) with check (id = auth.uid());

-- businesses: owner-scoped
drop policy if exists p_businesses on businesses;
create policy p_businesses on businesses for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- child tables: scoped to businesses the user owns
drop policy if exists p_requests on review_requests;
create policy p_requests on review_requests for all
  using (business_id in (select id from businesses where owner_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

drop policy if exists p_feedback on feedback;
create policy p_feedback on feedback for all
  using (business_id in (select id from businesses where owner_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

drop policy if exists p_reviews on reviews_tracked;
create policy p_reviews on reviews_tracked for all
  using (business_id in (select id from businesses where owner_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

drop policy if exists p_subs on subscriptions;
create policy p_subs on subscriptions for select
  using (business_id in (select id from businesses where owner_id = auth.uid()));
-- NOTE: subscriptions are written only by the Stripe webhook via the service-role key (bypasses RLS).

-- events_log: owner can read; writes via service role
drop policy if exists p_events on events_log;
create policy p_events on events_log for select
  using (business_id in (select id from businesses where owner_id = auth.uid()));

-- The public rating page (/r/[token]) and webhooks use the SERVICE ROLE key on the server,
-- which bypasses RLS. No public/anon policies are granted on purpose.
