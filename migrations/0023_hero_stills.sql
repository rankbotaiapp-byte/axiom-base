-- Swap placeholder hero files for the uploaded stills and loops.
-- Only rows still pointing at those exact placeholders are updated.

update shops set hero_image_url = '/media/heroes/salon.jpg' where hero_image_url = '/media/heroes/salon.svg';
update shops set hero_image_url = '/media/heroes/events.jpg' where hero_image_url = '/media/heroes/events.svg';
update shops set hero_image_url = '/media/heroes/hvac.jpg' where hero_image_url = '/media/heroes/hvac.svg';
update shops set hero_image_url = '/media/heroes/electrical.jpg' where hero_image_url = '/media/heroes/electrical.svg';

update shops
set hero_video_url = '/media/heroes/guide.mp4'
where niche = 'guide' and coalesce(hero_video_url, '') = '';

update shops
set hero_image_url = '', hero_video_url = '/media/heroes/photo.mp4'
where niche = 'photo'
  and hero_image_url in ('/media/heroes/photo.svg', '')
  and coalesce(hero_video_url, '') = '';
