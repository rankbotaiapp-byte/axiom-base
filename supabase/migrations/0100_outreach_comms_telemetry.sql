-- Companion conversation log + booking reminders for Twilio/Resend pipeline.

create table if not exists public.companion_conversations (
  id text primary key,
  shop_id text,
  channel text not null,
  direction text not null,
  from_phone text not null default '',
  to_phone text not null default '',
  body text not null default '',
  status text not null default 'received',
  provider_ref text,
  kind text not null default 'inbound_inquiry',
  created_at timestamptz not null default now()
);

create index if not exists companion_conversations_shop_idx
  on public.companion_conversations (shop_id, created_at desc);

create table if not exists public.booking_reminders (
  id text primary key,
  shop_id text,
  phone text not null,
  starts_at timestamptz not null,
  status text not null default 'pending',
  body text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists booking_reminders_pending_idx
  on public.booking_reminders (status, starts_at);

alter table if exists public.outreach_dispatches
  add column if not exists batch_id text;

alter table if exists public.outreach_dispatches
  add column if not exists mode text;

alter table if exists public.outreach_dispatches
  add column if not exists meta jsonb not null default '{}'::jsonb;
