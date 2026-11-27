-- Track (a): booked-job guards. Additive. No data rewrite.

create table if not exists stripe_events (
  id         text primary key,
  created_at timestamptz not null default now()
);

alter table if exists consumer_leads
  add column if not exists idempotency_key text;

alter table if exists consumer_leads
  add column if not exists twilio_message_sid text;

alter table if exists consumer_leads
  add column if not exists booking_fingerprint text;

create unique index if not exists consumer_leads_idempotency_key_idx
  on consumer_leads (idempotency_key)
  where idempotency_key is not null and idempotency_key <> '';

create unique index if not exists consumer_leads_twilio_message_sid_idx
  on consumer_leads (twilio_message_sid)
  where twilio_message_sid is not null and twilio_message_sid <> '';

create unique index if not exists consumer_leads_booking_fingerprint_idx
  on consumer_leads (booking_fingerprint)
  where booking_fingerprint is not null and booking_fingerprint <> '';

alter table if exists shop_notifications
  add column if not exists retry_count integer not null default 0;

create index if not exists shop_notifications_failed_retry_idx
  on shop_notifications (created_at asc)
  where status = 'failed' and retry_count < 3;
