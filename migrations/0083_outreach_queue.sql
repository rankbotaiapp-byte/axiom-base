-- Per-message outreach queue with anti-spam statuses and Pacific-day scheduling.

create table if not exists outreach_queue (
  id              text primary key,
  business_name   text not null default '',
  phone           text not null default '',
  email           text not null default '',
  niche           text not null default '',
  channel         text not null check (channel in ('sms', 'email')),
  status          text not null default 'pending'
                    check (status in ('pending', 'sent', 'failed', 'rate_limited')),
  scheduled_for   timestamptz not null default now(),
  sent_at         timestamptz,
  lead_slug       text not null default '',
  campaign_id     text not null default '',
  detail          text not null default '',
  created_at      timestamptz not null default now()
);

create index if not exists outreach_queue_due_idx
  on outreach_queue (status, channel, scheduled_for);

create index if not exists outreach_queue_sent_idx
  on outreach_queue (channel, sent_at desc);

alter table outreach_queue enable row level security;
