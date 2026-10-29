-- Lock shops.niche to the verified 21-loop catalog.
-- Legacy niche values are remapped before the check is re-applied.

update shops set niche = 'auto' where niche in ('field', 'detailer');
update shops set niche = 'barber' where niche in ('location', 'salon', 'beauty');
update shops set niche = 'bow-tech' where niche in ('bowtech');
update shops set niche = 'canine' where niche in ('pets', 'dogwalk');
update shops set niche = 'contractor' where niche in ('events', 'prompt', 'trade') and niche not in (
  select unnest(array[
    'auto','barber','bow-tech','canine','contractor','electrical','fabrication','forestry',
    'glasswork','hvac','landscaping','machining','plumbing','power-sports','roofing','security',
    'stone-masonry','taxidermy','tool-repair','water-systems','woodworking'
  ])
);
update shops set niche = 'electrical' where niche in ('locksmith');
update shops set niche = 'fabrication' where niche in ('creator', 'music', 'entertainer', 'retail');
update shops set niche = 'forestry' where niche in ('firewood', 'hunting');
update shops set niche = 'glasswork' where niche in ('photo', 'studio');
update shops set niche = 'hvac' where niche in ('clean');
update shops set niche = 'landscaping' where niche in ('landscaper', 'guide');
update shops set niche = 'machining' where niche = 'trade';
update shops set niche = 'plumbing' where niche = 'landscaper' and hero_video_url ilike '%plumbers%';
update shops set niche = 'power-sports' where niche in ('lessons');
update shops set niche = 'roofing' where niche in ('combat');
update shops set niche = 'stone-masonry' where niche in ('hunting') and niche <> 'forestry';
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
    'auto', 'barber', 'bow-tech', 'canine', 'contractor', 'electrical', 'fabrication',
    'forestry', 'glasswork', 'hvac', 'landscaping', 'machining', 'plumbing', 'power-sports',
    'roofing', 'security', 'stone-masonry', 'taxidermy', 'tool-repair', 'water-systems',
    'woodworking'
  ));
