-- Merchant pricing lines. One row is one service for one shop.
-- Lead tables are not touched. Owners are the shops.owner_user_id already on file.
-- The table owner (the app connection) bypasses row level security, matching
-- the other shop tables. These policies bind the Supabase data API.

create table if not exists merchant_pricing_settings (
  id                   uuid primary key default gen_random_uuid(),
  shop_slug            text not null references shops (slug) on update cascade on delete cascade,
  service_name         text not null,
  pricing_type         text not null check (pricing_type in ('flat', 'deposit', 'tiered')),
  price_amount         numeric(12, 2) not null check (price_amount >= 0),
  active_deals_banner  text not null default '',
  updated_at           timestamptz not null default now(),
  unique (shop_slug, service_name)
);

create index if not exists merchant_pricing_settings_shop_idx
  on merchant_pricing_settings (shop_slug);

create or replace function merchant_pricing_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists merchant_pricing_settings_touch on merchant_pricing_settings;
create trigger merchant_pricing_settings_touch
  before update on merchant_pricing_settings
  for each row execute function merchant_pricing_touch_updated_at();

alter table merchant_pricing_settings enable row level security;

drop policy if exists merchant_pricing_owner_read on merchant_pricing_settings;
create policy merchant_pricing_owner_read on merchant_pricing_settings
  for select using (
    exists (
      select 1 from shops
      where shops.slug = merchant_pricing_settings.shop_slug
        and shops.owner_user_id = app_current_user_id()
    )
  );

drop policy if exists merchant_pricing_owner_insert on merchant_pricing_settings;
create policy merchant_pricing_owner_insert on merchant_pricing_settings
  for insert with check (
    exists (
      select 1 from shops
      where shops.slug = merchant_pricing_settings.shop_slug
        and shops.owner_user_id = app_current_user_id()
    )
  );

drop policy if exists merchant_pricing_owner_update on merchant_pricing_settings;
create policy merchant_pricing_owner_update on merchant_pricing_settings
  for update using (
    exists (
      select 1 from shops
      where shops.slug = merchant_pricing_settings.shop_slug
        and shops.owner_user_id = app_current_user_id()
    )
  )
  with check (
    exists (
      select 1 from shops
      where shops.slug = merchant_pricing_settings.shop_slug
        and shops.owner_user_id = app_current_user_id()
    )
  );

drop policy if exists merchant_pricing_owner_delete on merchant_pricing_settings;
create policy merchant_pricing_owner_delete on merchant_pricing_settings
  for delete using (
    exists (
      select 1 from shops
      where shops.slug = merchant_pricing_settings.shop_slug
        and shops.owner_user_id = app_current_user_id()
    )
  );

-- Supabase Auth sessions identify the owner with auth.uid(). That function
-- is absent on the local fallback, so those policies are added only there.
do $$
begin
  if to_regprocedure('auth.uid()') is null then
    return;
  end if;

  execute 'drop policy if exists merchant_pricing_auth_read on merchant_pricing_settings';
  execute $policy$
    create policy merchant_pricing_auth_read on merchant_pricing_settings
      for select using (
        exists (
          select 1 from shops
          where shops.slug = merchant_pricing_settings.shop_slug
            and shops.owner_user_id = auth.uid()::text
        )
      )
  $policy$;

  execute 'drop policy if exists merchant_pricing_auth_insert on merchant_pricing_settings';
  execute $policy$
    create policy merchant_pricing_auth_insert on merchant_pricing_settings
      for insert with check (
        exists (
          select 1 from shops
          where shops.slug = merchant_pricing_settings.shop_slug
            and shops.owner_user_id = auth.uid()::text
        )
      )
  $policy$;

  execute 'drop policy if exists merchant_pricing_auth_update on merchant_pricing_settings';
  execute $policy$
    create policy merchant_pricing_auth_update on merchant_pricing_settings
      for update using (
        exists (
          select 1 from shops
          where shops.slug = merchant_pricing_settings.shop_slug
            and shops.owner_user_id = auth.uid()::text
        )
      )
      with check (
        exists (
          select 1 from shops
          where shops.slug = merchant_pricing_settings.shop_slug
            and shops.owner_user_id = auth.uid()::text
        )
      )
  $policy$;

  execute 'drop policy if exists merchant_pricing_auth_delete on merchant_pricing_settings';
  execute $policy$
    create policy merchant_pricing_auth_delete on merchant_pricing_settings
      for delete using (
        exists (
          select 1 from shops
          where shops.slug = merchant_pricing_settings.shop_slug
            and shops.owner_user_id = auth.uid()::text
        )
      )
  $policy$;

  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select, insert, update, delete on merchant_pricing_settings to authenticated;
  end if;
end $$;
