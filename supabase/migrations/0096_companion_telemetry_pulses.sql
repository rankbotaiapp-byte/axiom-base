-- Migration: 0096_companion_telemetry_pulses.sql
-- Description: Stores real-time companion telemetry pulses from Stripe and Twilio webhooks

create table if not exists public.companion_telemetry_pulses (
    id uuid default gen_random_uuid() primary key,
    shop_id text, -- optional tenant / shop scoping
    status text not null check (status in ('idle', 'good', 'warning', 'alert')),
    event_type text not null, -- e.g., 'stripe.trial.created', 'twilio.sms.failed'
    payload jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for fast 5-minute window queries ordered by recency
create index if not exists idx_companion_pulses_created_at
on public.companion_telemetry_pulses (created_at desc);

-- Enable RLS (Row Level Security)
alter table public.companion_telemetry_pulses enable row level security;

-- Allow anon + authenticated reads (companion hue has no PII) and webhook inserts
create policy "Allow read access for companion status"
on public.companion_telemetry_pulses
for select
to anon, authenticated
using (true);

create policy "Allow insert via service role or webhooks"
on public.companion_telemetry_pulses
for insert
to anon, authenticated, service_role
with check (true);
