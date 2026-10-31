-- Tenant film HUD: slug lookups join shops.id. Visitors may read. Only the app role writes.

alter table if exists shop_hero_config
  add column if not exists shop_id text;

do $$
begin
  alter table shop_hero_config
    add constraint shop_hero_config_shop_id_fkey
    foreign key (shop_id) references shops(id) on delete cascade;
exception
  when duplicate_object then null;
  when undefined_table then null;
end
$$;

create index if not exists shop_hero_config_shop_id_idx on shop_hero_config (shop_id);

drop policy if exists shop_hero_config_public_read on shop_hero_config;
create policy shop_hero_config_public_read
  on shop_hero_config
  for select
  using (true);

drop policy if exists shop_hero_config_public_write on shop_hero_config;
