-- Carrier/inbox telemetry for the self-correction loop.
-- Unowned operational rows (master outreach health), not per-visitor PII.

create table if not exists outreach_telemetry_logs (
  id text primary key,
  provider text not null,
  channel text not null,
  event_type text not null,
  error_code text not null default '',
  identity text not null default '',
  destination text not null default '',
  message_sid text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists outreach_telemetry_logs_created_idx
  on outreach_telemetry_logs (created_at desc);
create index if not exists outreach_telemetry_logs_identity_idx
  on outreach_telemetry_logs (channel, identity, created_at desc);
create index if not exists outreach_telemetry_logs_sid_idx
  on outreach_telemetry_logs (message_sid);

create table if not exists outreach_send_identities (
  id text primary key,
  channel text not null,
  identity text not null,
  role text not null default 'primary',
  status text not null default 'active',
  pause_reason text not null default '',
  paused_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (channel, identity)
);

create table if not exists outreach_dataset_chunks (
  id text primary key,
  niche text not null default 'plumbing',
  status text not null default 'active',
  pause_reason text not null default '',
  paused_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists outreach_health_state (
  id text primary key,
  min_delay_seconds integer not null default 45,
  max_delay_seconds integer not null default 90,
  last_hour_key text not null default '',
  last_evaluated_at timestamptz,
  previous_error_rate double precision not null default 0,
  previous_conversion_velocity double precision not null default 0,
  sms_violation_rate double precision not null default 0,
  email_bounce_rate double precision not null default 0,
  conversion_velocity double precision not null default 0,
  error_rate double precision not null default 0,
  dataset_status text not null default 'active',
  updated_at timestamptz not null default now()
);

create table if not exists outreach_health_adjustments (
  id text primary key,
  rule text not null,
  summary text not null,
  detail text not null default '',
  min_delay_seconds integer,
  max_delay_seconds integer,
  created_at timestamptz not null default now()
);

create index if not exists outreach_health_adjustments_created_idx
  on outreach_health_adjustments (created_at desc);

insert into outreach_health_state (id)
values ('master')
on conflict (id) do nothing;

insert into outreach_dataset_chunks (id, niche, status)
values ('plumbing-current', 'plumbing', 'active')
on conflict (id) do nothing;
