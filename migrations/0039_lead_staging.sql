-- Staging for county-sized lead imports. A batch lands here, then moves into
-- preloaded_leads in the same transaction. Production-only columns (claimed,
-- shop, account mode, reviews) keep their defaults on promotion.
-- The unique pair also serves lookups and deletes for one batch.

create table if not exists preloaded_leads_staging (
  id             text primary key,
  batch_id       text not null,
  business_name  text not null,
  trade_type     text not null,
  trade_label    text not null default '',
  city           text not null default '',
  county         text not null default '',
  lead_slug      text not null,
  contact_email  text not null default '',
  contact_phone  text not null default '',
  website        text not null default '',
  has_website    boolean,
  phone_line     text not null default '',
  source         text not null default 'import',
  created_at     timestamptz not null default now()
);

create unique index if not exists preloaded_leads_staging_batch_slug_idx
  on preloaded_leads_staging (batch_id, lead_slug);

alter table preloaded_leads_staging enable row level security;
