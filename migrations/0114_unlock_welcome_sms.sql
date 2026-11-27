-- Stamp the $1 unlock welcome SMS on shop + tenant so Stripe webhook retries
-- never send a second proof-of-life text.

alter table if exists shops
  add column if not exists welcome_sms_sent_at timestamptz;

alter table if exists tenants
  add column if not exists welcome_sms_sent_at timestamptz;

alter table if exists tenants
  add column if not exists owner_phone text not null default '';
