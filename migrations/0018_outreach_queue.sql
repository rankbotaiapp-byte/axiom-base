-- Paced outreach chunks. Simulation rows are logged. Live rows send only after credentials pass.

create table if not exists outreach_dispatches (
  id                text primary key,
  campaign_id       text not null,
  channel           text not null,
  mode              text not null default 'simulation',
  chunk_index       integer not null,
  chunk_count       integer not null,
  lead_count        integer not null,
  interval_seconds  integer not null default 45,
  payload           text not null default '[]',
  status            text not null default 'queued',
  scheduled_at      timestamptz not null,
  sent_at           timestamptz,
  detail            text not null default '',
  county            text not null default '',
  created_at        timestamptz not null default now(),
  unique (campaign_id, chunk_index)
);

create index if not exists outreach_dispatches_due_idx
  on outreach_dispatches (status, scheduled_at);

create index if not exists outreach_dispatches_sent_idx
  on outreach_dispatches (sent_at desc);

alter table outreach_dispatches enable row level security;
