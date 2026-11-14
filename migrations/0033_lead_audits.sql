-- Customer audit reports from the public estimate. The photo never leaves the device.

create table if not exists lead_audits (
  id             text primary key,
  lead_slug      text not null default '',
  shop_id        text references shops(id) on delete set null,
  customer_name  text not null,
  channel        text not null,
  contact        text not null,
  lane           text not null,
  low_cents      integer not null,
  high_cents     integer not null,
  impact         integer not null,
  summary        text not null,
  delivered      boolean not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists lead_audits_lead_idx on lead_audits (lead_slug, created_at desc);
create index if not exists lead_audits_shop_idx on lead_audits (shop_id, created_at desc);

alter table lead_audits enable row level security;
