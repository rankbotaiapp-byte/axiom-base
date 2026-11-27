-- Owner MMS routing, last-upload pointer, dedicated proof slots.

alter table if exists shops add column if not exists owner_phone text not null default '';
alter table if exists shops add column if not exists hero_media_url text not null default '';
alter table if exists shops add column if not exists hero_media_prev_url text not null default '';
alter table if exists shops add column if not exists last_mms_upload jsonb;
alter table if exists shops add column if not exists license_number text not null default '';
alter table if exists shops add column if not exists ad_tagline text not null default '';

update shops
set owner_phone = notify_phone
where coalesce(owner_phone, '') = ''
  and coalesce(notify_phone, '') <> '';

alter table if exists portfolio_items add column if not exists slot text not null default 'proof';
alter table if exists portfolio_items add column if not exists pair_key text not null default '';

create index if not exists portfolio_shop_slot_idx
  on portfolio_items (shop_id, slot, created_at desc);
