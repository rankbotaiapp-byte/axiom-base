-- Master outbound funnel engine: pause switch, daily caps, and a live trickle log.

create table if not exists outbound_engine_state (
  id text primary key,
  paused boolean not null default true,
  strategy_id text not null default 'visual-hook',
  sms_daily_cap integer not null default 40,
  email_daily_cap integer not null default 80,
  sms_template text not null default '',
  email_subject text not null default '',
  email_body text not null default '',
  sms_sent_today integer not null default 0,
  email_sent_today integer not null default 0,
  day_key date not null default (timezone('America/Los_Angeles', now()))::date,
  updated_at timestamptz not null default now()
);

insert into outbound_engine_state (id)
values ('master')
on conflict (id) do nothing;

create table if not exists outbound_engine_log (
  id text primary key,
  county text not null default '',
  region text not null default '',
  channel text not null default 'email',
  status text not null default 'queued',
  lead_slug text not null default '',
  summary text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists outbound_engine_log_created_idx
  on outbound_engine_log (created_at desc);
