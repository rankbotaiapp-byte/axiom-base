-- Contact lines on preloaded businesses, and a log of simulated outreach batches.

alter table preloaded_leads add column if not exists contact_email text not null default '';
alter table preloaded_leads add column if not exists contact_phone text not null default '';

create table if not exists outreach_campaigns (
  id           text primary key,
  county       text not null,
  trade_type   text not null,
  lead_count   integer not null,
  status       text not null default 'simulated',
  template     text not null default '',
  created_at   timestamptz not null default now()
);

create index if not exists outreach_campaigns_created_idx
  on outreach_campaigns (created_at desc);

alter table outreach_campaigns enable row level security;
