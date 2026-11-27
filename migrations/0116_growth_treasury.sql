-- Autonomous growth engine: per-lead funnel telemetry, bandit variants, treasury caps.

create table if not exists lead_funnel_events (
  id            text primary key,
  lead_id       text not null,
  event         text not null
                check (event in (
                  'sent', 'clicked', 'dwell_ms', 'help_sim_used',
                  'checkout_opened', 'dollar_unlocked', 'mrr_active', 'unsubscribed'
                )),
  trade         text not null default '',
  state         text not null default '',
  city          text not null default '',
  variant_id    text not null default '',
  dwell_ms      integer not null default 0,
  revenue_cents integer not null default 0,
  meta          jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists lead_funnel_events_lead_idx
  on lead_funnel_events (lead_id, created_at desc);

create index if not exists lead_funnel_events_kind_idx
  on lead_funnel_events (event, created_at desc);

create index if not exists lead_funnel_events_geo_idx
  on lead_funnel_events (trade, state, variant_id, created_at desc);

create table if not exists growth_variant_stats (
  variant_id    text primary key,
  channel       text not null default 'outreach',
  alpha         double precision not null default 1,
  beta          double precision not null default 1,
  impressions   integer not null default 0,
  conversions   integer not null default 0,
  pending_approval boolean not null default false,
  updated_at    timestamptz not null default now()
);

create table if not exists growth_creatives (
  id            text primary key,
  variant_id    text not null,
  channel       text not null default 'public_ad',
  body          text not null default '',
  status        text not null default 'pending_approval'
                check (status in ('pending_approval', 'approved', 'rejected')),
  created_at    timestamptz not null default now()
);

create index if not exists growth_creatives_status_idx
  on growth_creatives (status, created_at desc);

create table if not exists growth_treasury_settings (
  id                      text primary key default 'platform',
  twilio_daily_cap_cents  integer not null default 4000,
  resend_daily_cap_cents  integer not null default 1000,
  ai_daily_cap_cents      integer not null default 2500,
  total_daily_cap_cents   integer not null default 6000,
  alert_phone             text not null default '',
  paused                  boolean not null default false,
  pause_reason            text not null default '',
  updated_at              timestamptz not null default now()
);

insert into growth_treasury_settings (id)
values ('platform')
on conflict (id) do nothing;
