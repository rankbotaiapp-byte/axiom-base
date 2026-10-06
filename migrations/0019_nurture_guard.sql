-- Day 3 and Day 6 are sent by the nurture worker. A visit stops a loop only
-- when it carries that sequence's stop token. Anonymous hits stay unverified.

alter table outreach_sequences add column if not exists stop_token_hash text not null default '';

alter table outreach_touches add column if not exists attempts integer not null default 0;

alter table funnel_visits add column if not exists verified boolean not null default false;
alter table funnel_visits add column if not exists client_key text not null default '';

create index if not exists funnel_visits_client_idx
  on funnel_visits (client_key, created_at desc);

create table if not exists outreach_events (
  id          text primary key,
  county      text not null default '',
  channel     text not null default '',
  summary     text not null default '',
  status      text not null default '',
  created_at  timestamptz not null default now()
);

create index if not exists outreach_events_created_idx
  on outreach_events (created_at desc);

alter table outreach_events enable row level security;
