-- When Supabase Auth creates a user, open a shop profile and record it on tenants.
-- The function is skipped on databases that do not have auth.users.

create table if not exists public.tenants (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique,
  email       text not null default '',
  shop_id     text unique references shops(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create index if not exists tenants_email_idx on public.tenants (lower(email));

alter table public.tenants enable row level security;

drop policy if exists tenants_self_read on public.tenants;
create policy tenants_self_read on public.tenants
  for select using (user_id::text = app_current_user_id());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  signup_email text;
  shop_name text;
  shop_slug text;
  shop_key text;
begin
  signup_email := coalesce(new.email, '');
  shop_name := coalesce(
    nullif(btrim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data->>'name'), ''),
    nullif(split_part(signup_email, '@', 1), ''),
    'New shop'
  );
  shop_name := left(shop_name, 80);

  shop_slug := lower(regexp_replace(shop_name, '[^a-zA-Z0-9]+', '-', 'g'));
  shop_slug := btrim(shop_slug, '-');
  if shop_slug = '' then
    shop_slug := 'shop';
  end if;
  shop_slug := left(shop_slug, 40);
  shop_key := 'shop_' || substr(replace(new.id::text, '-', ''), 1, 16);
  if exists (select 1 from shops where slug = shop_slug and id <> shop_key) then
    shop_slug := left(shop_slug, 40) || '-' || substr(replace(new.id::text, '-', ''), 1, 4);
  end if;

  insert into shops (
    id, slug, name, niche, owner_user_id, notify_email, onboarding_step, is_showcase
  ) values (
    shop_key, shop_slug, shop_name, 'trade', new.id::text, signup_email, 'generated', false
  )
  on conflict (id) do update
    set notify_email = excluded.notify_email
    where shops.notify_email = '';

  insert into shop_members (shop_id, user_id, role)
  values (shop_key, new.id::text, 'owner')
  on conflict (shop_id, user_id) do nothing;

  insert into shop_billing (shop_id)
  values (shop_key)
  on conflict (shop_id) do nothing;

  insert into public.tenants (user_id, email, shop_id)
  values (new.id, signup_email, shop_key)
  on conflict (user_id) do update
    set email = excluded.email,
        shop_id = coalesce(public.tenants.shop_id, excluded.shop_id);

  return new;
end;
$$;

do $$
begin
  if to_regclass('auth.users') is null then
    raise notice 'auth.users is absent; handle_new_user is installed without a trigger';
    return;
  end if;

  if to_regprocedure('auth.uid()') is not null then
    execute 'drop policy if exists tenants_auth_read on public.tenants';
    execute $policy$
      create policy tenants_auth_read on public.tenants
        for select using (user_id = auth.uid())
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'tenants_user_id_fkey'
      and conrelid = 'public.tenants'::regclass
  ) then
    alter table public.tenants
      add constraint tenants_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;

  drop trigger if exists on_auth_user_created on auth.users;
  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
end $$;
