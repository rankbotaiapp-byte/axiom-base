-- Lock shops.niche to the verified 21-loop catalog.
-- Drop the legacy check first. Updating axiom-auto from `field` to `auto`
-- while shops_niche_check still lists only pre-catalog values (0051) raises
-- 23514 and rolls the whole file back.

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

update shops set niche = 'auto' where niche in ('field', 'detailer');
update shops set niche = 'barber' where niche in ('location', 'salon', 'beauty');
update shops set niche = 'bow-tech' where niche in ('bowtech');
update shops set niche = 'canine' where niche in ('pets', 'dogwalk');
update shops set niche = 'contractor' where niche in ('events', 'prompt');
update shops set niche = 'electrical' where niche in ('locksmith');
update shops set niche = 'fabrication' where niche in ('creator', 'music', 'entertainer', 'retail');
update shops set niche = 'forestry' where niche in ('firewood');
update shops set niche = 'glasswork' where niche in ('photo', 'studio');
update shops set niche = 'hvac' where niche in ('clean');
update shops set niche = 'landscaping' where niche in ('landscaper', 'guide');
update shops set niche = 'machining' where niche = 'trade';
update shops set niche = 'power-sports' where niche in ('lessons');
update shops set niche = 'roofing' where niche in ('combat');
update shops set niche = 'stone-masonry' where niche in ('hunting');
update shops set niche = 'taxidermy' where niche in ('tattoo');
update shops set niche = 'tool-repair' where niche in ('fitness', 'therapy');
update shops set niche = 'water-systems' where niche in ('foodtruck');
update shops set niche = 'woodworking' where niche in ('wellness', 'practice', 'counsel');

-- Anything still outside the catalog falls back to contractor.
update shops
set niche = 'contractor'
where niche not in (
  'auto','barber','bow-tech','canine','contractor','electrical','fabrication','forestry',
  'glasswork','hvac','landscaping','machining','plumbing','power-sports','roofing','security',
  'stone-masonry','taxidermy','tool-repair','water-systems','woodworking'
);

do $$
begin
  alter table shops add constraint shops_niche_check
    check (niche in (
      'auto', 'barber', 'bow-tech', 'canine', 'contractor', 'electrical', 'fabrication',
      'forestry', 'glasswork', 'hvac', 'landscaping', 'machining', 'plumbing', 'power-sports',
      'roofing', 'security', 'stone-masonry', 'taxidermy', 'tool-repair', 'water-systems',
      'woodworking'
    ));
exception
  when duplicate_object then null;
end $$;
