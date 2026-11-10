-- Tenant-selected historical hero loop (Hero Studio archive picker).
-- Mirrors shops.hero_video_url for storefront playback; kept as an explicit column
-- so admin picks land on a dedicated field without colliding with uploads.
alter table shops
  add column if not exists hero_background_loop text;

-- Backfill from the live storefront film when empty.
update shops
set hero_background_loop = hero_video_url
where coalesce(hero_background_loop, '') = ''
  and coalesce(hero_video_url, '') <> '';
