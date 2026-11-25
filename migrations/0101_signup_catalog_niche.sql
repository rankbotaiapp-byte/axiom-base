-- Signup used niche 'trade', which 0065 removed from shops_niche_check.
-- New accounts now open on the catalog niche 'contractor'.

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
    shop_key, shop_slug, shop_name, 'contractor', new.id::text, signup_email, 'generated', false
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
