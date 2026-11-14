-- Mobile locksmith and combat sports join the bookable niches.
-- Music shops still on the old stage film follow the new artist loop.

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
    'counsel', 'events', 'trade', 'security', 'retail', 'combat', 'locksmith', 'firewood'
  ));

update shops
set hero_video_url = '/media/heroes/music-artist.mp4'
where niche = 'music'
  and hero_video_url = '/media/music-hero.mp4';
