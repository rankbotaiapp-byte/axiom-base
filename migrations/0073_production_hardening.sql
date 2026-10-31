-- Production hardening: Brand DNA is not world-readable, AI credit balance
-- cannot go negative, Autopilot flag exists, and 0060 geo columns exist even
-- when that file was skipped. No table-wide UPDATE and no geo indexes here.

drop policy if exists shop_branding_public_read on shop_branding;

do $$
begin
  alter table shop_ai_credits
    add constraint shop_ai_credits_balance_nonneg check (balance >= 0);
exception
  when duplicate_object then null;
  when undefined_table then null;
end $$;

alter table if exists shops
  add column if not exists ai_content_autopilot boolean not null default false;

alter table if exists preloaded_leads add column if not exists state text not null default '';
alter table if exists preloaded_leads add column if not exists niche text not null default '';
alter table if exists preloaded_leads add column if not exists zip_code text not null default '';
alter table if exists preloaded_leads add column if not exists lat double precision;
alter table if exists preloaded_leads add column if not exists lng double precision;
alter table if exists preloaded_leads add column if not exists active boolean not null default true;
