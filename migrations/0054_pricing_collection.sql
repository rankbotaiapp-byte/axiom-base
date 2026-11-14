-- Pricing collection mode, package prices, and Connect verification status.
-- Does not change preloaded_leads or registry tables.

alter table merchant_pricing_settings
  add column if not exists collection_mode text not null default 'online';

do $$
declare
  cons text;
begin
  select con.conname into cons
  from pg_constraint con
  where con.conrelid = 'merchant_pricing_settings'::regclass
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%pricing_type%';
  if cons is not null then
    execute format('alter table merchant_pricing_settings drop constraint %I', cons);
  end if;
end $$;

alter table merchant_pricing_settings
  drop constraint if exists merchant_pricing_settings_pricing_type_check;

alter table merchant_pricing_settings
  add constraint merchant_pricing_settings_pricing_type_check
  check (pricing_type in ('flat', 'deposit', 'package', 'tiered'));

alter table merchant_pricing_settings
  drop constraint if exists merchant_pricing_settings_collection_mode_check;

alter table merchant_pricing_settings
  add constraint merchant_pricing_settings_collection_mode_check
  check (collection_mode in ('online', 'in_person'));

alter table shop_billing
  add column if not exists stripe_connect_status text not null default 'none';

update shop_billing
set stripe_connect_status = 'active'
where stripe_account_id is not null
  and stripe_charges_enabled
  and stripe_connect_status = 'none';

update shop_billing
set stripe_connect_status = 'pending'
where stripe_account_id is not null
  and not stripe_charges_enabled
  and stripe_connect_status = 'none';
