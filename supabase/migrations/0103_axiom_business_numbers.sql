-- Mirror of migrations/0107_axiom_business_numbers.sql for Supabase-hosted Postgres.

create table if not exists public.axiom_phone_pool (
  e164 text primary key,
  status text not null default 'available' check (status in ('available', 'assigned', 'reserved')),
  shop_id text,
  assigned_at timestamptz,
  created_at timestamptz not null default now()
);

alter table if exists public.axiom_phone_pool enable row level security;

alter table if exists public.shops
  add column if not exists axiom_phone_number text not null default '';

alter table if exists public.shops
  add column if not exists axiom_phone_assigned_at timestamptz;

alter table if exists public.shops
  add column if not exists axiom_phone_status text not null default 'none';

alter table if exists public.shops
  add column if not exists axiom_welcome_sms_at timestamptz;

alter table if exists public.shop_billing
  add column if not exists twilio_number text not null default '';

alter table if exists public.shop_billing
  add column if not exists axiom_phone_assigned_at timestamptz;

alter table if exists public.shop_billing
  add column if not exists axiom_phone_status text not null default 'none';

alter table if exists public.tenants
  add column if not exists axiom_phone_number text;

alter table if exists public.tenants
  add column if not exists axiom_phone_assigned_at timestamptz;

alter table if exists public.tenants
  add column if not exists axiom_phone_status text;

create unique index if not exists shops_axiom_phone_number_uidx
  on public.shops (axiom_phone_number)
  where axiom_phone_number <> '';

create unique index if not exists axiom_phone_pool_shop_uidx
  on public.axiom_phone_pool (shop_id)
  where shop_id is not null;
