-- Swap the next placeholder heroes for the uploaded stills.
-- Only rows still pointing at those exact placeholders are updated.

update shops set hero_image_url = '/media/heroes/beauty.jpg' where hero_image_url = '/media/heroes/beauty.svg';
update shops set hero_image_url = '/media/heroes/lessons.jpg' where hero_image_url = '/media/heroes/lessons.svg';
update shops set hero_image_url = '/media/heroes/pets.jpg' where hero_image_url = '/media/heroes/pets.svg';
update shops set hero_image_url = '/media/heroes/clean.jpg' where hero_image_url = '/media/heroes/clean.svg';
update shops set hero_image_url = '/media/heroes/counsel.jpg' where hero_image_url = '/media/heroes/counsel.svg';
