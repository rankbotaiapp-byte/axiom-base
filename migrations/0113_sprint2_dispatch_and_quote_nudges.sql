-- Sprint 2: OMW dispatch, Day-1 onboarding capture, 24h unpaid quote nudges.
-- Additive / idempotent. Canonical booking table is appointments; quotes live on shop_quotes.

alter table if exists appointments
  add column if not exists dispatched_at timestamptz;

alter table if exists appointments
  add column if not exists eta_minutes integer;

alter table if exists shop_quotes
  add column if not exists nudge_sent_at timestamptz;

alter table if exists shop_quotes
  add column if not exists expires_at timestamptz;

alter table if exists shops
  add column if not exists owner_phone text not null default '';

alter table if exists shops
  add column if not exists google_review_url text not null default '';

alter table if exists shops
  add column if not exists onboarding_completed_at timestamptz;

alter table if exists shops
  add column if not exists welcome_sms_sent_at timestamptz;

alter table if exists shops
  add column if not exists service_hours_start text not null default '07:00';

alter table if exists shops
  add column if not exists service_hours_end text not null default '19:00';

alter table if exists shops
  add column if not exists shop_timezone text not null default 'America/Los_Angeles';

alter table if exists tenants
  add column if not exists owner_phone text not null default '';

alter table if exists tenants
  add column if not exists google_review_url text not null default '';

alter table if exists tenants
  add column if not exists onboarding_completed_at timestamptz;

do $$
begin
  alter table appointments drop constraint if exists appointments_status_check;
exception
  when undefined_object then null;
end $$;

alter table appointments drop constraint if exists appointments_status_check;
alter table appointments
  add constraint appointments_status_check
  check (status in ('pending', 'confirmed', 'en_route', 'completed', 'cancelled'));

drop index if exists appointments_no_double_booking;
create unique index if not exists appointments_no_double_booking
  on appointments (employee_id, starts_at)
  where status in ('pending', 'confirmed', 'en_route');

do $$
begin
  alter table shop_quotes drop constraint if exists shop_quotes_status_check;
exception
  when undefined_object then null;
end $$;

alter table shop_quotes drop constraint if exists shop_quotes_status_check;
alter table shop_quotes
  add constraint shop_quotes_status_check
  check (status in ('draft', 'pending', 'sent', 'deposit_paid', 'paid', 'void'));

create index if not exists quotes_pending_nudge_idx
  on shop_quotes (status, created_at)
  where status = 'pending' and nudge_sent_at is null;

create index if not exists shop_quotes_sent_nudge_idx
  on shop_quotes (status, created_at)
  where status = 'sent' and nudge_sent_at is null;

create or replace view quotes as
  select * from shop_quotes;
