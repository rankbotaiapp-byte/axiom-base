-- Tattoo shop niche. Same constraint dance as 0008 so an older check can be replaced.

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
  check (niche in ('location', 'field', 'studio', 'music', 'contractor', 'fitness', 'tattoo'));

update shops
set hero_video_url = '/media/clipper.mp4'
where niche = 'location'
  and coalesce(hero_video_url, '') in ('', '/media/barber-hero.mp4');
