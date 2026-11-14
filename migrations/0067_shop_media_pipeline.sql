-- Owner launch desk: branded stills and approved social drafts stay on the shop.

create table if not exists shop_media_assets (
  id text primary key,
  shop_id text not null,
  slot text not null,
  purpose text not null default '',
  caption text not null default '',
  mime text not null,
  data bytea not null,
  is_hero boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shop_media_assets_shop_idx
  on shop_media_assets (shop_id, created_at desc);

create table if not exists shop_social_posts (
  id text primary key,
  shop_id text not null,
  asset_id text,
  caption text not null,
  channels text not null default '[]',
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create index if not exists shop_social_posts_shop_idx
  on shop_social_posts (shop_id, created_at desc);
