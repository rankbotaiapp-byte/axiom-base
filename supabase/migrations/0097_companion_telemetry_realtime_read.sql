-- Migration: 0097_companion_telemetry_realtime_read.sql
-- Description: RLS read for anon/authenticated + enable companion_telemetry_pulses on supabase_realtime

-- Drop prior read policies so this migration is re-runnable
drop policy if exists "Allow read access for authenticated users" on public.companion_telemetry_pulses;
drop policy if exists "Allow read access for companion status" on public.companion_telemetry_pulses;

-- Companion hue pulses are operational status only (no PII)
create policy "Allow read access for companion status"
on public.companion_telemetry_pulses
for select
to anon, authenticated
using (true);

-- Publish table changes to Realtime (idempotent)
do $$
begin
  alter publication supabase_realtime add table public.companion_telemetry_pulses;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
