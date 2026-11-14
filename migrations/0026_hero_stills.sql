-- Swap the last placeholder heroes for the uploaded stills.
-- Only rows still pointing at those exact placeholders are updated.

update shops set hero_image_url = '/media/heroes/practice.jpg' where hero_image_url = '/media/heroes/practice.svg';
update shops set hero_image_url = '/media/heroes/roofing.jpg' where hero_image_url = '/media/heroes/roofing.svg';
update shops set hero_image_url = '/media/heroes/plumbing.jpg' where hero_image_url = '/media/heroes/plumbing.svg';
