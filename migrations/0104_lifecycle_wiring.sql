-- Additive lifecycle wiring: first-lead billing hold, simulated vs real jobs,
-- 24h trust window, approval cadence, email suppressions, daily counters.
-- Does not rewrite earlier migrations.

alter table if exists shop_billing
  add column if not exists stripe_customer_id text not null default '';

alter table if exists shop_billing
  add column if not exists stripe_payment_method_id text not null default '';

alter table if exists shop_billing
  add column if not exists awaiting_first_real_lead boolean not null default false;

alter table if exists shop_billing
  add column if not exists approval_cadence text not null default 'every_item';

alter table if exists consumer_leads
  add column if not exists shop_id text;

alter table if exists consumer_leads
  add column if not exists is_simulated boolean not null default false;

alter table if exists consumer_leads
  add column if not exists trust_window_expires_at timestamptz;

create table if not exists outreach_suppressions (
  id text primary key,
  email text not null default '',
  phone text not null default '',
  reason text not null default 'unsubscribe',
  created_at timestamptz not null default now()
);

create unique index if not exists outreach_suppressions_email_idx
  on outreach_suppressions (lower(email))
  where btrim(email) <> '';

create table if not exists outreach_daily_counters (
  id text primary key,
  day_key date not null,
  channel text not null,
  sent integer not null default 0,
  updated_at timestamptz not null default now()
);

create unique index if not exists outreach_daily_counters_day_channel_idx
  on outreach_daily_counters (day_key, channel);

alter table if exists outreach_suppressions enable row level security;
alter table if exists outreach_daily_counters enable row level security;
