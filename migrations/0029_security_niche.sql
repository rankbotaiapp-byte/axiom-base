-- Private security joins the bookable niches.

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
    'counsel', 'events', 'trade', 'security'
  ));

update shops
set hero_video_url = '/media/heroes/tiger-deer.mp4'
where niche = 'fitness'
  and coalesce(hero_video_url, '') in ('', '/media/tiger.mp4');

update shops
set hero_video_url = '/media/heroes/welding-trade.mp4'
where niche = 'trade'
  and coalesce(hero_video_url, '') = ''
  and hero_image_url in ('/media/heroes/trade.jpg', '/media/heroes/trade.svg');
