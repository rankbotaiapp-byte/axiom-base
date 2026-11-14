-- Hero branding studio.
-- shops.hero_image_url and shops.hero_video_url already exist.
-- Still bytes live in shop_hero_stills; the shop row stores the public route.

alter table shops
  add column if not exists hero_effect_type text not null default 'smoke';

alter table shops
  add column if not exists hero_branding_tagline text not null default '';

alter table shops drop constraint if exists shops_hero_effect_type_check;

alter table shops
  add constraint shops_hero_effect_type_check
  check (hero_effect_type in ('smoke', 'rain', 'water', 'snow'));

create table if not exists shop_hero_stills (
  shop_id     text primary key references shops(id) on delete cascade,
  mime        text not null default 'image/jpeg',
  data        bytea not null,
  updated_at  timestamptz not null default now()
);

alter table shop_hero_stills enable row level security;

drop policy if exists hero_still_owner on shop_hero_stills;
create policy hero_still_owner on shop_hero_stills
  for all using (is_shop_owner(shop_id))
  with check (is_shop_owner(shop_id));
