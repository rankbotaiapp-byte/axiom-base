-- Per-lead production mode, plus the checkout that flips it.

alter table preloaded_leads add column if not exists account_mode text not null default 'simulation';

create table if not exists territory_checkouts (
  id            text primary key,
  lead_slug     text not null,
  plan_id       text not null,
  amount_cents  integer not null,
  processor     text not null default 'desk',
  status        text not null default 'pending',
  payment_ref   text not null default '',
  created_at    timestamptz not null default now()
);

create table if not exists territory_activations (
  id             text primary key,
  lead_slug      text not null,
  business_name  text not null default '',
  county         text not null default '',
  plan_id        text not null,
  plan_name      text not null default '',
  amount_cents   integer not null default 0,
  renewal_cents  integer,
  renews_at      timestamptz,
  payment_ref    text not null default '',
  created_at     timestamptz not null default now()
);

create unique index if not exists territory_activations_lead_idx on territory_activations (lead_slug);
create index if not exists territory_activations_created_idx on territory_activations (created_at desc);

alter table territory_checkouts enable row level security;
alter table territory_activations enable row level security;
