-- Dog walking and mobile detailing join the bookable niches.

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
  check (niche in (
    'location', 'field', 'studio', 'music', 'contractor', 'fitness', 'tattoo', 'guide',
    'salon', 'beauty', 'wellness', 'lessons', 'photo', 'pets', 'clean', 'practice',
    'counsel', 'events', 'trade', 'security', 'retail', 'combat', 'locksmith', 'firewood',
    'creator', 'entertainer', 'landscaper', 'foodtruck', 'dogwalk', 'detailer'
  ));
