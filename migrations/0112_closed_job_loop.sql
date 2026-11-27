-- Sprint 1: truthful ROI, missed-call slot holds, SMS quotes, paid-atom queue.
-- Additive only. Simulated jobs stay isolated from live billing.

alter table if exists appointments
  add column if not exists is_simulated boolean not null default false;

alter table if exists appointments
  add column if not exists deposit_paid boolean not null default false;

alter table if exists appointments
  add column if not exists quote_id text;

create table if not exists shop_quotes (
  id                  text primary key,
  shop_id             text not null references shops(id) on delete cascade,
  appointment_id      text references appointments(id) on delete set null,
  customer_phone      text not null default '',
  customer_name       text not null default '',
  description         text not null default '',
  total_cents         integer not null default 0,
  deposit_cents       integer not null default 0,
  stripe_session_id   text not null default '',
  stripe_checkout_url text not null default '',
  status              text not null default 'sent'
                      check (status in ('draft', 'sent', 'deposit_paid', 'paid', 'void')),
  created_at          timestamptz not null default now()
);

create index if not exists shop_quotes_shop_idx on shop_quotes (shop_id, created_at desc);
create unique index if not exists shop_quotes_session_idx
  on shop_quotes (stripe_session_id) where btrim(stripe_session_id) <> '';

create table if not exists missed_call_slot_offers (
  id              text primary key,
  shop_id         text not null references shops(id) on delete cascade,
  customer_phone  text not null,
  window1_start   timestamptz,
  window1_end     timestamptz,
  window1_label   text not null default '',
  window1_employee_id text,
  window2_start   timestamptz,
  window2_end     timestamptz,
  window2_label   text not null default '',
  window2_employee_id text,
  appointment_id  text,
  expires_at      timestamptz not null default now() + interval '24 hours',
  created_at      timestamptz not null default now()
);

create index if not exists missed_call_slot_offers_phone_idx
  on missed_call_slot_offers (shop_id, customer_phone, created_at desc);

create table if not exists closed_job_atoms (
  appointment_id     text primary key references appointments(id) on delete cascade,
  shop_id            text not null references shops(id) on delete cascade,
  receipt_sent_at    timestamptz,
  review_queued_at   timestamptz,
  review_sent_at     timestamptz,
  proof_status       text not null default 'none'
                     check (proof_status in ('none', 'pending_approval', 'published', 'skipped')),
  proof_asset_url    text not null default '',
  paid_cents         integer not null default 0,
  created_at         timestamptz not null default now()
);

create table if not exists closed_job_queue (
  id              text primary key,
  shop_id         text not null references shops(id) on delete cascade,
  appointment_id  text,
  kind            text not null,
  run_at          timestamptz not null,
  status          text not null default 'pending'
                  check (status in ('pending', 'sent', 'skipped', 'failed')),
  payload         jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create unique index if not exists closed_job_queue_review_once_idx
  on closed_job_queue (appointment_id, kind)
  where kind = 'review_sms' and appointment_id is not null;

create index if not exists closed_job_queue_due_idx
  on closed_job_queue (status, run_at);
