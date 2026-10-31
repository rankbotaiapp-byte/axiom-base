-- Production hardening: Brand DNA is not world-readable, AI credit balance
-- cannot go negative, and geo indexes from 0060 exist without a blocking ANALYZE.

drop policy if exists shop_branding_public_read on shop_branding;

do $$
begin
  alter table shop_ai_credits
    add constraint shop_ai_credits_balance_nonneg check (balance >= 0);
exception
  when duplicate_object then null;
  when undefined_table then null;
end $$;

create index if not exists preloaded_leads_state_county_niche_idx
  on preloaded_leads (state, lower(county), niche)
  where active and not claimed;

create index if not exists preloaded_leads_zip_code_idx
  on preloaded_leads (zip_code)
  where active and not claimed;

create index if not exists preloaded_leads_niche_active_idx
  on preloaded_leads (niche, created_at desc)
  where active and not claimed;
