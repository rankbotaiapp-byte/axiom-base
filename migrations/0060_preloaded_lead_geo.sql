-- Geography for preloaded lead search.
-- Constant defaults are metadata-only in Postgres 11+. Do not UPDATE the lead
-- table here: a full rewrite times out locally and rolls these columns back.

alter table preloaded_leads add column if not exists state text not null default '';
alter table preloaded_leads add column if not exists niche text not null default '';
alter table preloaded_leads add column if not exists zip_code text not null default '';
alter table preloaded_leads add column if not exists lat double precision;
alter table preloaded_leads add column if not exists lng double precision;
alter table preloaded_leads add column if not exists active boolean not null default true;
