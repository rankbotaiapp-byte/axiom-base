-- public.app_settings — studio FX, global library, and landing config.
-- Live readers still key rows by setting_key / setting_value.
-- slug, shop_slug, settings, assets, and updated_at are the row shape the
-- studio admin writes alongside that key.

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid()
);

alter table public.app_settings
  add column if not exists setting_key text,
  add column if not exists setting_value jsonb,
  add column if not exists slug text,
  add column if not exists shop_slug text,
  add column if not exists settings jsonb default '{}'::jsonb,
  add column if not exists assets jsonb default '{}'::jsonb,
  add column if not exists updated_at timestamptz default timezone('utc', now());

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'app_settings'
      and column_name = 'id' and udt_name = 'uuid'
  ) then
    update public.app_settings set id = gen_random_uuid() where id is null;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'app_settings'
      and column_name = 'settings' and udt_name = 'jsonb'
  ) then
    update public.app_settings set settings = '{}'::jsonb where settings is null;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'app_settings'
      and column_name = 'assets' and udt_name = 'jsonb'
  ) then
    update public.app_settings set assets = '{}'::jsonb where assets is null;
  end if;
  update public.app_settings set updated_at = timezone('utc', now()) where updated_at is null;
end $$;

alter table public.app_settings alter column settings set default '{}'::jsonb;
alter table public.app_settings alter column assets set default '{}'::jsonb;
alter table public.app_settings alter column updated_at set default timezone('utc', now());

-- Best-effort backfill. A text setting_value or a bad JSON row must not block the table.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'app_settings'
      and column_name = 'setting_value'
      and udt_name = 'jsonb'
  ) then
    update public.app_settings
    set settings = case
      when jsonb_typeof(setting_value) = 'object' then setting_value
      when jsonb_typeof(setting_value) = 'string'
        and left(btrim(setting_value #>> '{}'), 1) = '{'
        then (setting_value #>> '{}')::jsonb
      else settings
    end
    where settings = '{}'::jsonb
      and setting_value is not null;
  elsif exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'app_settings'
      and column_name = 'setting_value'
      and data_type = 'text'
  ) then
    update public.app_settings
    set settings = setting_value::jsonb
    where settings = '{}'::jsonb
      and setting_value is not null
      and btrim(setting_value) like '{%';
  end if;
exception
  when others then
    null;
end $$;

update public.app_settings
set
  slug = coalesce(
    slug,
    substring(setting_key from ':(.+)$'),
    case when setting_key = 'axiom_studio_global' then 'global' else null end
  ),
  shop_slug = coalesce(
    shop_slug,
    substring(setting_key from 'axiom_studio_fx:(.+)$'),
    substring(setting_key from 'axiom_landing:(.+)$')
  )
where setting_key is not null
  and (slug is null or shop_slug is null);

delete from public.app_settings a
using public.app_settings b
where a.ctid < b.ctid
  and a.setting_key is not null
  and a.setting_key = b.setting_key;

create unique index if not exists app_settings_setting_key_uidx
  on public.app_settings (setting_key);

create index if not exists app_settings_shop_slug_idx
  on public.app_settings (shop_slug);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.app_settings'::regclass
      and contype = 'p'
  )
  and not exists (
    select 1 from public.app_settings group by id having count(*) > 1
  ) then
    alter table public.app_settings add primary key (id);
  end if;
exception
  when others then
    null;
end $$;

create or replace function public.touch_app_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

revoke all on function public.touch_app_settings_updated_at() from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on function public.touch_app_settings_updated_at() from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on function public.touch_app_settings_updated_at() from authenticated;
  end if;
end $$;

drop trigger if exists app_settings_set_updated_at on public.app_settings;
create trigger app_settings_set_updated_at
  before update on public.app_settings
  for each row
  execute function public.touch_app_settings_updated_at();

alter table public.app_settings enable row level security;

-- Public landing + studio frames subscribe with the anon key.
drop policy if exists "app_settings_public_read" on public.app_settings;
drop policy if exists "axiom studio fx public read" on public.app_settings;
drop policy if exists "axiom landing public read" on public.app_settings;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon')
     and exists (select 1 from pg_roles where rolname = 'authenticated') then
    create policy "app_settings_public_read"
      on public.app_settings
      for select
      to anon, authenticated
      using (
        setting_key like 'axiom_studio_%'
        or setting_key like 'axiom_landing:%'
      );
  else
    create policy "app_settings_public_read"
      on public.app_settings
      for select
      using (
        setting_key like 'axiom_studio_%'
        or setting_key like 'axiom_landing:%'
      );
  end if;
end $$;

-- Shop owners may write their own studio frame. The global library stays on the service role.
-- Studio admin API routes use the service role, which bypasses RLS.
do $$
begin
  if to_regclass('public.shops') is null then
    return;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    return;
  end if;
  if not exists (select 1 from pg_namespace where nspname = 'auth') then
    return;
  end if;
  drop policy if exists "app_settings_owner_write" on public.app_settings;
  create policy "app_settings_owner_write"
    on public.app_settings
    for all
    to authenticated
    using (
      shop_slug is not null
      and exists (
        select 1
        from public.shops
        where shops.slug = app_settings.shop_slug
          and shops.owner_user_id = auth.uid()::text
      )
    )
    with check (
      shop_slug is not null
      and setting_key = 'axiom_studio_fx:' || shop_slug
      and exists (
        select 1
        from public.shops
        where shops.slug = app_settings.shop_slug
          and shops.owner_user_id = auth.uid()::text
      )
    );
exception
  when undefined_table or undefined_column or undefined_function or insufficient_privilege then
    null;
end $$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on public.app_settings to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select, insert, update, delete on public.app_settings to authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant select, insert, update, delete on public.app_settings to service_role;
  end if;
end $$;

do $$
begin
  execute 'alter table public.app_settings replica identity full';
exception
  when insufficient_privilege or feature_not_supported then
    null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.app_settings;
exception
  when duplicate_object or undefined_object then
    null;
end $$;

-- PostgREST hides new tables until this runs. Delivered when the migration commits.
notify pgrst, 'reload schema';
