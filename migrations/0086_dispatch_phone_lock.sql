-- Contractor mobile locked after Stripe for Twilio booking alerts.
alter table shops add column if not exists dispatch_phone_locked boolean not null default false;
