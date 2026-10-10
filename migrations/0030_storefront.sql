-- Per-shop storefront: theme, neon accent, glow, and section order.
-- Hero films stay on shops.hero_video_url and shop_hero_videos.
-- This is the Postgres schema. Point DATABASE_URL at a Supabase pooler to keep the same tables.

alter table shops add column if not exists theme_profile text not null default '';
alter table shops add column if not exists neon_accent text not null default '';
alter table shops add column if not exists glow_enabled boolean not null default true;
alter table shops add column if not exists layout_json text not null default '["staff","estimate","menu"]';

alter table employees add column if not exists availability_json text not null default '';
