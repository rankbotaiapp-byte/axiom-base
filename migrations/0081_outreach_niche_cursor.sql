-- Master Autopilot niche-by-niche cursor + manual/cron dispatch controls.

alter table outbound_engine_state
  add column if not exists active_niche text not null default '';

alter table outbound_engine_state
  add column if not exists cron_enabled boolean not null default false;

alter table outbound_engine_state
  add column if not exists schedule_started_on date;

comment on column outbound_engine_state.active_niche is
  'Catalog niche currently staged (Day 1 plumbing → electrical → auto → contractor).';

comment on column outbound_engine_state.cron_enabled is
  'When true, outreach cron may tick autonomously; when false, wait for manual Dispatch.';

comment on column outbound_engine_state.schedule_started_on is
  'Pacific date the day-by-day niche slate began (Day 1 = Plumbing).';
