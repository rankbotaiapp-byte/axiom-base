-- Simulated nurture loops started by an email or SMS batch.
-- A click on ?b=slug stops the remaining touches.

create table if not exists outreach_sequences (
  id              text primary key,
  lead_slug       text not null,
  campaign_id     text not null,
  channel         text not null,
  county          text not null default '',
  trade_type      text not null default '',
  strategy        text not null default '',
  status          text not null default 'active',
  stopped_reason  text not null default '',
  created_at      timestamptz not null default now()
);

create index if not exists outreach_sequences_slug_idx
  on outreach_sequences (lead_slug, created_at desc);

create unique index if not exists outreach_sequences_active_channel_idx
  on outreach_sequences (lead_slug, channel)
  where status = 'active';

create table if not exists outreach_touches (
  id            text primary key,
  sequence_id   text not null references outreach_sequences(id) on delete cascade,
  step          integer not null,
  label         text not null,
  status        text not null,
  scheduled_at  timestamptz not null,
  body          text not null default '',
  created_at    timestamptz not null default now(),
  unique (sequence_id, step)
);

create index if not exists outreach_touches_sequence_idx
  on outreach_touches (sequence_id, step);

alter table outreach_sequences enable row level security;
alter table outreach_touches enable row level security;
