-- Liquid orb genesis. Expands the hero effect list and stores the morph prompt.

alter table shops
  add column if not exists hero_effect_type text not null default 'smoke';

alter table shops
  add column if not exists hero_branding_tagline text not null default '';

alter table shops
  add column if not exists hero_prompt text not null default '';

alter table shops
  add column if not exists morph_duration_sec double precision not null default 4.5;

alter table shops drop constraint if exists shops_hero_effect_type_check;

alter table shops
  add constraint shops_hero_effect_type_check
  check (hero_effect_type in ('smoke', 'rain', 'water', 'snow', 'orb_genesis_transform'));
