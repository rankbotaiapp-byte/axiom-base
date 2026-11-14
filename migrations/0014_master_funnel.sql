-- Preloaded businesses for regional funnels, and the visits those links produce.
-- The app connection owns these tables. RLS is on with no public policy so a
-- restricted role cannot read the lead list.

create table if not exists preloaded_leads (
  id             text primary key,
  business_name  text not null,
  trade_type     text not null,
  city           text not null default '',
  county         text not null default '',
  lead_slug      text not null,
  claimed        boolean not null default false,
  shop_id        text references shops(id) on delete set null,
  created_at     timestamptz not null default now()
);

create unique index if not exists preloaded_leads_slug_idx on preloaded_leads (lead_slug);
create index if not exists preloaded_leads_county_idx on preloaded_leads (county);

create table if not exists funnel_visits (
  id           text primary key,
  lead_slug    text not null default '',
  utm_source   text not null default '',
  county       text not null default '',
  landed_path  text not null default '/',
  shop_id      text references shops(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists funnel_visits_slug_idx on funnel_visits (lead_slug, created_at desc);
create index if not exists funnel_visits_county_idx on funnel_visits (county, created_at desc);

alter table preloaded_leads enable row level security;
alter table funnel_visits enable row level security;
