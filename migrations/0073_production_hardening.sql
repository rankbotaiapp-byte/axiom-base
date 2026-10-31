-- Production hardening: Brand DNA is not world-readable, AI credit balance
-- cannot go negative, and geo columns from 0060 exist even when that file
-- timed out (local skip rolls the whole 0060 transaction back).

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

do $$
begin
  update preloaded_leads
  set niche = trade_type
  where niche = ''
    and trade_type <> '';
exception
  when undefined_table then null;
  when undefined_column then null;
end $$;
