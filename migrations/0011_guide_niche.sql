-- Guide outfit niche, and a charge unit so a price can be per person or per boat.
-- Existing menus get the section labels a customer would expect for that trade.

alter table services add column if not exists price_unit text not null default 'flat';

do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'shops'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%niche%'
  loop
    execute format('alter table shops drop constraint %I', r.conname);
  end loop;
end $$;

alter table shops add constraint shops_niche_check
  check (niche in ('location', 'field', 'studio', 'music', 'contractor', 'fitness', 'tattoo', 'guide'));

alter table services drop constraint if exists services_price_unit_check;
alter table services add constraint services_price_unit_check
  check (price_unit in ('flat', 'person', 'boat'));

update services set group_label = 'Booth', sort_order = 3 where id = 'svc_ll_feature';
update services set group_label = 'Stage', sort_order = 4 where id = 'svc_ll_live';
update services set group_label = 'Booth' where id = 'svc_ll_session';

update services set group_label = 'Cut' where id in ('svc_sals_cut', 'svc_sals_fade');
update services set group_label = 'Razor' where id in ('svc_sals_shave', 'svc_sals_beard');

update services set group_label = 'At the curb' where id in ('svc_dg_diag', 'svc_dg_mobile');
update services set group_label = 'In the bay' where id in ('svc_dg_oil', 'svc_dg_brakes');

update services set group_label = 'Start' where id = 'svc_apps_disc';
update services set group_label = 'Build' where id in ('svc_apps_launch', 'svc_apps_console', 'svc_apps_ring');
