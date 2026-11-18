-- Quarantine leads that opt out (STOP) or hard-bounce / complain so Autopilot
-- never resumes automated SMS or email outreach to them.

create table if not exists outreach_lead_quarantine (
  id text primary key,
  lead_slug text not null default '',
  channel text not null default 'any',
  destination text not null default '',
  reason text not null,
  source text not null default '',
  created_at timestamptz not null default now()
);

create unique index if not exists outreach_lead_quarantine_slug_uidx
  on outreach_lead_quarantine (lead_slug)
  where btrim(lead_slug) <> '';

create unique index if not exists outreach_lead_quarantine_dest_uidx
  on outreach_lead_quarantine (channel, lower(destination))
  where btrim(destination) <> '';

create index if not exists outreach_lead_quarantine_created_idx
  on outreach_lead_quarantine (created_at desc);

alter table outreach_lead_quarantine enable row level security;
