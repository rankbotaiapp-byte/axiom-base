-- Master tenant Autopilot flag. Cron ticks shops where this is true.
-- Backfill from the older AI-content switch so already-armed shops stay armed.

alter table if exists shops
  add column if not exists autopilot_active boolean not null default false;

do $$
begin
  update shops
    set autopilot_active = true
    where coalesce(ai_content_autopilot, false) = true
      and coalesce(autopilot_active, false) = false;
exception
  when undefined_column then null;
  when undefined_table then null;
end $$;
