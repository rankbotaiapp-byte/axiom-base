-- Master lead verification, media health, and prime Autopilot scoring.
-- Additive on 0103_lead_visual_hero. Does not rewrite earlier lead tables.

alter table if exists preloaded_leads
  add column if not exists phone_e164 text not null default '';

alter table if exists preloaded_leads
  add column if not exists line_type text not null default 'unknown';

alter table if exists preloaded_leads
  add column if not exists carrier_name text not null default '';

alter table if exists preloaded_leads
  add column if not exists verified_caller_name text not null default '';

alter table if exists preloaded_leads
  add column if not exists phone_verified_at timestamptz;

alter table if exists preloaded_leads
  add column if not exists hero_image_status text not null default 'unchecked';

alter table if exists preloaded_leads
  add column if not exists hero_image_width integer;

alter table if exists preloaded_leads
  add column if not exists prime_score integer not null default 0;

alter table if exists preloaded_leads
  add column if not exists qa_approved boolean not null default false;

alter table if exists preloaded_leads
  add column if not exists qa_notes text not null default '';

create index if not exists idx_preloaded_leads_prime_autopilot
  on preloaded_leads (niche, state, prime_score desc, qa_approved);
