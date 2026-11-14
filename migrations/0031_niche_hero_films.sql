-- Default hero films for niches that were stills. Custom uploads stay put.

update shops set hero_video_url = '/media/heroes/salon.mp4'
where niche = 'salon' and coalesce(hero_video_url, '') = ''
  and hero_image_url in ('/media/heroes/salon.jpg', '/media/heroes/salon.svg');

update shops set hero_video_url = '/media/heroes/wellness.mp4'
where niche = 'wellness' and coalesce(hero_video_url, '') = ''
  and hero_image_url in ('/media/heroes/wellness.jpg', '/media/heroes/wellness.svg');

update shops set hero_video_url = '/media/heroes/clean.mp4'
where niche = 'clean' and coalesce(hero_video_url, '') = ''
  and hero_image_url in ('/media/heroes/clean.jpg', '/media/heroes/clean.svg');

update shops set hero_video_url = '/media/heroes/counsel.mp4'
where niche = 'counsel' and coalesce(hero_video_url, '') = ''
  and hero_image_url in ('/media/heroes/counsel.jpg', '/media/heroes/counsel.svg');

update shops set hero_video_url = '/media/heroes/events.mp4'
where niche = 'events' and coalesce(hero_video_url, '') = ''
  and hero_image_url in ('/media/heroes/events.jpg', '/media/heroes/events.svg');
