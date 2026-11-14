-- Residential prospects for a tenant shop's own service area.
-- preloaded_leads stays the internal B2B list and is not read here.
-- County is matched case-insensitively, so the composite index keys lower(county).

create table if not exists consumer_leads (
  id                uuid primary key default gen_random_uuid(),
  niche             text not null,
  state             text not null default '',
  county            text not null default '',
  city              text not null default '',
  zip_code          text not null default '',
  lat               double precision,
  lng               double precision,
  homeowner_status  text not null default 'unknown'
                    check (homeowner_status in ('homeowner', 'renter', 'unknown')),
  contact_name      text not null default '',
  contact_email     text not null default '',
  contact_phone     text not null default '',
  contact_meta      jsonb not null default '{}'::jsonb,
  active            boolean not null default true,
  created_at        timestamptz not null default now()
);

create index if not exists consumer_leads_state_county_niche_idx
  on consumer_leads (state, lower(county), niche)
  where active;

create index if not exists consumer_leads_zip_code_idx
  on consumer_leads (zip_code)
  where active;

alter table consumer_leads enable row level security;
