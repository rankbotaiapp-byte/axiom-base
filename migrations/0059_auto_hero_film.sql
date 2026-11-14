-- The auto tenant streams the finished portal-to-cockpit film.
update shops
set hero_video_url = '/media/heroes/auto-hero.mp4'
where slug = 'axiom-auto'
   or hero_video_url = '/media/auto-hero.mp4';
