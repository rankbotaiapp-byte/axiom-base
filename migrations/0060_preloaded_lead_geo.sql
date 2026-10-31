-- Geography for preloaded lead search.
-- Local queries use (state, county, niche) and (zip_code), then a mile radius.
-- County is matched case-insensitively, same as the desk, so the composite
-- index keys lower(county). Distance is Haversine on lat/lng. PostGIS is not
-- enabled on the in-memory database, and this expression runs on both.

alter table preloaded_leads add column if not exists state text not null default '';
alter table preloaded_leads add column if not exists niche text not null default '';
alter table preloaded_leads add column if not exists zip_code text not null default '';
alter table preloaded_leads add column if not exists lat double precision;
alter table preloaded_leads add column if not exists lng double precision;
alter table preloaded_leads add column if not exists active boolean not null default true;

update preloaded_leads
set niche = trade_type
where niche = ''
  and trade_type <> '';

create index if not exists preloaded_leads_state_county_niche_idx
  on preloaded_leads (state, lower(county), niche)
  where active and not claimed;

create index if not exists preloaded_leads_zip_code_idx
  on preloaded_leads (zip_code)
  where active and not claimed;

create index if not exists preloaded_leads_niche_active_idx
  on preloaded_leads (niche, created_at desc)
  where active and not claimed;
