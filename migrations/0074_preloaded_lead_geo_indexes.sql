-- Partial geo indexes for unclaimed active leads.
-- Local boot may skip this file on statement_timeout; columns already exist
-- from 0060 / 0073 so queries still resolve.

create index if not exists preloaded_leads_state_county_niche_idx
  on preloaded_leads (state, lower(county), niche)
  where active and not claimed;

create index if not exists preloaded_leads_zip_code_idx
  on preloaded_leads (zip_code)
  where active and not claimed;

create index if not exists preloaded_leads_niche_active_idx
  on preloaded_leads (niche, created_at desc)
  where active and not claimed;
