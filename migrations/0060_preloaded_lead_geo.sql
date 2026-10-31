-- Geography for preloaded lead search.
-- Local queries use (state, county, niche) and (zip_code), then a mile radius.
-- County is matched case-insensitively, same as the desk. Distance is Haversine
-- on lat/lng. Indexes live in 0074 so a large table cannot roll these columns back.

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
