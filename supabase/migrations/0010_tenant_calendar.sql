-- Live voice receptionist bookings (Twilio → inbound-voice-agent → book_appointment).

create table if not exists public.tenant_calendar (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  shop_id text,
  customer_name text not null default 'Caller',
  customer_phone text not null default '',
  starts_at timestamptz not null,
  service_name text not null default 'Service call',
  price_cents integer not null default 0,
  notes text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  source text not null default 'voice_ai',
  created_at timestamptz not null default now()
);

create index if not exists tenant_calendar_starts_idx on public.tenant_calendar (starts_at desc);
create index if not exists tenant_calendar_tenant_idx on public.tenant_calendar (tenant_id);
create index if not exists tenant_calendar_shop_idx on public.tenant_calendar (shop_id);

alter table public.tenant_calendar enable row level security;

alter table public.tenants add column if not exists trade text;
alter table public.tenants add column if not exists phone text;
