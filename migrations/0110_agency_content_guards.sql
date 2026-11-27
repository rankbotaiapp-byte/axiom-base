-- Agency-grade daily content: durable asset uniqueness, owner ops notice kinds.

create table if not exists shop_publish_assets (
  shop_id text not null,
  asset_key text not null,
  still_url text not null default '',
  first_posted_at timestamptz not null default now(),
  last_posted_at timestamptz not null default now(),
  primary key (shop_id, asset_key)
);

create index if not exists shop_publish_assets_shop_idx
  on shop_publish_assets (shop_id, last_posted_at desc);

alter table shop_notifications drop constraint if exists shop_notifications_kind_check;
alter table shop_notifications add constraint shop_notifications_kind_check
  check (kind in (
    'booking_request',
    'booking_paid',
    'inquiry',
    'booking_confirmed',
    'social_reauth',
    'credits_empty'
  ));
