-- ============================================================================
-- RepuCare — migration 003: Google reviews sync, multi-branch, partners.
-- Paste into Supabase → SQL Editor → Run. Idempotent (safe to re-run).
-- Date: 2026-07-01
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 0) Backfill columns that earlier code already uses but were added out-of-band
--    (so a fresh project built from schema.sql + this file is complete).
-- ----------------------------------------------------------------------------
-- pro.co.il (המקצוענים) read-only cache:
alter table businesses add column if not exists pro_url text;
alter table businesses add column if not exists pro_consent boolean default false;
alter table businesses add column if not exists pro_rating numeric;
alter table businesses add column if not exists pro_reviews_count int;
alter table businesses add column if not exists pro_reviews jsonb;
alter table businesses add column if not exists pro_fetched_at timestamptz;
-- WhatsApp sender selection (used by /api/send):
alter table businesses add column if not exists send_channel text default 'whatsapp';
alter table businesses add column if not exists sender_mode  text default 'shared';
alter table businesses add column if not exists waba_phone_id text;
-- feedback attribution (used by /api/feedback):
alter table feedback add column if not exists customer_id    uuid references customers(id) on delete set null;
alter table feedback add column if not exists customer_name  text;
alter table feedback add column if not exists customer_phone text;
-- review_requests delivery metadata (used by /api/send):
alter table review_requests add column if not exists provider_msg_id text;
alter table review_requests add column if not exists template        text;
alter table review_requests add column if not exists error           text;
-- opt-out flag (used by /api/customers + UI):
alter table customers add column if not exists do_not_contact boolean not null default false;

-- ----------------------------------------------------------------------------
-- 1) Google reputation cache on the business row (mirrors the pro_* pattern).
--    google_reviews        = up to 5 review TEXTS from the official Places API.
--    *_baseline_count      = total review COUNT captured the day the client
--                            joined → powers the accurate "we added X reviews".
-- ----------------------------------------------------------------------------
alter table businesses add column if not exists google_place_id              text;
alter table businesses add column if not exists google_rating                numeric;
alter table businesses add column if not exists google_reviews_count         int;
alter table businesses add column if not exists google_reviews               jsonb;
alter table businesses add column if not exists google_reviews_baseline_count int;
alter table businesses add column if not exists google_baseline_at           timestamptz;
alter table businesses add column if not exists google_fetched_at            timestamptz;

-- Landing social-proof opt-in + logo (see partners section below).
alter table businesses add column if not exists show_as_partner boolean not null default true;
alter table businesses add column if not exists logo_url        text;

-- ----------------------------------------------------------------------------
-- 2) BRANCHES — independent Google locations under one paying business/owner.
--    Each branch is ranked separately on Google and owns its own rating link
--    (/r/[token]) so survey + private feedback split per branch.
-- ----------------------------------------------------------------------------
create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  city text,
  address text,
  -- Google:
  google_place_id              text,
  google_review_url            text,
  google_rating                numeric,
  google_reviews_count         int,
  google_reviews               jsonb,
  google_reviews_baseline_count int,
  google_baseline_at           timestamptz,
  google_fetched_at            timestamptz,
  -- pro.co.il (optional, per branch):
  pro_url           text,
  pro_consent       boolean default false,
  pro_rating        numeric,
  pro_reviews_count int,
  pro_reviews       jsonb,
  pro_fetched_at    timestamptz,
  -- own public rating-gating link:
  rating_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz default now()
);
create index if not exists idx_branches_business on branches(business_id);

alter table branches enable row level security;
drop policy if exists p_branches on branches;
create policy p_branches on branches for all
  using (business_id in (select id from businesses where owner_id = (select auth.uid())))
  with check (business_id in (select id from businesses where owner_id = (select auth.uid())));

-- ----------------------------------------------------------------------------
-- 3) Per-branch attribution on the activity tables (nullable = main business).
--    The public rating page / webhooks write branch_id via the service role.
-- ----------------------------------------------------------------------------
alter table review_requests add column if not exists branch_id uuid references branches(id) on delete set null;
alter table feedback        add column if not exists branch_id uuid references branches(id) on delete set null;
alter table reviews_tracked add column if not exists branch_id uuid references branches(id) on delete set null;
alter table customers       add column if not exists branch_id uuid references branches(id) on delete set null;
alter table events_log      add column if not exists branch_id uuid references branches(id) on delete set null;
create index if not exists idx_feedback_branch on feedback(branch_id);
create index if not exists idx_requests_branch on review_requests(branch_id);
create index if not exists idx_events_branch   on events_log(branch_id);

-- ----------------------------------------------------------------------------
-- 4) Done. Verify quickly:
--    select column_name from information_schema.columns
--      where table_name='businesses' and column_name like 'google_%';
--    select * from branches limit 1;
-- ----------------------------------------------------------------------------
