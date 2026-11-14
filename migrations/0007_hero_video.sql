-- Per-tenant hero films. Bytes live here; shops.hero_video_url points at the public route.

create table if not exists shop_hero_videos (
  shop_id     text primary key references shops(id) on delete cascade,
  mime        text not null default 'video/mp4',
  data        bytea not null,
  updated_at  timestamptz not null default now()
);

alter table shop_hero_videos enable row level security;

drop policy if exists hero_video_owner on shop_hero_videos;
create policy hero_video_owner on shop_hero_videos
  for all using (is_shop_owner(shop_id))
  with check (is_shop_owner(shop_id));
