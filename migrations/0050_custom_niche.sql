-- A typed niche title lives on the shop and on the tenant row.
-- Shared hero files stay untouched. Shop uploads stay in shop_hero_videos.

alter table shops add column if not exists custom_niche text not null default '';

alter table tenants add column if not exists custom_niche text not null default '';
