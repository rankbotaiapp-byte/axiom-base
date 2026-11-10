-- Primary Twilio recipient for paid tenants.
alter table public.tenants add column if not exists dispatch_phone text;
alter table public.tenants add column if not exists dispatch_phone_locked boolean not null default false;
